/**
 * documentHandler.js — Document verwerking (.docx, .xlsx, .csv)
 *
 * Two-pass architectuur:
 *   Pass 1: tekst extraheren → PII detecteren → tabel tonen aan gebruiker
 *   Pass 2: mappings terugschrijven naar het originele bestand (met opmaakbehoud)
 *
 * Per formaat:
 *   CSV   — platte tekst, triviale split/join
 *   DOCX  — JSZip + DOMParser, paragraph-level run-normalisatie
 *   XLSX  — ExcelJS (dynamic import), cell.value vervangen
 *
 * Alle verwerking vindt lokaal in de browser plaats. Geen server, geen externe calls.
 */

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

/**
 * Leest een File als ArrayBuffer (voor binaire formaten).
 */
function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Kon het bestand niet lezen.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Leest een File als tekst.
 */
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Kon het bestand niet als tekst lezen.'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Past alle mappings toe op een tekst (langste eerst, split/join patroon).
 * @param {string} text
 * @param {Array} mappings  — [{ original, replacement }]
 * @param {boolean} reverse — true = de-anonimiseren
 */
function applyMappingsToText(text, mappings, reverse = false) {
  if (!mappings || mappings.length === 0) return text;
  const sorted = [...mappings].sort((a, b) => {
    const aKey = reverse ? a.replacement : a.original;
    const bKey = reverse ? b.replacement : b.original;
    return bKey.length - aKey.length;
  });
  let result = text;
  for (const m of sorted) {
    const from = reverse ? m.replacement : m.original;
    const to   = reverse ? m.original   : m.replacement;
    if (!from) continue;
    result = result.split(from).join(to);
  }
  return result;
}

/**
 * Triggert een bestandsdownload in de browser.
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Geeft een gestempelde bestandsnaam terug.
 * Voorbeeld: "geanonimiseerd-2026-04-22-14u30.docx"
 */
