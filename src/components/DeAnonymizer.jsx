import { useState } from 'react';
import DropZone from './DropZone';
import { importMappingFile, applyMappings, copyToClipboard } from '../utils/fileHandler';

/**
 * DeAnonymizer — Tab 2: Geanonimiseerde tekst terugdraaien
 * 
 * De gebruiker uploadt een .anon bestand en plakt de geanonimiseerde tekst.
 * Het systeem zet alle vervangingen terug naar de originele waarden.
 */
export default function DeAnonymizer() {
  const [anonText, setAnonText] = useState('');
  const [mappings, setMappings] = useState(null);
  const [mappingFileName, setMappingFileName] = useState('');
  const [restoredText, setRestoredText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleMappingFile(file) {
    try {
      setError('');
      const loadedMappings = await importMappingFile(file);
      setMappings(loadedMappings);
      setMappingFileName(file.name);
      
      // Als we al tekst hebben, direct toepassen
      if (anonText.trim()) {
        const result = applyMappings(anonText, loadedMappings, true);
        setRestoredText(result);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleTextReceived(text) {
    setAnonText(text);
    setError('');
    
    // Als we al mappings hebben, direct toepassen
    if (mappings && text.trim()) {
      const result = applyMappings(text, mappings, true);
      setRestoredText(result);
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

  return (
    <div className="de-anonymizer">
      <div className="de-anonymizer__inputs">
        {/* Omzettingsbestand uploaden */}
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

        {/* Geanonimiseerde tekst invoeren */}
        <div className="de-anonymizer__section">
          <h3 className="de-anonymizer__section-title">
            <span className="de-anonymizer__step-number">2</span>
            Plak de geanonimiseerde tekst
          </h3>
          <DropZone
            onTextReceived={handleTextReceived}
            placeholder="Plak hier de geanonimiseerde tekst…"
            compact={true}
          />
        </div>
      </div>

      {/* Foutmelding */}
      {error && (
        <div className="de-anonymizer__error">
          ⚠️ {error}
        </div>
      )}

      {/* Resultaat */}
      {restoredText && (
        <div className="de-anonymizer__result">
          <h3 className="de-anonymizer__result-title">
            ✨ Herstelde tekst
          </h3>
          <div className="de-anonymizer__result-text">
            {restoredText}
          </div>
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
