import { useMemo, useCallback, useState, useRef, useEffect } from 'react';

/**
 * TextHighlighter — Interactief tekstveld met kleurmarkering
 * 
 * Rendert de originele tekst met alle gevonden PII gemarkeerd in kleur.
 * Gebruikers kunnen tekst selecteren om het handmatig toe te voegen.
 */

// Kleurcodes per categorie
const CATEGORY_COLORS = {
  naam: { bg: 'rgba(99, 102, 241, 0.25)', border: 'rgba(99, 102, 241, 0.6)', text: '#818cf8' },
  email: { bg: 'rgba(236, 72, 153, 0.25)', border: 'rgba(236, 72, 153, 0.6)', text: '#f472b6' },
  telefoon: { bg: 'rgba(34, 197, 94, 0.25)', border: 'rgba(34, 197, 94, 0.6)', text: '#4ade80' },
  postcode: { bg: 'rgba(251, 146, 60, 0.25)', border: 'rgba(251, 146, 60, 0.6)', text: '#fb923c' },
  datum: { bg: 'rgba(56, 189, 248, 0.25)', border: 'rgba(56, 189, 248, 0.6)', text: '#38bdf8' },
  iban: { bg: 'rgba(168, 85, 247, 0.25)', border: 'rgba(168, 85, 247, 0.6)', text: '#a855f7' },
  bsn: { bg: 'rgba(244, 63, 94, 0.25)', border: 'rgba(244, 63, 94, 0.6)', text: '#fb7185' },
  url: { bg: 'rgba(20, 184, 166, 0.25)', border: 'rgba(20, 184, 166, 0.6)', text: '#2dd4bf' },
  nummer: { bg: 'rgba(251, 191, 36, 0.25)', border: 'rgba(251, 191, 36, 0.6)', text: '#fbbf24' },
  plaats: { bg: 'rgba(234, 88, 12, 0.25)', border: 'rgba(234, 88, 12, 0.6)', text: '#ea580c' },
};

const DEFAULT_COLOR = { bg: 'rgba(156, 163, 175, 0.25)', border: 'rgba(156, 163, 175, 0.6)', text: '#9ca3af' };
const SEARCH_COLOR = { bg: 'rgba(250, 204, 21, 0.4)', border: 'rgba(250, 204, 21, 0.8)', text: '#facc15' };

export { CATEGORY_COLORS };

