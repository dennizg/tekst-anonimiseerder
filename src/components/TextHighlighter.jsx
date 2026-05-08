import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

const DEFAULT_COLOR = { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)' };
const SEARCH_COLOR = { bg: 'rgba(234, 179, 8, 0.3)', border: 'rgba(234, 179, 8, 0.6)' };

const CATEGORY_COLORS = {
  'Persoonsnamen': { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' },
  'Locaties': { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
  'Organisaties': { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)' },
  'Functies': { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' },
  'Datum/Tijd': { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)' },
  'Bedragen': { bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.4)' },
  'Kenmerken': { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)' },
  'Overig': { bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.4)' }
};

export { CATEGORY_COLORS };

export default function TextHighlighter({ text, mappings, onAddMapping, title, titleAction }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUniqueOnly, setShowUniqueOnly] = useState(false);
  const contentRef = useRef(null);
  
  // Bereken statistieken voor de unieke-modus
  const uniqueStats = useMemo(() => {
    if (!text) return { totalWords: 0, uniqueWords: 0 };
    // Tel totaal woorden vs. unieke woorden in de hele tekst
    const allWords = text.match(/[a-zA-Z\u00C0-\u024F0-9'@.\-]+/g) || [];
    const uniqueSet = new Set(allWords.map(w => w.toLowerCase()));
    return { totalWords: allWords.length, uniqueWords: uniqueSet.size };
  }, [text]);

  const [segments, setSegments] = useState([]);

  // Hoofdverwerkingsfunctie die de ruwe tekst opdeelt in veilige blokjes (tokens)
  const processText = useCallback(() => {
    if (!text) {
      setSegments([]);
      return;
    }

    const newSegments = [];
    let currentIndex = 0;
    const sortedMappings = [...(mappings || [])].sort((a, b) => {
      return (b.original || '').length - (a.original || '').length;
    });

    while (currentIndex < text.length) {
      let matched = false;

      for (const mapping of sortedMappings) {
        if (!mapping.original) continue;

        const substr = text.substring(currentIndex, currentIndex + mapping.original.length);
        if (substr.toLowerCase() === mapping.original.toLowerCase()) {
          newSegments.push({
            text: substr,
            isMatch: true,
            category: mapping.category,
            original: mapping.original,
            replacement: mapping.replacement,
          });
          currentIndex += mapping.original.length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        newSegments.push({
          text: text[currentIndex],
          isMatch: false,
        });
        currentIndex++;
      }
    }

    const mergedSegments = [];
    for (const seg of newSegments) {
      if (!seg.isMatch && mergedSegments.length > 0 && !mergedSegments[mergedSegments.length - 1].isMatch) {
        mergedSegments[mergedSegments.length - 1].text += seg.text;
      } else {
        mergedSegments.push(seg);
      }
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const finalSegments = [];
      
      for (const seg of mergedSegments) {
        if (seg.isMatch) {
          finalSegments.push(seg);
          continue;
        }

        const textLower = seg.text.toLowerCase();
        let searchIndex = textLower.indexOf(lowerSearch);
        
        if (searchIndex === -1) {
          finalSegments.push(seg);
        } else {
          let currentPos = 0;
          while (searchIndex !== -1) {
            if (searchIndex > currentPos) {
              finalSegments.push({
                text: seg.text.substring(currentPos, searchIndex),
                isMatch: false,
              });
            }
            
            finalSegments.push({
              text: seg.text.substring(searchIndex, searchIndex + searchTerm.length),
              isMatch: false,
              isSearchMatch: true,
              original: seg.text.substring(searchIndex, searchIndex + searchTerm.length),
            });
            
            currentPos = searchIndex + searchTerm.length;
            searchIndex = textLower.indexOf(lowerSearch, currentPos);
          }
          
          if (currentPos < seg.text.length) {
            finalSegments.push({
              text: seg.text.substring(currentPos),
              isMatch: false,
            });
          }
        }
      }
      setSegments(finalSegments);
    } else {
      setSegments(mergedSegments);
    }
  }, [text, mappings, searchTerm]);

  // Debounce voor het verwerken van de tekst
  useEffect(() => {
    if (!searchTerm) {
      processText();
    } else {
      const timerId = setTimeout(() => {
        processText();
      }, 150); // Debounce van 150ms voorkomt verstorende overlaps bij snel doortypen
      
      return () => clearTimeout(timerId); // Wis de timer als de gebruiker verder typt
    }
  }, [searchTerm, segments, processText]);

  if (!text) {
    return (
      <div className="text-highlighter text-highlighter--empty">
        <div className="text-highlighter__placeholder">
          De tekst verschijnt hier met markeringen.
        </div>
      </div>
    );
  }

  /**
   * "1x uniek" Modus
   */
  const uniqueSegments = useMemo(() => {
    if (!showUniqueOnly) return null;
    const seenWords = new Set();
    const result = [];
    
    for (const seg of segments) {
      if (seg.isMatch) {
        const lower = seg.original.toLowerCase();
        if (!seenWords.has(lower)) {
          seenWords.add(lower);
          result.push({ ...seg, text: seg.text + ' ' });
        }
      } else if (seg.isSearchMatch) {
        const lower = seg.original.toLowerCase();
        if (!seenWords.has(lower)) {
          seenWords.add(lower);
          result.push({ ...seg, text: seg.text + ' ' });
        }
      } else {
        const words = seg.text.match(/[a-zA-Z\u00C0-\u024F0-9'@.\-]+|[^a-zA-Z\u00C0-\u024F0-9'@.\-]+/g);
        if (words) {
          let mergedText = '';
          for (const word of words) {
            if (/[a-zA-Z\u00C0-\u024F0-9'@.\-]+/.test(word)) {
              const lowerWord = word.toLowerCase();
              if (!seenWords.has(lowerWord)) {
                seenWords.add(lowerWord);
                mergedText += word;
              }
            } else {
              if (mergedText.length > 0 && !/\s$/.test(mergedText) && /^\s/.test(word)) {
                mergedText += ' ';
              } else if (/\s/.test(word)) {
                mergedText += ' ';
              }
            }
          }
          if (mergedText) {
            result.push({ ...seg, text: mergedText });
          }
        }
      }
    }
    return result;
  }, [showUniqueOnly, segments]);

  const displaySegments = showUniqueOnly && uniqueSegments ? uniqueSegments : segments;

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length > 1) {
      onAddMapping(selectedText);
      selection.removeAllRanges();
    }
  };

  return (
    <>
      {title && (
        <div className="glass-panel__title-row">
          <h2 className="glass-panel__title">{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {uniqueStats.totalWords > uniqueStats.uniqueWords && (
              <button
                className={`unique-toggle ${showUniqueOnly ? 'unique-toggle--active' : ''}`}
                onClick={() => setShowUniqueOnly(prev => !prev)}
                data-tooltip={showUniqueOnly 
                  ? 'Toon de volledige tekst met alle herhalingen' 
                  : 'Toon elk woord slechts 1x (ideaal voor spreadsheets)'}
              >
                <svg className="unique-toggle__icon" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  {showUniqueOnly ? (
                    <>
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" opacity="0"/>
                    </>
                  ) : (
                    <>
                      <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                    </>
                  )}
                </svg>
                <span className="unique-toggle__label">
                  {showUniqueOnly ? 'Alles tonen' : '1x uniek'}
                </span>
                <span className="unique-toggle__badge">
                  {showUniqueOnly 
                    ? `${uniqueStats.uniqueWords} / ${uniqueStats.totalWords}` 
                    : uniqueStats.uniqueWords}
                </span>
              </button>
            )}
            {titleAction}
          </div>
        </div>
      )}
      <div className="text-highlighter" onMouseUp={handleMouseUp} style={{ marginTop: title ? '0.5rem' : 0 }}>
        <div className="text-highlighter__toolbar">
          <div className="text-highlighter__hint">
            <svg className="text-highlighter__hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              <path d="M13 13l6 6" />
            </svg>
            Selecteer tekst met je muis om het handmatig te anonimiseren
          </div>
        </div>
        <div className="text-highlighter__content" ref={contentRef}>
          {displaySegments.map((segment, index) => {
            if (!segment.isMatch && !segment.isSearchMatch) {
              return <span key={index}>{segment.text}</span>;
            }
            
            if (segment.isSearchMatch) {
              return (
                <mark
                  key={index}
                  className="text-highlighter__mark text-highlighter__mark--search"
                  style={{
                    backgroundColor: SEARCH_COLOR.bg,
                    borderBottom: `2px solid ${SEARCH_COLOR.border}`,
                    padding: '0 2px',
                    borderRadius: '3px',
                  }}
                  title="Gevonden in de tekst via zoeken"
                >
                  {segment.text}
                </mark>
              );
            }
            
            const colors = CATEGORY_COLORS[segment.category] || DEFAULT_COLOR;
            return (
              <mark
                key={index}
                className="text-highlighter__mark"
                style={{
                  backgroundColor: colors.bg,
                  borderBottom: `2px solid ${colors.border}`,
                }}
                title={`${segment.original} → ${segment.replacement}`}
              >
                {segment.text}
              </mark>
            );
          })}
        </div>

        <div className="text-highlighter__search-bar">
          <span className="search-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg></span>
          <input 
            type="text" 
            placeholder="Zoek een woord om toe te voegen..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              title="Zoekopdracht wissen"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </>
  );
}
