import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReplacementTable from './ReplacementTable';
import TextHighlighter from './TextHighlighter';
import DropZone from './DropZone';
import { detectPII, detectCategory } from '../utils/detector';
import { generateReplacement, generatePlaceholder, resetGenerator, registerUsedReplacements } from '../utils/generator';
import { exportMappingFile, importMappingFile } from '../utils/fileHandler';
import { extractTextFromFile, writeBackToFile } from '../utils/documentHandler';

/**
 * FileAnonymizer — Tabblad "Bestanden"
 *
 * Two-pass architectuur:
 *   Pass 1: Upload bestand → tekst extraheren → PII detecteren → tabel + tekstweergave tonen
 *   Pass 2: Gebruiker keurt tabel goed → document wordt geanonimiseerd + gedownload
 *
 * Ondersteunde formaten: .docx, .xlsx, .xls, .csv
 */

const ACCEPTED_EXTENSIONS = ['.docx', '.xlsx', '.xls', '.csv'];
const ACCEPTED_MIME = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
];

const FILE_TYPE_LABELS = {
  docx: { label: 'Word document', color: '#2b579a' },
  xlsx: { label: 'Excel werkblad', color: '#217346' },
  xls:  { label: 'Excel werkblad', color: '#217346' },
  csv:  { label: 'CSV bestand', color: '#d97706' },
};

function getFileExt(file) {
  return file?.name?.split('.').pop().toLowerCase() || '';
}

function isAcceptedFile(file) {
  const ext = getFileExt(file);
  return ACCEPTED_EXTENSIONS.includes(`.${ext}`) || ACCEPTED_MIME.includes(file.type);
}

