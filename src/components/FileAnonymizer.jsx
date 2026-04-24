import { useState, useCallback, useMemo, useEffect } from 'react';
import ReplacementTable from './ReplacementTable';
import TextHighlighter from './TextHighlighter';
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
  docx: { icon: '📝', label: 'Word document', color: '#2b579a' },
  xlsx: { icon: '📊', label: 'Excel werkblad', color: '#217346' },
  xls:  { icon: '📊', label: 'Excel werkblad', color: '#217346' },
  csv:  { icon: '📋', label: 'CSV bestand', color: '#d97706' },
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
  const [isDragging, setIsDragging] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);

  // Stap 2 — detectie, tekst en tabel
  const [mappings, setMappings] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Stap 3 — anonimiseren
  const [isWriting, setIsWriting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Optioneel vorig sleutelbestand
  const [baseMappings, setBaseMappings] = useState([]);
  const [baseFileName, setBaseFileName] = useState(null);

  const animatedIcons = useMemo(() => ['📁', '📄', '📊', '📝'], []);

  useEffect(() => {
    if (showResults || isProcessing) return;
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % animatedIcons.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [showResults, isProcessing, animatedIcons]);

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
    if (incoming.size > 20 * 1024 * 1024) {
      setError('Bestand is te groot (max 20 MB).');
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

  function handleDragOver(e) { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave() { setIsDragging(false); }
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }
  function handleInputChange(e) {
    const selected = e.target.files[0];
    if (selected) handleFile(selected);
    e.target.value = '';
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

  // ── Vorig sleutelbestand laden ─────────────────────────────────────────────

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
  const fileTypeInfo = FILE_TYPE_LABELS[ext] || { icon: '📄', label: 'Bestand', color: '#6b7280' };

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

            <div className="anonymizer__base-upload">
              <span className="anonymizer__base-upload-label">Optioneel:</span>
              <label className="btn btn--outline btn--small" style={{ margin: 0 }}>
                Laad vorig sleutelbestand (.anon)
                <input type="file" accept=".anon" style={{ display: 'none' }} onChange={handleBaseFile} />
              </label>
              {baseFileName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span>✅ {baseFileName} ({baseMappings.length} items)</span>
                  <button
                    className="btn btn--ghost btn--small"
                    style={{ padding: '0.2rem 0.5rem', color: 'var(--color-error)' }}
                    onClick={() => { setBaseFileName(null); setBaseMappings([]); }}
                    title="Verwijder basisbestand"
                  >✕</button>
                </div>
              )}
            </div>

            <div
              className={`file-anonymizer__dropzone ${isDragging ? 'file-anonymizer__dropzone--dragging' : ''} ${isProcessing ? 'file-anonymizer__dropzone--loading' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isProcessing ? (
                <div className="file-anonymizer__loading">
                  <div className="file-anonymizer__spinner" />
                  <p>Bestand analyseren…</p>
                </div>
              ) : (
                <>
                  <div className="file-anonymizer__dropzone-icon">{animatedIcons[iconIndex]}</div>
                  <p className="file-anonymizer__dropzone-text">Sleep je bestand hierheen of</p>
                  <label className="btn btn--primary">
                    Kies bestand
                    <input
                      type="file"
                      accept={ACCEPTED_EXTENSIONS.join(',')}
                      style={{ display: 'none' }}
                      onChange={handleInputChange}
                    />
                  </label>
                  <p className="file-anonymizer__dropzone-hint">.docx · .xlsx · .xls · .csv · max 20 MB</p>
                </>
              )}
            </div>

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
              <span className="file-anonymizer__file-icon" style={{ color: fileTypeInfo.color }}>
                {fileTypeInfo.icon}
              </span>
              <div>
                <div className="file-anonymizer__file-name">{file.name}</div>
                <div className="file-anonymizer__file-type">{fileTypeInfo.label}</div>
              </div>
            </div>
            <button className="btn btn--ghost btn--small" onClick={handleReset}>
              ✕ Ander bestand
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
              <h2 className="glass-panel__title">
                Inhoud van het bestand
              </h2>
              <TextHighlighter
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
                  {replacementMode === 'realistic' ? '🔢' : '🎭'}
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
                  : '🛡️ Anonimiseer & Download (+ sleutelbestand)'}
            </button>
            <p className="anonymizer__actions-hint">
              Je ontvangt twee bestanden: eerst het sleutelbestand (.anon) en daarna het geanonimiseerde document.
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