function stampedName(originalName, suffix = '') {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}u${String(now.getMinutes()).padStart(2,'0')}`;
  const ext = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : '';
  const base = originalName.includes('.') ? originalName.slice(0, originalName.lastIndexOf('.')) : originalName;
  return `${base}${suffix ? '-' + suffix : ''}-${stamp}${ext}`;
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

/**
 * Extraheert de volledige tekst uit een CSV-bestand.
 * Retourneert een platte string van alle cel-waarden voor PII-detectie.
 */
export async function extractTextFromCSV(file) {
  return readAsText(file);
}

/**
 * Past mappings toe op de CSV-tekst en biedt de download aan.
 * Behoudt de originele structuur van het bestand volledig.
 * @param {File}   file
 * @param {Array}  mappings
 * @param {boolean} reverse
 */
export async function writeBackToCSV(file, mappings, reverse = false) {
  const text = await readAsText(file);
  const result = applyMappingsToText(text, mappings, reverse);
  const blob = new Blob([result], { type: 'text/csv;charset=utf-8;' });
  const suffix = reverse ? 'hersteld' : 'geanonimiseerd';
  downloadBlob(blob, stampedName(file.name, suffix));
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

/**
 * Extraheert de platte tekst uit een DOCX via mammoth.
 * Gebruikt alleen voor Pass 1 (PII detectie). Opmaakinformatie wordt weggegooid.
 */
export async function extractTextFromDOCX(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await readAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Twee-stap DOCX vervanging — maximaal opmaakbehoud.
 *
 * Stap 1 — Per-<w:t> vervanging (veilig, geen structuurwijziging):
 *   Past elke mapping toe op elk <w:t> element afzonderlijk.
 *   Opmaak, <w:br/>, alinea-indeling: alles blijft intact.
 *   Werkt voor ~95% van gevallen (PII volledig binnen één run).
 *
 * Stap 2 — Cross-run fallback (alleen als stap 1 onvoldoende is):
 *   Detecteert mappings die over meerdere runs verdeeld zijn.
 *   Voegt alleen die runs samen, en ALLEEN de tekst-runs (niet de <w:br>-runs).
 *   Verwijdert <w:b> en <w:bCs> uit de run properties van de doelrun
 *   zodat gemergte tekst niet onbedoeld bold wordt.
 */
async function applyMappingsToDOCXXml(xmlString, mappings, reverse) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const paragraphs = doc.querySelectorAll('p');

  // Sorteer: langste match eerst om deelmatches te voorkomen
  const sorted = [...mappings].sort((a, b) => {
    const aKey = reverse ? a.replacement : a.original;
    const bKey = reverse ? b.replacement : b.original;
    return bKey.length - aKey.length;
  });

  for (const para of paragraphs) {
    const textNodes = [...para.querySelectorAll('t')];
    if (textNodes.length === 0) continue;

    // ── Stap 1: per-<w:t> vervanging ──────────────────────────────────────
    for (const t of textNodes) {
      const before = t.textContent;
      if (!before) continue;
      const after = applyMappingsToText(before, sorted, reverse);
      if (after !== before) {
        t.textContent = after;
        if (after.startsWith(' ') || after.endsWith(' ')) {
          t.setAttribute('xml:space', 'preserve');
        }
      }
    }

    // ── Stap 2: cross-run fallback ─────────────────────────────────────────
    // Controleer voor elke mapping of die (na stap 1) nog steeds over runs
    // verdeeld staat. Dit is het geval als de mapping-string niet in één
    // <w:t> voorkomt maar WEL in de gecombineerde alineatekst.
    const fullAfterStep1 = textNodes.map(n => n.textContent).join('');

    for (const m of sorted) {
      const from = reverse ? m.replacement : m.original;
      const to   = reverse ? m.original   : m.replacement;
      if (!from || !fullAfterStep1.includes(from)) continue;

      // Kijk of 'from' al volledig in één <w:t> zit (stap 1 heeft het al afgehandeld)
      const alreadyHandled = textNodes.some(t => t.textContent.includes(to));
      if (alreadyHandled) continue;

      // 'from' staat verdeeld over meerdere runs: doe gericht merge
      // Vind de runs die samen de gezochte tekst bevatten
      let accumulated = '';
      let startIdx = -1;
      let endIdx = -1;

      for (let i = 0; i < textNodes.length; i++) {
        accumulated += textNodes[i].textContent;
        if (accumulated.includes(from)) {
          endIdx = i;
          // Zoek het eerste run-begin van de match
          let partial = '';
          for (let j = i; j >= 0; j--) {
            partial = textNodes[j].textContent + partial;
            if (partial.includes(from)) {
              startIdx = j;
            } else {
              break;
            }
          }
          break;
        }
      }

      if (startIdx === -1 || endIdx === -1) continue;

      // Combineer de betrokken runs en vervang
      const combinedText = textNodes.slice(startIdx, endIdx + 1).map(n => n.textContent).join('');
      const replacedText = combinedText.split(from).join(to);

      // Schrijf naar de EERSTE betrokken <w:t>, maar strip bold om
      // onbedoelde opmaak-overerving te voorkomen
      const targetT = textNodes[startIdx];
      targetT.textContent = replacedText;
      if (replacedText.startsWith(' ') || replacedText.endsWith(' ')) {
        targetT.setAttribute('xml:space', 'preserve');
      }

      // Verwijder <w:b> en <w:bCs> uit de run-properties van de doelrun
      // zodat gemergte tekst niet per ongeluk bold wordt
      const targetRun = targetT.parentNode;
      if (targetRun) {
        const rPr = targetRun.querySelector('rPr');
        if (rPr) {
          rPr.querySelectorAll('b, bCs').forEach(el => el.parentNode.removeChild(el));
        }
      }

      // Leeg de overige betrokken <w:t> elementen (laat <w:br> ongemoeid)
      for (let i = startIdx + 1; i <= endIdx; i++) {
        textNodes[i].textContent = '';
      }
    }
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}



/**
 * Past mappings toe op een DOCX-bestand en biedt de download aan.
 * Behoudt de originele opmaak via JSZip + paragraph-level run normalisatie.
 * @param {File}   file
 * @param {Array}  mappings
 * @param {boolean} reverse
 */
export async function writeBackToDOCX(file, mappings, reverse = false) {
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await readAsArrayBuffer(file);
  const zip = await JSZip.loadAsync(arrayBuffer);

  // De XML-bestanden die tekst bevatten in een DOCX
  const textFiles = [
    'word/document.xml',
    'word/header1.xml',
    'word/header2.xml',
    'word/header3.xml',
    'word/footer1.xml',
    'word/footer2.xml',
    'word/footer3.xml',
  ];

  for (const path of textFiles) {
    if (!zip.file(path)) continue;
    const xmlString = await zip.file(path).async('string');
    const modified = await applyMappingsToDOCXXml(xmlString, mappings, reverse);
    zip.file(path, modified);
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  const suffix = reverse ? 'hersteld' : 'geanonimiseerd';
  downloadBlob(blob, stampedName(file.name, suffix));
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────

/**
 * Extraheert alle tekst-celwaarden uit een XLSX als platte string.
 * Getallen en formules worden overgeslagen (geen PII).
 */
export async function extractTextFromXLSX(file) {
  const ExcelJS = (await import('exceljs')).default;
  const arrayBuffer = await readAsArrayBuffer(file);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const texts = [];
  workbook.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.type === ExcelJS.ValueType.String && typeof cell.value === 'string') {
          texts.push(cell.value);
        } else if (cell.type === ExcelJS.ValueType.RichText && cell.value?.richText) {
          texts.push(cell.value.richText.map(r => r.text).join(''));
        }
      });
    });
  });

  return texts.join('\n');
}

/**
 * Past mappings toe op alle tekst-cellen in een XLSX en biedt de download aan.
 * ExcelJS bewaart het volledige workbook-model inclusief stijlen, borders, kleuren.
 * @param {File}   file
 * @param {Array}  mappings
 * @param {boolean} reverse
 */
export async function writeBackToXLSX(file, mappings, reverse = false) {
  const ExcelJS = (await import('exceljs')).default;
  const arrayBuffer = await readAsArrayBuffer(file);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  workbook.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        // Platte tekst-cel
        if (cell.type === ExcelJS.ValueType.String && typeof cell.value === 'string') {
          const replaced = applyMappingsToText(cell.value, mappings, reverse);
          if (replaced !== cell.value) cell.value = replaced;
        }
        // Rich Text cel (behoud de runs, pas alleen de tekst aan)
        else if (cell.type === ExcelJS.ValueType.RichText && cell.value?.richText) {
          let changed = false;
          const newRichText = cell.value.richText.map(run => {
            const replaced = applyMappingsToText(run.text, mappings, reverse);
            if (replaced !== run.text) changed = true;
            return { ...run, text: replaced };
          });
          if (changed) {
            cell.value = { richText: newRichText };
          }
        }
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const suffix = reverse ? 'hersteld' : 'geanonimiseerd';
  downloadBlob(blob, stampedName(file.name, suffix));
}

// ─── Router ───────────────────────────────────────────────────────────────────

/**
 * Extraheert tekst uit een bestand op basis van het bestandstype.
 * Retourneert een platte string voor PII-detectie.
 */
export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'csv':
      return extractTextFromCSV(file);
    case 'docx':
      return extractTextFromDOCX(file);
    case 'xlsx':
    case 'xls':
      return extractTextFromXLSX(file);
    default:
      throw new Error(`Bestandstype .${ext} wordt niet ondersteund.`);
  }
}

/**
 * Past mappings toe op een bestand en biedt het geanonimiseerde bestand als download aan.
 */
export async function writeBackToFile(file, mappings, reverse = false) {
  const ext = file.name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'csv':
      return writeBackToCSV(file, mappings, reverse);
    case 'docx':
      return writeBackToDOCX(file, mappings, reverse);
    case 'xlsx':
    case 'xls':
      return writeBackToXLSX(file, mappings, reverse);
    default:
      throw new Error(`Bestandstype .${ext} wordt niet ondersteund.`);
  }
}
