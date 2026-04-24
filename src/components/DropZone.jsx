import { useState, useRef, useEffect } from 'react';

/**
 * DropZone — Herbruikbaar drag-and-drop invoerveld
 * 
 * Accepteert zowel gesleepte bestanden als geplakte tekst.
 * Toont een prachtige animatie bij het slepen.
 */
export default function DropZone({ 
  onTextReceived, 
  onFileReceived, 
  acceptedExtensions = ['.txt'],
  placeholder = 'Plak hier je tekst, of sleep een bestand hierheen…',
  showTextArea = true,
  fileOnly = false,
  compact = false,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const textAreaRef = useRef(null);
  const dragCounter = useRef(0);

  function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      
      if (onFileReceived) {
        onFileReceived(file);
      } else if (onTextReceived) {
        // Lees als tekst
        const reader = new FileReader();
        reader.onload = (ev) => onTextReceived(ev.target.result);
        reader.readAsText(file);
      }
      return;
    }

    // Geplakte tekst vanuit de drop
    const text = e.dataTransfer.getData('text/plain');
    if (text && onTextReceived) {
      onTextReceived(text);
    }
  }

  function handlePaste(e) {
    if (!showTextArea || fileOnly) return;
    // Laat standaard paste-gedrag toe voor het textarea
  }

  function handleTextChange(e) {
    if (onTextReceived) {
      onTextReceived(e.target.value);
    }
  }

  function handleFileInput(e) {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      if (onFileReceived) {
        onFileReceived(file);
      } else if (onTextReceived) {
        const reader = new FileReader();
        reader.onload = (ev) => onTextReceived(ev.target.result);
        reader.readAsText(file);
      }
    }
  }

  return (
    <div
      className={`dropzone ${isDragging ? 'dropzone--dragging' : ''} ${compact ? 'dropzone--compact' : ''} ${fileOnly ? 'dropzone--file-only' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="dropzone__overlay">
          <div className="dropzone__overlay-icon">📄</div>
          <div className="dropzone__overlay-text">Laat los om te uploaden</div>
        </div>
      )}

      {children ? (
        children
      ) : fileOnly ? (
        <div className="dropzone__file-prompt">
          <div className="dropzone__file-icon">
            {fileName ? '✅' : '📂'}
          </div>
          <div className="dropzone__file-text">
            {fileName 
              ? <><strong>{fileName}</strong> geladen</>
              : placeholder
            }
          </div>
          <label className="dropzone__file-button">
            Kies bestand
            <input
              type="file"
              accept={acceptedExtensions.join(',')}
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      ) : showTextArea ? (
        <textarea
          ref={textAreaRef}
          className="dropzone__textarea"
          placeholder={placeholder}
          onPaste={handlePaste}
          onChange={handleTextChange}
          spellCheck={false}
        />
      ) : null}
    </div>
  );
}
