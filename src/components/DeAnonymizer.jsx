import { useState } from 'react';
import DropZone from './DropZone';
import { importMappingFile, applyMappings, copyToClipboard } from '../utils/fileHandler';
import { writeBackToFile } from '../utils/documentHandler';

/**
 * DeAnonymizer — Terugdraaien tabblad
 *
 * Twee modi:
 *   1. Tekst-modus: plak geanonimiseerde tekst → herstel naar origineel
 *   2. Bestand-modus: upload geanonimiseerd .docx/.xlsx/.csv → herstel bestand
 */

const DOC_EXTENSIONS = ['.docx', '.xlsx', '.xls', '.csv'];

export default function DeAnonymizer() {
  // Omzettingsbestand
  const [mappings, setMappings] = useState(null);
  const [mappingFileName, setMappingFileName] = useState('');

  // Tekst-modus
  const [anonText, setAnonText] = useState('');
  const [restoredText, setRestoredText] = useState('');
  const [copied, setCopied] = useState(false);

  // Bestand-modus
  const [docFile, setDocFile] = useState(null);
  const [isRestoringFile, setIsRestoringFile] = useState(false);
  const [fileRestored, setFileRestored] = useState(false);

  const [error, setError] = useState('');

  // ── Omzettingsbestand laden ─────────────────────────────────────────────────

  async function handleMappingFile(file) {
    try {
      setError('');
      const loadedMappings = await importMappingFile(file);
      setMappings(loadedMappings);
      setMappingFileName(file.name);

      // Als we al tekst hebben, direct toepassen
      if (anonText.trim()) {
        setRestoredText(applyMappings(anonText, loadedMappings, true));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // ── Tekst-modus ──────────────────────────────────────────────────────────

  function handleTextReceived(text) {
    setAnonText(text);
    setError('');
    setDocFile(null);
    setFileRestored(false);
    if (mappings && text.trim()) {
      setRestoredText(applyMappings(text, mappings, true));
    } else {
      setRestoredText('');
    }
  }

  async function handleCopy() {
    const success = await copyToClipboard(restoredText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  // ── Bestand-modus ────────────────────────────────────────────────────────

  function handleDocFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'doc') {
      setError('DOC_ERROR');
      return;
    }
    if (!DOC_EXTENSIONS.includes(`.${ext}`)) {
      setError(`Bestandstype .${ext} niet ondersteund. Gebruik .docx, .xlsx, .xls of .csv.`);
      return;
    }
    setDocFile(file);
    setAnonText('');
    setRestoredText('');
    setFileRestored(false);
    setError('');
  }

  async function handleRestoreFile() {
    if (!docFile || !mappings) return;
    setIsRestoringFile(true);
    try {
      await writeBackToFile(docFile, mappings, true);
      setFileRestored(true);
    } catch (err) {
      setError(`Fout bij herstellen: ${err.message}`);
    } finally {
      setIsRestoringFile(false);
    }
  }

  return (
    <div className="de-anonymizer">
      <div className="de-anonymizer__inputs">

        {/* Stap 1: Omzettingsbestand */}
        <div className="de-anonymizer__section">
          <h3 className="de-anonymizer__section-title">
            <span className="de-anonymizer__step-number">1</span>
            Upload het omzettingsbestand
          </h3>
          
          <label className="anonymizer__base-upload" style={{ cursor: 'pointer', marginBottom: '1rem' }}>
            <span className="anonymizer__base-upload-label">Selecteer:</span>
            <div className="dropzone__file-button" style={{ margin: 0, padding: '0.35rem 0.7rem' }}>
              Laad omzettingsbestand (.anon)
              <input 
                type="file" 
                accept=".anon,.json" 
                style={{ display: 'none' }} 
                onChange={(e) => { if (e.target.files[0]) handleMappingFile(e.target.files[0]); e.target.value = ''; }} 
              />
            </div>
            {mappings && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span>✅ {mappingFileName} ({mappings.length} items)</span>
              </div>
            )}
          </label>
        </div>

        {/* Stap 2: Tekst OF bestand */}
        <div className="de-anonymizer__section">
          <h3 className="de-anonymizer__section-title">
            <span className="de-anonymizer__step-number">2</span>
            Plak de tekst of herstel een bestand
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Tekst-invoer */}
            <DropZone
              onTextReceived={handleTextReceived}
              placeholder="Plak hier de geanonimiseerde tekst…"
              compact={true}
            />

            {/* Bestand-uploaden */}
            <div className="de-anonymizer__file-restore-area">
              <span style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Of herstel een document:
              </span>
              <DropZone
                onFileReceived={handleDocFile}
                acceptedExtensions={DOC_EXTENSIONS}
                fileOnly={true}
                subtitle="Sleep je bestand hierheen of"
                fileButtonLabel="Kies bestand"
                hint=".docx · .xlsx · .xls · .csv · max 100 MB"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Foutmelding */}
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

      {/* Bestand herstellen */}
      {docFile && mappings && !restoredText && (
        <div className="de-anonymizer__result">
          <h3 className="de-anonymizer__result-title">📄 Bestand herstellen</h3>
          <p style={{ marginBottom: '1rem', opacity: 0.8, fontSize: '0.95rem' }}>
            Het bestand <strong>{docFile.name}</strong> wordt hersteld naar het origineel met behulp van
            het omzettingsbestand <strong>{mappingFileName}</strong>.
          </p>
          {fileRestored ? (
            <div className="file-anonymizer__done-banner">
              ✅ Bestand hersteld en gedownload!
            </div>
          ) : (
            <button
              className="btn btn--primary"
              onClick={handleRestoreFile}
              disabled={isRestoringFile}
              style={{ width: '100%' }}
            >
              {isRestoringFile ? '⏳ Herstellen…' : '🔓 Herstel & Download origineel bestand'}
            </button>
          )}
        </div>
      )}

      {/* Tekst-resultaat */}
      {restoredText && (
        <div className="de-anonymizer__result">
          <h3 className="de-anonymizer__result-title">✨ Herstelde tekst</h3>
          <div className="de-anonymizer__result-text">{restoredText}</div>
          <button
            className={`btn btn--primary ${copied ? 'btn--success' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✅ Gekopieerd!' : '📋 Kopieer Herstelde Tekst'}
          </button>
        </div>
      )}
    </div>
  );
}
