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
  subtitle = '',
  hint = '',
  fileButtonLabel = '',
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

  const fileInputRef = useRef(null);

  const [iconIndex, setIconIndex] = useState(0);
  const animatedIcons = ['file', 'doc', 'chart', 'text'];

  useEffect(() => {
    if (fileOnly && !fileName) {
      const interval = setInterval(() => {
        setIconIndex((prev) => (prev + 1) % animatedIcons.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [fileOnly, fileName]);

  function handleZoneClick(e) {
    if (fileOnly && fileInputRef.current && e.target.tagName !== 'INPUT') {
      fileInputRef.current.click();
    }
  }

  const renderIcon = () => {
    if (fileName) {
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" width="40" height="40" style={{ color: 'var(--color-success)' }}>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }

    const currentIcon = animatedIcons[iconIndex];
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" width="40" height="40" style={{ opacity: 0.7, color: 'var(--color-text-muted)' }}>
        {currentIcon === 'file' && <path fillRule="evenodd" d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"/>}
        {currentIcon === 'doc' && <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>}
        {currentIcon === 'chart' && <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>}
        {currentIcon === 'text' && <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>}
      </svg>
    );
  };

  return (
    <div
      className={`dropzone ${isDragging ? 'dropzone--dragging' : ''} ${compact ? 'dropzone--compact' : ''} ${fileOnly ? 'dropzone--file-only' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleZoneClick}
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
          <div className="dropzone__file-icon file-anonymizer__dropzone-icon--animated">
            {renderIcon()}
          </div>

          
          {!fileName && subtitle && (
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>{subtitle}</p>
          )}

          <div className="dropzone__file-text">
            {fileName 
              ? <><strong>{fileName}</strong> geladen</>
              : null
            }
          </div>
          
          <div className="dropzone__file-button">
            {fileName ? 'Ander bestand kiezen' : (fileButtonLabel || 'Kies bestand')}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedExtensions.join(',')}
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>

          {!fileName && hint && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', opacity: 0.8 }}>{hint}</p>
          )}
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