export default function TextHighlighter({ text, mappings, onAddMapping }) {
  const [searchTerm, setSearchTerm] = useState('');
  const contentRef = useRef(null);
  
  /**
   * Bouwt een lijst van tekst-segmenten op: sommige zijn gemarkeerd (match), andere niet.
   * Sorteert matches op lengte (langste eerst) om overlapping te voorkomen.
   */
  const segments = useMemo(() => {
    if (!text) {
      return [];
    }

    // Vind alle posities van alle mappings in de tekst
    const allPositions = [];
    
    // Als er mappings zijn, verwerk deze eerst
    if (mappings && mappings.length > 0) {
      // Sorteer mappings op lengte (langste eerst) om deelmatches te voorkomen
      const sortedMappings = [...mappings].sort((a, b) => b.original.length - a.original.length);
      
      for (const mapping of sortedMappings) {
        let startIndex = 0;
        while (true) {
          const index = text.indexOf(mapping.original, startIndex);
          if (index === -1) break;
          
          // Check of deze positie niet al bezet is door een langere match
          const overlaps = allPositions.some(
            pos => index < pos.end && (index + mapping.original.length) > pos.start
          );
          
          if (!overlaps) {
            allPositions.push({
              start: index,
              end: index + mapping.original.length,
              original: mapping.original,
              category: mapping.category,
              replacement: mapping.replacement,
            });
          }
          
          // Sla direct de gehele vondst over om eindeloze CPU lussen te voorkomen
          startIndex = index + mapping.original.length;
        }
      }
    }

    // Zoeken naar de searchTerm (indien >= 2 karakters)
    if (searchTerm && searchTerm.trim().length >= 2) {
      const lowerText = text.toLowerCase();
      const lowerSearch = searchTerm.trim().toLowerCase();
      let startIndex = 0;
      
      while (true) {
        const index = lowerText.indexOf(lowerSearch, startIndex);
        if (index === -1) break;
        
        const overlappingIndexes = allPositions
          .map((pos, i) => (index < pos.end && (index + lowerSearch.length) > pos.start) ? i : -1)
          .filter(i => i !== -1);
          
        if (overlappingIndexes.length === 0) {
          allPositions.push({
            start: index,
            end: index + lowerSearch.length,
            original: text.substring(index, index + lowerSearch.length),
            isSearchMatch: true,
          });
        } else {
          const target = allPositions[overlappingIndexes[0]];
          target.isSearchMatch = true;
        }
        
        startIndex = index + lowerSearch.length;
      }
    }

    // Sorteer op positie
    allPositions.sort((a, b) => a.start - b.start);

    // Bouw segmenten op
    const result = [];
    let lastEnd = 0;

    for (const pos of allPositions) {
      // Tekst vóór deze match
      if (pos.start > lastEnd) {
        result.push({
          text: text.substring(lastEnd, pos.start),
          isMatch: false,
        });
      }
      // De match (of zoekresultaat) zelf
      result.push({
        text: text.substring(pos.start, pos.end),
        isMatch: !pos.isSearchMatch,
        isSearchMatch: pos.isSearchMatch,
        category: pos.category,
        original: pos.original,
        replacement: pos.replacement,
      });
      lastEnd = pos.end;
    }

    // Resterende tekst na de laatste match
    if (lastEnd < text.length) {
      result.push({
        text: text.substring(lastEnd),
        isMatch: false,
      });
    }

    return result;
  }, [text, mappings]);

  /**
   * Handelt tekst-selectie af: als de gebruiker tekst selecteert met de muis,
   * wordt deze aangeboden om toe te voegen aan de omzettingstabel.
   */
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (!selectedText || selectedText.length < 2) return;
    
    // Check of deze tekst niet al in de mappings zit
    const alreadyMapped = mappings?.some(m => m.original === selectedText);
    if (alreadyMapped) return;

    if (onAddMapping) {
      onAddMapping(selectedText);
    }

    // Verwijder de selectie
    selection.removeAllRanges();
  }, [mappings, onAddMapping]);

  // Auto-scroll naar eerste zoekresultaat (met debouncing voor snel typen)
  useEffect(() => {
    if (searchTerm.trim().length >= 2 && contentRef.current) {
      const timerId = setTimeout(() => {
        // Zoek het eerste element met de search mark class
        const firstMatch = contentRef.current.querySelector('.text-highlighter__mark--search');
        if (firstMatch) {
          try {
            const container = contentRef.current;
            // Haal de absolute scherm-coordinaten op van de mark én van het tekstvak
            const matchRect = firstMatch.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Bereken de scroll-afstand die nodig is om het woord 100% te centreren
            const scrollDistance = matchRect.top - containerRect.top - (containerRect.height / 2) + (matchRect.height / 2);
            
            // Trigger alleen een scroll als het item niet al redelijk in het centrum staat
            if (Math.abs(scrollDistance) > 30) {
              container.scrollBy({ top: scrollDistance, behavior: 'smooth' });
            }
          } catch (error) {
            // Fallback voor onverwachte browsersituaties
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 150); // Debounce van 150ms voorkomt verstorende overlaps bij snel doortypen
      
      return () => clearTimeout(timerId); // Wis de timer als de gebruiker verder typt
    }
  }, [searchTerm, segments]);

  if (!text) {
    return (
      <div className="text-highlighter text-highlighter--empty">
        <div className="text-highlighter__placeholder">
          De tekst verschijnt hier met markeringen…
        </div>
      </div>
    );
  }

  return (
    <div className="text-highlighter" onMouseUp={handleMouseUp}>
      <div className="text-highlighter__hint">
        💡 Selecteer tekst met je muis om het handmatig te anonimiseren
      </div>
      <div className="text-highlighter__content" ref={contentRef}>
        {segments.map((segment, index) => {
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

      {/* Zoekbalk onderaan (Sticky) */}
      <div className="text-highlighter__search-bar">
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Zoek een woord om toe te voegen..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <div className="search-actions">
            <button 
              className="btn btn--small btn--primary search-add-btn" 
              onClick={() => {
                if (searchTerm.trim() && onAddMapping) {
                  onAddMapping(searchTerm.trim());
                  // Optioneel kunnen we hem leegmaken, maar soms wil je doorklikken.
                  // Voor nu is het handig als hij blijft staan tot je klaar bent.
                }
              }}
              title="Voeg deze exacte zoekterm direct toe aan de tabel"
            >
              + Toevoegen
            </button>
            <button className="search-clear" onClick={() => setSearchTerm('')} title="Zoekveld leegmaken">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
