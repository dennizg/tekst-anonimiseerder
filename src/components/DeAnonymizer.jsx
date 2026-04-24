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
  // Sleutelbestand
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

  // ── Sleutelbestand laden ─────────────────────────────────────────────────

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

        {/* Stap 1: Sleutelbestand */}
        <div className="de-anonymizer__section">
          <h3 className="de-anonymizer__section-title">
            <span className="de-anonymizer__step-number">1</span>
            Upload het sleutelbestand
          </h3>
          <DropZone
            onFileReceived={handleMappingFile}
            acceptedExtensions={['.anon', '.json']}
            placeholder="Sleep je .anon bestand hierheen of klik om te kiezen…"
            fileOnly={true}
            compact={true}
          />
          {mappings && (
            <div className="de-anonymizer__file-info">
              ✅ <strong>{mappingFileName}</strong> — {mappings.length} omzettingen gevonden
            </div>
          )}
        </div>

        {/* Stap 2: Tekst OF bestand */}
        <div className="de-anonymizer__section">
          <h3 className="de-anonymizer__section-title">
            <span className="de-anonymizer__step-number">2</span>
            Plak de tekst of upload een bestand
          </h3>

          {/* Tekst-invoer */}
          <DropZone
            onTextReceived={handleTextReceived}
            placeholder="Plak hier de geanonimiseerde tekst…"
            compact={true}
          />

          {/* Bestand-uploaden */}
          <div className="de-anonymizer__file-upload">
            <span className="de-anonymizer__file-upload-label">Of herstel een bestand:</span>
            <label className="btn btn--outline btn--small" style={{ margin: 0 }}>
              📂 Kies .docx / .xlsx / .csv
              <input
                type="file"
                accept={DOC_EXTENSIONS.join(',')}
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files[0]) handleDocFile(e.target.files[0]); e.target.value = ''; }}
              />
            </label>
            {docFile && (
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>📄 {docFile.name}</span>
            )}
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
            het sleutelbestand <strong>{mappingFileName}</strong>.
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
