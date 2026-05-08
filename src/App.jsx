import { useState, useCallback, useMemo, lazy, Suspense, useRef, useEffect } from 'react';
import TextHighlighter from './components/TextHighlighter';
import ReplacementTable from './components/ReplacementTable';
import DropZone from './components/DropZone';

const DeAnonymizer = lazy(() => import('./components/DeAnonymizer'));
const InfoTab = lazy(() => import('./components/InfoTab'));
const LegalModal = lazy(() => import('./components/LegalModal'));
const FileAnonymizer = lazy(() => import('./components/FileAnonymizer'));
const BackgroundParticles = lazy(() => import('./components/BackgroundParticles'));

import { detectPII, detectCategory } from './utils/detector';
import { generateReplacement, generatePlaceholder, resetGenerator, registerUsedReplacements } from './utils/generator';
import { exportMappingFile, applyMappings, copyToClipboard, readTextFile, importMappingFile } from './utils/fileHandler';
import packageJson from '../package.json';
import logoUrl from './assets/logo.png';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('anonymize');
  const [originalText, setOriginalText] = useState('');
  const [mappings, setMappings] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasAnonymized, setHasAnonymized] = useState(false);
  const [notification, setNotification] = useState(null);
  const [legalModalType, setLegalModalType] = useState(null);
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('anon-theme') || 'light';
  });
  
  // Modus: 'realistic' (fictieve namen/plaatsen) of 'placeholder' ([Persoon1], [Plaatsnaam1], …)
  const [replacementMode, setReplacementMode] = useState(() => {
    return localStorage.getItem('anon-replacement-mode') || 'realistic';
  });

  const [baseMappings, setBaseMappings] = useState([]);
  const [baseFileName, setBaseFileName] = useState(null);
  
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef(null);

  useEffect(() => {
    if (!tabsRef.current) return;
    const activeBtn = tabsRef.current.querySelector('.tabs__btn--active');
    if (activeBtn) {
      setSliderStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth
      });
    }
  }, [activeTab]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('anon-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('anon-replacement-mode', replacementMode);
  }, [replacementMode]);

  const toggleReplacementMode = () => {
    setReplacementMode(prev => prev === 'realistic' ? 'placeholder' : 'realistic');
  };

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
  // Alleen draaien als de modus wisselt, niet als mappings veranderen
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replacementMode]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  /**
   * Verwerkt de invoertekst en detecteert PII.
   */
  const handleTextInput = useCallback((text) => {
    setOriginalText(text);
    setCopied(false);
    setHasAnonymized(false);
    
    if (!text || text.trim().length === 0) {
      setMappings([]);
      setShowResults(false);
      return;
    }

    // Reset de generator voor een schone set vervangers
    resetGenerator();
    
    // Registreer de al bekende vervangers zodat ze niet opnieuw gepickt worden
    if (baseMappings.length > 0) {
      registerUsedReplacements(baseMappings);
    }

    // Detecteer PII
    const detected = detectPII(text);

    // Filter nieuwe omzettingen die nog niet inzitten, en bewaar de baseMappings
    const newMappings = [...baseMappings];

    detected.forEach(item => {
      // Kijk of we dit woord/zinsdeel al kennen uit het base bestand
      const existing = newMappings.find(m => m.original === item.original);
      if (!existing) {
        newMappings.push({
          original: item.original,
          category: item.category,
          label: item.label,
          replacement: generate(item.original, item.category),
        });
      }
    });

    setMappings(newMappings);
    setShowResults(true);
  }, [baseMappings, generate]);

  /**
   * Verwerkt een gesleept bestand.
   */
  const handleFileInput = useCallback(async (file) => {
    try {
      const text = await readTextFile(file);
      handleTextInput(text);
    } catch {
      showNotification('Fout bij het lezen van het bestand.', 'error');
    }
  }, [handleTextInput]);

  /**
   * Laadt een bestaand .anon omzettingsbestand als basis
   */
  const handleBaseFileLoad = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const importedMappings = await importMappingFile(file);
      setBaseMappings(importedMappings);
      setBaseFileName(file.name);
      showNotification(`${importedMappings.length} items geladen uit ${file.name}.`, 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
    // reset input zodat je hetzelfde bestand nogmaals kunt kiezen als je wilt
    e.target.value = '';
  }, []);

  /**
   * Verwijdert een mapping uit de tabel.
   */
  const handleRemoveMapping = useCallback((index) => {
    setMappings(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Verwijdert in één keer alle mappings van een specifieke categorie.
   */
  const handleRemoveCategory = useCallback((categoryToRemove) => {
    setMappings(prev => prev.filter(m => m.category !== categoryToRemove));
    showNotification(`Alle items van type ${categoryToRemove} verwijderd`, 'info');
  }, []);

  /**
   * Past een waarde in een mapping aan.
   */
  const handleUpdateMapping = useCallback((index, field, value) => {
    setMappings(prev => prev.map((m, i) => 
      i === index ? { ...m, [field]: value } : m
    ));
  }, []);

  /**
   * Voegt handmatig een mapping toe (via de tabel of via tekst-selectie).
   */
  const handleAddMapping = useCallback((text) => {
    // Check of dit al in de mappings zit
    if (mappings.some(m => m.original === text)) {
      showNotification(`"${text}" staat al in de tabel.`, 'info');
      return;
    }

    // Detecteer het type
    const { category, label } = detectCategory(text);
    
    // Genereer een vervanging
    const replacement = generate(text, category);

    const newMapping = {
      original: text,
      category,
      label,
      replacement,
    };

    setMappings(prev => [...prev, newMapping]);
    showNotification(`"${text}" toegevoegd als ${label}`, 'success');
  }, [mappings, generate]);

  /**
   * Anonimiseert de tekst, kopieert naar klembord en downloadt het .anon bestand.
   */
  const handleAnonymize = useCallback(async () => {
    if (mappings.length === 0) return;

    // Pas alle vervangingen toe
    const anonymizedText = applyMappings(originalText, mappings, false);

    // Download het .anon bestand EERST (synchroon in het click event)
    // Dit voorkomt dat de browser de download blokkeert omdat de 'user gesture' 
    // verloren gaat tijdens het wachten op het async klembord
    exportMappingFile(mappings);

    setHasAnonymized(true);

    // Kopieer naar klembord
    const success = await copyToClipboard(anonymizedText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    }

    showNotification(
      'Tekst gekopieerd naar klembord en omzettingsbestand gedownload!',
      'success'
    );
  }, [originalText, mappings]);

  /**
   * Toont een tijdelijke notificatie.
   */
  function showNotification(message, type = 'info') {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  }

  /**
   * Reset alles naar de beginstand.
   */
  function handleReset() {
    setOriginalText('');
    setMappings([]);
    setShowResults(false);
    setCopied(false);
    setHasAnonymized(false);
    setBaseMappings([]);
    setBaseFileName(null);
    resetGenerator();
  }

  // Bereken hoe vaak elke mapping voorkomt in de tekst (zwaar geoptimaliseerd om crashen te voorkomen)
  const mappingCounts = useMemo(() => {
    if (!originalText || !mappings || mappings.length === 0) return {};
    const counts = {};
    
    for (const mapping of mappings) {
      if (!mapping.original) continue;
      let count = 0;
      let startIndex = 0;
      
      while (true) {
        const index = originalText.indexOf(mapping.original, startIndex);
        if (index === -1) break;
        
        count++;
        // Spring direct over het gevonden woord heen, voorkomt dubbeltellingen en CPU overbelasting
        startIndex = index + mapping.original.length;
      }
      counts[mapping.original] = count;
    }
    
    return counts;
  }, [originalText, mappings]);

  // Totaal van alle daadwerkelijke vervangingen in de tekst
  const totalReplacements = useMemo(() => {
    return Object.values(mappingCounts).reduce((total, count) => total + count, 0);
  }, [mappingCounts]);

  // Categorieën verzamelen voor het exclude-paneel
  const categoryCounts = mappings.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});

  const categories = Object.entries(categoryCounts).map(([key, count]) => {
    const label = mappings.find(m => m.category === key)?.label || key;
    return { key, label, count };
  }).sort((a, b) => b.count - a.count); // Meest voorkomende bovenaan

  return (
    <div className="app">
      {/* Background with blobs and AntiGravity particles */}
      <div className="app__bg">
        <div className="app__bg-blob app__bg-blob--1"></div>
        <div className="app__bg-blob app__bg-blob--2"></div>
        <div className="app__bg-blob app__bg-blob--3"></div>
      </div>
      <Suspense fallback={null}>
        <BackgroundParticles />
      </Suspense>

      {/* Notificatie */}
      {notification && (
        <div className={`notification notification--${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header__content">
          <div className="header__brand">
            <img src={logoUrl} alt="Logo" className="header__logo" />
            <div className="header__logo-text">
              <span className="header__logo-text-prefix">(De-)</span>
              <span className="header__logo-text-main">Anonimiseerder</span>
            </div>
          </div>
          <div className="header__right">
            <div className="header__privacy-badge">
              <svg className="header__privacy-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
              Veilig — Jouw tekst blijft op je eigen computer en gaat niet naar het internet
            </div>
            <button 
              className="theme-toggle" 
              onClick={toggleTheme} 
              data-tooltip={theme === 'dark' ? 'Switch naar licht' : 'Switch naar donker'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs" ref={tabsRef}>
        <div className="tabs__slider" style={sliderStyle}></div>
        <button
          className={`tabs__btn ${activeTab === 'anonymize' ? 'tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('anonymize')}
        >
          <span className="tabs__btn-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg></span>
          Anonimiseren
        </button>
        <button
          className={`tabs__btn ${activeTab === 'files' ? 'tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <span className="tabs__btn-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg></span>
          Bestanden
        </button>
        <button
          className={`tabs__btn ${activeTab === 'restore' ? 'tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('restore')}
        >
          <span className="tabs__btn-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/></svg></span>
          De-anonimiseren
        </button>
        <button
          className={`tabs__btn ${activeTab === 'info' ? 'tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <span className="tabs__btn-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg></span>
          Uitleg
        </button>
      </nav>

      {/* Hoofdcontent */}
      <main className="main">
        {activeTab === 'anonymize' && (
          <div className="anonymizer">
            {!showResults ? (
              /* Stap 1: Tekst invoeren */
              <div className="anonymizer__input-stage">
                <div className="glass-panel glass-panel--large">
                  <h2 className="glass-panel__title">Tekst invoeren</h2>
                  <p className="glass-panel__subtitle">
                    Plak je tekst hieronder of sleep een <strong>.txt</strong> bestand in dit veld
                  </p>
                  
                  {/* Optioneel: Basis omzettingsbestand uploaden */}
                  <label className="anonymizer__base-upload" style={{ cursor: 'pointer' }}>
                    <span className="anonymizer__base-upload-label">Optioneel:</span>
                    <div className="dropzone__file-button" style={{ margin: 0, padding: '0.35rem 0.7rem' }}>
                      Laad vorig omzettingsbestand (.anon)
                      <input type="file" accept=".anon" style={{ display: 'none' }} onChange={handleBaseFileLoad} />
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
                    onTextReceived={handleTextInput}
                    onFileReceived={handleFileInput}
                    acceptedExtensions={['.txt']}
                    placeholder="Plak hier je tekst, of sleep een .txt bestand hierheen…"
                  />
                </div>
              </div>
            ) : (
              /* Stap 2: Resultaten bekijken en aanpassen */
              <div className="anonymizer__results-stage">
                <div className="anonymizer__panels">
                  {/* Links: Tekst met markeringen */}
                  <div className="glass-panel anonymizer__text-panel">
                    <TextHighlighter
                      title="Tekst met markeringen"
                      titleAction={
                        <button className="btn btn--ghost btn--small" onClick={handleReset}>
                          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{flexShrink:0}}><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg> Opnieuw
                        </button>
                      }
                      text={originalText}
                      mappings={mappings}
                      onAddMapping={handleAddMapping}
                    />
                  </div>

                  {/* Rechts: Omzettingstabel */}
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
                      counts={mappingCounts}
                      totalReplacements={totalReplacements}
                      onRemoveMapping={handleRemoveMapping}
                      onUpdateMapping={handleUpdateMapping}
                      onAddManualMapping={handleAddMapping}
                    />
                  </div>
                </div>

                {/* Bulk actions: Categorieën uitsluiten */}
                {categories.length > 0 && (
                  <div className="glass-panel anonymizer__categories-panel">
                    <h3 className="glass-panel__title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                      Gevonden types (Bulk Exclude)
                      <span className="glass-panel__subtitle" style={{ margin: '0 0 0 0.5rem', fontSize: '0.85rem' }}>
                        - Klik op een type om alle bijbehorende items in één keer te verwijderen
                      </span>
                    </h3>
                    <div className="category-tags">
                      {categories.map(cat => (
                        <button 
                          key={cat.key} 
                          className="category-tag category-tag--removable"
                          onClick={() => handleRemoveCategory(cat.key)}
                          title={`Verwijder alle ${cat.count} items van type ${cat.label}`}
                        >
                          <span className="category-tag__label">{cat.label}</span>
                          <span className="category-tag__count">{cat.count}</span>
                          <span className="category-tag__remove">✕</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actieknop */}
                <div className="anonymizer__actions">
                  <button
                    className={`btn btn--primary btn--large ${copied ? 'btn--success' : ''}`}
                    onClick={handleAnonymize}
                    disabled={mappings.length === 0}
                  >
                    {copied
                      ? '✅ Gekopieerd & Gedownload!'
                      : '🛡️ Anonimiseer, Kopieer & Download Omzettingsbestand'
                    }
                  </button>
                  {replacementMode === 'placeholder' && hasAnonymized && (
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
        )}

        {activeTab === 'files' && (
          <Suspense fallback={<div className="loading-spinner">Component wordt geladen...</div>}>
            <FileAnonymizer onShowNotification={showNotification} replacementMode={replacementMode} toggleReplacementMode={toggleReplacementMode} />
          </Suspense>
        )}

        {activeTab === 'restore' && (
          <div className="glass-panel glass-panel--large">
            <h2 className="glass-panel__title">Terugdraaien</h2>
            <p className="glass-panel__subtitle">
              Upload het <strong>.anon</strong> omzettingsbestand en plak de geanonimiseerde tekst — of upload een geanonimiseerd bestand — om deze te herstellen.
            </p>
            <Suspense fallback={<div className="loading-spinner">Component wordt geladen...</div>}>
              <DeAnonymizer />
            </Suspense>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="glass-panel glass-panel--large">
            <Suspense fallback={<div className="loading-spinner">Component wordt geladen...</div>}>
              <InfoTab onOpenLegalModal={setLegalModalType} />
            </Suspense>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
          <p>(De-)Anonimiseerder <span style={{ opacity: 0.85 }}>v{packageJson.version}</span> — Jouw tekst wordt nergens opgeslagen en verlaat je eigen computer niet.</p>
          <div className="footer__links">
            <button className="footer__link" onClick={() => setLegalModalType('privacy')}>Privacybeleid</button>
            <button className="footer__link" onClick={() => setLegalModalType('disclaimer')}>Disclaimer</button>
            {/* Verborgen anchor-links voor security- en SEO-scanners */}
            <a href="/privacy.html" style={{ display: 'none' }}>Privacybeleid SEO</a>
            <a href="/disclaimer.html" style={{ display: 'none' }}>Disclaimer SEO</a>
          </div>
      </footer>

      {/* Legal Modal */}
      {legalModalType && (
        <Suspense fallback={null}>
          <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
        </Suspense>
      )}
    </div>
  );
}