export default function FileAnonymizer({ onShowNotification, replacementMode, toggleReplacementMode }) {
  // Stap 1 — bestand
  const [file, setFile] = useState(null);

  // Stap 2 — detectie, tekst en tabel
  const [mappings, setMappings] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Stap 3 — anonimiseren
  const [isWriting, setIsWriting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Optioneel vorig omzettingsbestand
  const [baseMappings, setBaseMappings] = useState([]);
  const [baseFileName, setBaseFileName] = useState(null);

  // Helper: gebruik de juiste generator op basis van de gekozen modus
  const generate = useCallback((original, category) => {
    return replacementMode === 'placeholder'
      ? generatePlaceholder(original, category)
      : generateReplacement(original, category);
  }, [replacementMode]);

  // Wanneer de modus wisselt: her-genereer alle bestaande vervangingen
  useEffect(() => {
    if (mappings.length === 0) return;
    resetGenerator();
    if (baseMappings.length > 0) registerUsedReplacements(baseMappings);
    const gen = replacementMode === 'placeholder' ? generatePlaceholder : generateReplacement;
    setMappings(prev => prev.map(m => ({
      ...m,
      replacement: gen(m.original, m.category),
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replacementMode]);

  // ── Bestand ontvangen ──────────────────────────────────────────────────────

  const handleFile = useCallback(async (incoming) => {
    if (getFileExt(incoming) === 'doc') {
      setError('DOC_ERROR');
      return;
    }
    if (!isAcceptedFile(incoming)) {
      setError(`Bestandstype niet ondersteund. Gebruik .docx, .xlsx, .xls of .csv.`);
      return;
    }
    if (incoming.size > 100 * 1024 * 1024) {
      setError('Bestand is te groot (max 100 MB).');
      return;
    }

    setFile(incoming);
    setError('');
    setShowResults(false);
    setMappings([]);
    setExtractedText('');
    setIsDone(false);
    setIsProcessing(true);

    try {
      const text = await extractTextFromFile(incoming);

      resetGenerator();
      if (baseMappings.length > 0) registerUsedReplacements(baseMappings);

      const detected = detectPII(text);
      const newMappings = [...baseMappings];

      for (const item of detected) {
        const exists = newMappings.find(m => m.original === item.original);
        if (!exists) {
          newMappings.push({
            original: item.original,
            category: item.category,
            label: item.label,
            replacement: generate(item.original, item.category),
          });
        }
      }

      setExtractedText(text);
      setMappings(newMappings);
      setShowResults(true);
    } catch (err) {
      setError(`Fout bij verwerken: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [baseMappings, generate]);

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  function handleDrop(file) {
    if (file) handleFile(file);
  }

  // ── Tabel handlers ────────────────────────────────────────────────────────

  const handleRemoveMapping = useCallback((index) => {
    setMappings(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateMapping = useCallback((index, field, value) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  }, []);

  const handleAddMapping = useCallback((text) => {
    if (mappings.some(m => m.original === text)) {
      onShowNotification?.(`"${text}" staat al in de tabel.`, 'info');
      return;
    }
    const { category, label } = detectCategory(text);
    const replacement = generate(text, category);
    setMappings(prev => [...prev, { original: text, category, label, replacement }]);
    onShowNotification?.(`"${text}" toegevoegd als ${label}`, 'success');
  }, [mappings, generate, onShowNotification]);

  // ── Vorig omzettingsbestand laden ─────────────────────────────────────────────

  async function handleBaseFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const loaded = await importMappingFile(f);
      setBaseMappings(loaded);
      setBaseFileName(f.name);
      onShowNotification?.(`${loaded.length} items geladen uit ${f.name}.`, 'success');
    } catch (err) {
      onShowNotification?.(err.message, 'error');
    }
    e.target.value = '';
  }

  // ── Pass 2: Anonimiseren en downloaden ────────────────────────────────────

  async function handleAnonymize() {
    if (!file || mappings.length === 0) return;
    setIsWriting(true);
    try {
      exportMappingFile(mappings);
      await writeBackToFile(file, mappings, false);
      setIsDone(true);
      onShowNotification?.('Bestand geanonimiseerd en gedownload!', 'success');
    } catch (err) {
      setError(`Fout bij anonimiseren: ${err.message}`);
    } finally {
      setIsWriting(false);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function handleReset() {
    setFile(null);
    setMappings([]);
    setExtractedText('');
    setShowResults(false);
    setIsProcessing(false);
    setIsDone(false);
    setError('');
    resetGenerator();
  }

  // ── Telmethode voor de tabel (voor bestanden: toon altijd 1 per item) ─────

  const fakeCounts = useMemo(() => {
    const c = {};
    for (const m of mappings) c[m.original] = 1;
    return c;
  }, [mappings]);

  const ext = getFileExt(file);
  const fileTypeInfo = FILE_TYPE_LABELS[ext] || { label: 'Bestand', color: '#6b7280' };


  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="file-anonymizer">

      {/* ── Stap 1: Bestand uploaden ── */}
      {!showResults && (
        <div className="file-anonymizer__upload-stage">
          <div className="glass-panel glass-panel--large">
            <h2 className="glass-panel__title">Bestand anonimiseren</h2>
            <p className="glass-panel__subtitle">
              Upload je <strong>Word-</strong>, <strong>Excel-</strong> of <strong>CSV</strong> bestand.
              De tekst wordt lokaal gescand op persoonsgegevens. Jouw bestand verlaat je computer nooit.
            </p>

            <div className="file-anonymizer__warning">
              <span className="file-anonymizer__warning-icon">⚠️</span>
              <p>
                <strong>Controleer altijd het resultaat zelf</strong> voordat je het geanonimiseerde
                bestand deelt of in een AI-tool uploadt. Automatische detectie mist soms namen of
                contextueel identificeerbare informatie.
              </p>
            </div>

            <label className="anonymizer__base-upload" style={{ cursor: 'pointer' }}>
              <span className="anonymizer__base-upload-label">Optioneel:</span>
              <div className="dropzone__file-button" style={{ margin: 0, padding: '0.35rem 0.7rem' }}>
                Laad vorig omzettingsbestand (.anon)
                <input type="file" accept=".anon" style={{ display: 'none' }} onChange={handleBaseFile} />
              </div>
              {baseFileName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }} onClick={(e) => e.preventDefault()}>
                  <span>✅ {baseFileName} ({baseMappings.length} items)</span>
                  <button
                    className="btn btn--ghost btn--small"
                    style={{ padding: '0.2rem 0.5rem', color: 'var(--color-error)' }}
                    onClick={(e) => { e.preventDefault(); setBaseFileName(null); setBaseMappings([]); }}
                    title="Verwijder basisbestand"
                  >✕</button>
                </div>
              )}
            </label>

            <DropZone
              onFileReceived={handleDrop}
              acceptedExtensions={ACCEPTED_EXTENSIONS}
              fileOnly={true}
              subtitle="Sleep je bestand hierheen of"
              fileButtonLabel="Kies bestand"
              hint=".docx · .xlsx · .xls · .csv · max 100 MB"
            >
              {isProcessing && (
                <div className="file-anonymizer__loading">
                  <div className="file-anonymizer__spinner" />
                  <p>Bestand analyseren…</p>
                </div>
              )}
            </DropZone>

            {error === 'DOC_ERROR' ? (
              <div className="de-anonymizer__error" style={{ display: 'block', lineHeight: 1.5, marginTop: '1.75rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--color-error)' }}>
                  <span>⚠️</span> Oude .doc bestanden worden niet ondersteund
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                  Deze tool werkt 100% veilig in je eigen browser (zonder data te versturen) en ondersteunt daarom alleen het modernere <strong>.docx</strong> formaat. Oude .doc bestanden (van vóór Word 2007) kunnen niet lokaal bewerkt worden.
                </p>
                <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
                  <strong>Oplossing:</strong> Open je bestand even in Word, kies voor <em>Opslaan als...</em> en selecteer <em>Word-document (*.docx)</em>. Upload daarna dat nieuwe bestand!
                </p>
              </div>
            ) : error ? (
              <div className="de-anonymizer__error" style={{ marginTop: '1.75rem' }}>⚠️ {error}</div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Stap 2: Tabel + tekstweergave ── */}
      {showResults && file && (
        <div className="file-anonymizer__results-stage">

          {/* Bestandsinfo balk */}
          <div className="file-anonymizer__file-bar">
            <div className="file-anonymizer__file-info">
              <span className="file-anonymizer__file-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24" style={{ color: fileTypeInfo.color }}>
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                </svg>
              </span>
              <div>
                <div className="file-anonymizer__file-name">{file.name}</div>
                <div className="file-anonymizer__file-type">{fileTypeInfo.label}</div>
              </div>
            </div>
            <button className="btn btn--ghost btn--small" onClick={handleReset}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{flexShrink:0}}><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg> Ander bestand
            </button>
          </div>

          {/* Waarschuwingsbanner */}
          <div className="file-anonymizer__warning">
            <span className="file-anonymizer__warning-icon">⚠️</span>
            <p>
              <strong>Controleer de inhoud hieronder zorgvuldig.</strong> Selecteer ontbrekende
              tekst met je muis of via de zoekbalk om deze toe te voegen aan de tabel.
            </p>
          </div>

          {/* Twee-koloms layout: tekst links, tabel rechts */}
          <div className="anonymizer__panels">
            {/* Linker paneel — geëxtraheerde tekst met highlights */}
            <div className="glass-panel anonymizer__text-panel">
              <TextHighlighter
                title="Inhoud van het bestand"
                text={extractedText}
                mappings={mappings}
                onAddMapping={handleAddMapping}
              />
            </div>

            {/* Rechter paneel — omzettingstabel */}
            <div className="glass-panel anonymizer__table-panel">
              <div className="glass-panel__title-row">
                <h2 className="glass-panel__title">
                  Omzettingstabel
                  <span className="glass-panel__count">{mappings.length}</span>
                </h2>
                <button
                  className="mode-toggle"
                  onClick={toggleReplacementMode}
                  data-tooltip={replacementMode === 'realistic' ? 'Schakel naar placeholders (bijv. Jan → [Persoon1])' : 'Schakel naar fictieve namen (bijv. Jan → Sofie)'}
                  aria-label="Toggle replacement mode"
                >
                  {replacementMode === 'realistic' ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                  )}
                </button>
              </div>
              <ReplacementTable
                mappings={mappings}
                counts={fakeCounts}
                totalReplacements={mappings.length}
                onRemoveMapping={handleRemoveMapping}
                onUpdateMapping={handleUpdateMapping}
                onAddManualMapping={handleAddMapping}
              />
            </div>
          </div>

          {error && <div className="de-anonymizer__error">⚠️ {error}</div>}

          {isDone && (
            <div className="file-anonymizer__done-banner">
              ✅ Bestand geanonimiseerd en gedownload! Controleer het resultaat altijd zelf.
            </div>
          )}

          {/* Actieknop */}
          <div className="anonymizer__actions">
            <button
              className={`btn btn--primary btn--large ${isDone ? 'btn--success' : ''}`}
              onClick={handleAnonymize}
              disabled={mappings.length === 0 || isWriting}
            >
              {isWriting
                ? '⏳ Bestand verwerken…'
                : isDone
                  ? '✅ Opnieuw downloaden'
                  : '🛡️ Anonimiseer & Download (+ omzettingsbestand)'}
            </button>
            <p className="anonymizer__actions-hint">
              Je ontvangt twee bestanden: eerst het omzettingsbestand (.anon) en daarna het geanonimiseerde document.
            </p>
            {replacementMode === 'placeholder' && isDone && (
              <div className="ai-tip-banner">
                <div>
                  <strong>Handige tip voor AI-gebruik:</strong> Geef in een AI altijd de volgende instructie mee: <em>"Behoud alle placeholders tussen vierkante haken (zoals [Persoon1]) exact in deze opmaak."</em><br />
                  Doe je dit niet, dan zal de AI er vaak zelf een draai aan geven (bijvoorbeeld door er [Naam] van te maken). Het terugdraaien mislukt dan, omdat de unieke sleutel ontbreekt.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
