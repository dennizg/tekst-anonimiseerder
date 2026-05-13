/**
 * fileHandler.js — Export/Import van .anon bestanden
 * 
 * Beheert het opslaan en laden van de omzettingstabel
 * in een compact JSON-formaat met .anon extensie.
 */

/**
 * Exporteert de omzettingstabel als een .anon bestand (JSON).
 * Triggert automatisch een download in de browser.
 */
export function exportMappingFile(mappings, originalFilename = null) {
  const data = {
    version: '1.0',
    created: new Date().toISOString(),
    application: 'Tekst Anonimiseerder',
    mappings: mappings.map(m => ({
      original: m.original,
      replacement: m.replacement,
      category: m.category,
    })),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  
  // Bestandsnaam: yyyy-mm-dd Omzettingsbestand - Naam.anon of [XXXX]-[XXXX].anon
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  let namePart;
  if (originalFilename) {
    const base = originalFilename.includes('.') ? originalFilename.slice(0, originalFilename.lastIndexOf('.')) : originalFilename;
    namePart = `- ${base}`;
  } else {
    // Genereer 2 willekeurige blokken van 4 karakters via veilige Web Crypto API
    const cryptoArray = new Uint8Array(4);
    window.crypto.getRandomValues(cryptoArray);
    const randomStr = Array.from(cryptoArray).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    namePart = `[${randomStr.substring(0, 4)}]-[${randomStr.substring(4, 8)}]`;
  }
  
  link.download = `${dateStr} Omzettingsbestand ${namePart}.anon`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Importeert een .anon bestand en retourneert de mappings.
 * @param {File} file - Het geüploade .anon bestand
 * @returns {Promise<Array>} - De mappings uit het bestand
 */
export function importMappingFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.mappings || !Array.isArray(data.mappings)) {
          reject(new Error('Ongeldig .anon bestand: geen mappings gevonden.'));
          return;
        }
        
        // Valideer dat elke mapping de juiste velden heeft
        const validMappings = data.mappings.filter(
          m => m.original && m.replacement && m.category
        );
        
        if (validMappings.length === 0) {
          reject(new Error('Geen geldige omzettingen gevonden in het bestand.'));
          return;
        }
        
        resolve(validMappings);
      } catch {
        reject(new Error('Kon het bestand niet lezen. Is het een geldig .anon bestand?'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Fout bij het lezen van het bestand.'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Leest de inhoud van een tekstbestand (.txt).
 * @param {File} file - Het tekstbestand
 * @returns {Promise<string>} - De tekst uit het bestand
 */
export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Fout bij het lezen van het tekstbestand.'));
    reader.readAsText(file);
  });
}

/**
 * Controleert of een karakter een letter is (inclusief Unicode/diakritische tekens).
 * Wordt gebruikt om woordgrenzen te bepalen bij vervangingen.
 */
export function isLetterChar(ch) {
  if (!ch) return false;
  return /\p{L}/u.test(ch);
}

/**
 * Escaped speciale regex-tekens in een string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Bouwt een regex die een zoekterm alleen matcht als er geen letters
 * direct voor of na staan. Leestekens, spaties, regeleindes etc. zijn wel OK.
 */
export function buildWordBoundaryRegex(searchTerm) {
  const escaped = escapeRegex(searchTerm);
  // Gebruik lookbehind/lookahead: match alleen als er geen Unicode-letter aangrenzend is
  return new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'gu');
}

/**
 * Past alle mappings toe op een tekst (vervang origineel met vervanging).
 * Sorteert op lengte (langste eerst) om deelvervangingen te voorkomen.
 * Vervangt alleen hele woorden: "Sam" wordt niet vervangen in "samen".
 */
export function applyMappings(text, mappings, reverse = false) {
  if (!mappings || mappings.length === 0) return text;
  
  // Sorteer op lengte (langste eerst) om deelvervangingen te voorkomen
  const sorted = [...mappings].sort((a, b) => {
    const aLen = reverse ? b.replacement.length : b.original.length;
    const bLen = reverse ? a.replacement.length : a.original.length;
    return aLen - bLen;
  });
  
  let result = text;
  for (const mapping of sorted) {
    const searchTerm = reverse ? mapping.replacement : mapping.original;
    const replaceTerm = reverse ? mapping.original : mapping.replacement;
    
    if (!searchTerm) continue;

    // Vervang alleen als de zoekterm niet aan andere letters vastgeplakt zit.
    // Leestekens (komma, punt, etc.), spaties en regeleindes worden wel als grens gezien.
    const regex = buildWordBoundaryRegex(searchTerm);
    result = result.replace(regex, replaceTerm);
  }
  
  return result;
}

/**
 * Kopieert tekst naar het klembord.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback voor oudere browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
