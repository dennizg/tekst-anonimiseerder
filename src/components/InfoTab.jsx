/**
 * InfoTab — Informatie & Uitleg over de Tekst Anonimiseerder
 * 
 * Bevat uitleg over hoe de site werkt, een voorbeeld,
 * disclaimers en een overzicht van herkende typen.
 */
export default function InfoTab({ onOpenLegalModal }) {
  return (
    <div className="info-tab">
      {/* Introductie */}
      <section className="info-tab__section">
        <h2 className="info-tab__heading">
          <span className="info-tab__heading-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/></svg></span>
          Welkom bij de Tekst Anonimiseerder
        </h2>
        <p className="info-tab__text">
          Deze tool helpt je om <strong>persoonsgevoelige informatie</strong> in teksten te vervangen 
          door fictieve gegevens. Omdat dit proces <strong>omkeerbaar</strong> is via een gegenereerd omzettingsbestand, 
          creëer je in de formele juridische zin <em>gepseudonimiseerde</em> data in plaats van anonieme data.
        </p>

      </section>

      {/* Hoe werkt het? */}
      <section className="info-tab__section">
        <h2 className="info-tab__heading">
          <span className="info-tab__heading-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg></span>
          Hoe werkt het?
        </h2>
        <div className="info-tab__steps">
          <div className="info-tab__step">
            <div className="info-tab__step-number">1</div>
            <div className="info-tab__step-content">
              <h3>Tekst invoeren</h3>
              <p>Plak je tekst in het invoerveld of sleep een <code>.txt</code> bestand erin. 
              De tekst wordt direct geanalyseerd. <br/>
              <em><strong>Tip:</strong> Upload vóór het plakken een bestaand <code>.anon</code> omzettingsbestand om eerdere pseudoniemen opnieuw te gebruiken (ideaal voor periodieke notulen).</em></p>
            </div>
          </div>
          <div className="info-tab__step">
            <div className="info-tab__step-number">2</div>
            <div className="info-tab__step-content">
              <h3>Controleren & aanpassen</h3>
              <p>Je ziet de tekst met gekleurde markeringen en een tabel met alle gevonden gegevens. 
              Je kunt regels verwijderen, toevoegen of de voorgestelde vervanging aanpassen.</p>
            </div>
          </div>
          <div className="info-tab__step">
            <div className="info-tab__step-number">3</div>
            <div className="info-tab__step-content">
              <h3>Anonimiseren</h3>
              <p>Klik op de grote knop. De geanonimiseerde tekst wordt gekopieerd naar je klembord 
              en het <strong>omzettingsbestand</strong> (<code>.anon</code>) wordt automatisch gedownload.</p>
            </div>
          </div>
          <div className="info-tab__step">
            <div className="info-tab__step-number">4</div>
            <div className="info-tab__step-content">
              <h3>Later terugdraaien</h3>
              <p>Ga naar het tabblad <em>"Terugdraaien"</em>, upload het omzettingsbestand en plak de 
              geanonimiseerde tekst. De originele (persoons)gegevens zijn weer terug gezet; de tekst is ge-de-anonimiseerd.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Voorbeeld */}
      <section className="info-tab__section">
        <h2 className="info-tab__heading">
          <span className="info-tab__heading-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg></span>
          Voorbeeld
        </h2>
        <div className="info-tab__example">
          <div className="info-tab__example-block">
            <h4 className="info-tab__example-label">Originele tekst</h4>
            <p className="info-tab__example-text">
              Beste meneer <mark className="example-mark example-mark--naam">Jan de Vries</mark>, 
              hierbij bevestigen wij uw afspraak op <mark className="example-mark example-mark--datum">15-03-2026</mark> in 
              ons kantoor. U kunt ons bereiken 
              via <mark className="example-mark example-mark--email">jan.devries@mail.nl</mark> of 
              bel <mark className="example-mark example-mark--telefoon">06-12345678</mark>.
            </p>
          </div>
          <div className="info-tab__example-arrow">→</div>
          <div className="info-tab__example-block">
            <h4 className="info-tab__example-label">Geanonimiseerde tekst</h4>
            <p className="info-tab__example-text info-tab__example-text--anon">
              Beste meneer <mark className="example-mark example-mark--naam">Sofie van Houten</mark>, 
              hierbij bevestigen wij uw afspraak op <mark className="example-mark example-mark--datum">22-11-1994</mark> in 
              ons kantoor. U kunt ons bereiken 
              via <mark className="example-mark example-mark--email">gebruiker38@voorbeeld.nl</mark> of 
              bel <mark className="example-mark example-mark--telefoon">06-98712345</mark>.
            </p>
          </div>
        </div>

        {/* Instructievideo's (Verplaatst naar hier per verzoek) */}
        <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📺</span> Instructievideo's
          </h3>
          <div style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-glass)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <p className="info-tab__text" style={{ margin: 0 }}>
              Bekijk onderstaande video's voor een demonstratie van de functionaliteit.
            </p>
            <div className="videos-grid">
              <div className="video-wrapper">
                <h3 className="video-title">Basisfunctionaliteit</h3>
                <p className="info-tab__text" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Hoe gebruik je het?</p>
                <div className="video-responsive-container">
                  <iframe 
                    src="https://www.youtube.com/embed/eMzP0NytqwM" 
                    title="Basisfunctionaliteit Tekst Anonimiseerder" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
              <div className="video-wrapper">
                <h3 className="video-title">Geavanceerd gebruik</h3>
                <p className="info-tab__text" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Hoe boek je nóg meer tijdswinst?</p>
                <div className="video-responsive-container">
                  <iframe 
                    src="https://www.youtube.com/embed/cTig0OphGnc" 
                    title="Geavanceerd gebruik Tekst Anonimiseerder" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="info-tab__text" style={{ marginTop: '3rem', fontSize: '0.95rem', color: 'var(--color-text-light)', backgroundColor: 'var(--color-bg-alt)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--color-accent)' }}>
          <strong>💡 Tip voor terugkerende rapportages:</strong> Heb je volgende maand een nieuw verslag waar <em>Jan de Vries</em> weer in voorkomt? Laad dan vooraf je eerder bewaarde omzettingsbestand (.anon) in. In de nieuwe geanonimiseerde tekst zal hij dan automatisch wéér <em>Sofie van Houten</em> heten!
        </div>
      </section>

      {/* Herkend typen */}
      <section className="info-tab__section">
        <h2 className="info-tab__heading">
          <span className="info-tab__heading-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg></span>
          Welke gegevens worden herkend?
        </h2>
        <div className="info-tab__types-grid">
          <div className="info-tab__type-card">
            <span className="info-tab__type-icon" style={{color: '#818cf8'}}>●</span>
            <div>
              <strong>Namen</strong>
              <p>Voor- en achternamen op basis van een uitgebreide Nederlandse namenlijst en hoofdletterpatronen</p>
            </div>
          </div>
          <div className="info-tab__type-card">
            <span className="info-tab__type-icon" style={{color: '#f472b6'}}>●</span>
            <div>
              <strong>E-mailadressen</strong>
              <p>Alle gangbare e-mailformaten</p>
            </div>
          </div>
          <div className="info-tab__type-card">
            <span className="info-tab__type-icon" style={{color: '#4ade80'}}>●</span>
            <div>
              <strong>Telefoonnummers</strong>
              <p>Nederlandse formaten (06-, 020-, +31, etc.)</p>
            </div>
          </div>
          <div className="info-tab__type-card">
            <span className="info-tab__type-icon" style={{color: '#38bdf8'}}>●</span>
            <div>
              <strong>Datums</strong>
              <p>Numeriek (15-03-2026) en uitgeschreven (15 maart 2026)</p>
            </div>
          </div>
          <div className="info-tab__type-card">
            <span className="info-tab__type-icon" style={{color: '#fb923c'}}>●</span>
            <div>
              <strong>Postcodes</strong>
              <p>Nederlandse postcodes (1234 AB)</p>
            </div>
          </div>
          <div className="info-tab__type-card">
            <span className="info-tab__type-icon" style={{color: '#a855f7'}}>●</span>
            <div>
              <strong>IBAN-nummers</strong>
              <p>Bankrekeningnummers (NL91 ABNA …)</p>
            </div>
          </div>
          <div className="info-tab__type-card">
            <span className="info-tab__type-icon" style={{color: '#fb7185'}}>●</span>
            <div>
              <strong>BSN-nummers</strong>
              <p>Burgerservicenummers (9 cijfers)</p>
            </div>
          </div>
          <div className="info-tab__type-card">
            <span className="info-tab__type-icon" style={{color: '#2dd4bf'}}>●</span>
            <div>
              <strong>URL's</strong>
              <p>Webadressen (https://…)</p>
            </div>
          </div>
        </div>

        <div className="info-tab__alert" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--color-error-bg)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-sm)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
            <span>⚠️</span> Let op: Contextuele Herleidbaarheid
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
            Het filteren van directe persoonsgegevens (zoals namen en adressen) garandeert <strong>niet</strong> direct dat een persoon onherkenbaar is. Unieke combinatie-beschrijvingen (zoals: <em>"De 42-jarige directeur van de kleinste basisschool in gemeente X"</em>) maken iemand vaak alsnog herleidbaar. <strong>Lees gepseudonimiseerde teksten dus altijd nog kritisch na.</strong>
          </p>
        </div>
      </section>

      {/* Privacy & Veiligheid */}
      <section className="info-tab__section info-tab__section--highlight">
        <h2 className="info-tab__heading">
          <span className="info-tab__heading-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg></span>
          Privacy & Veiligheid
        </h2>
        <div className="info-tab__privacy-points">
          <div className="info-tab__privacy-point info-tab__privacy-point--positive">
            <span className="info-tab__privacy-icon">✅</span>
            <p><strong>Blijft op jouw apparaat:</strong> Alle verwerking gebeurt direct op jouw eigen computer of telefoon. Er wordt geen enkele letter naar het internet gestuurd.</p>
          </div>
          <div className="info-tab__privacy-point info-tab__privacy-point--positive">
            <span className="info-tab__privacy-icon">✅</span>
            <p><strong>Geen AI:</strong> Er worden geen online taalmodellen of externe diensten gebruikt. Alles werkt met slimme patroonherkenning direct in de tool.</p>
          </div>
          <div className="info-tab__privacy-point info-tab__privacy-point--positive">
            <span className="info-tab__privacy-icon">✅</span>
            <p><strong>Geen opslag:</strong> Zodra je de website sluit, is alles direct onherroepelijk verdwenen. Er wordt absoluut niets opgeslagen.</p>
          </div>
          <div className="info-tab__privacy-point info-tab__privacy-point--positive">
            <span className="info-tab__privacy-icon">✅</span>
            <p><strong>Volledig Open Source:</strong> Wij beweren geen AI te gebruiken, maar we bewijzen het ook graag. De broncode van de (De-)Anonimiseerder is voor optimale transparantie <a href="https://github.com/dennizg/tekst-anonimiseerder" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>100% open source en openbaar in te zien via onze GitHub repository</a>.</p>
          </div>
        </div>
      </section>

      {/* Privacybeleid Link */}
      <section className="info-tab__section">
        <div className="info-tab__text">
          <p>
            Meer weten over hoe we jouw data beschermen en waarom we geen opslag hebben?{' '}
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit', fontFamily: 'inherit', padding: 0 }}
              onClick={() => onOpenLegalModal && onOpenLegalModal('privacy')}
            >
              Lees ons uitgebreide Privacybeleid
            </button>.
          </p>
        </div>
      </section>

      {/* Disclaimers */}
      <section className="info-tab__section info-tab__section--warning">
        <h2 className="info-tab__heading">
          <span className="info-tab__heading-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg></span>
          Belangrijke opmerkingen
        </h2>
        <div className="info-tab__disclaimers">
          <div className="info-tab__disclaimer">
            <h4>Niet alles wordt automatisch herkend</h4>
            <p>
              Doordat deze tool bewust <strong>geen AI</strong> gebruikt, worden niet alle persoonsgegevens 
              automatisch gevonden. Vooral ongebruikelijke namen, buitenlandse adresformaten of ongewone 
              schrijfwijzen kunnen worden gemist. <strong>Controleer daarom altijd het resultaat</strong> en 
              voeg gemiste gegevens handmatig toe door ze in de tekst te selecteren.
            </p>
          </div>
          <div className="info-tab__disclaimer">
            <h4>Het omzettingsbestand is niet beveiligd</h4>
            <p>
              Het gedownloade <code>.anon</code> omzettingsbestand bevat de omzettingstabel in leesbaar formaat 
              (JSON). Dit bestand is <strong>niet versleuteld of met een wachtwoord beveiligd</strong>. 
              Bewaar het omzettingsbestand daarom op een veilige plek en deel het alleen met personen die 
              de originele gegevens mogen inzien.
            </p>
          </div>
          <div className="info-tab__disclaimer">
            <h4>Geen garantie op volledigheid</h4>
            <p>
              Deze tool is bedoeld als hulpmiddel en biedt <strong>geen garantie</strong> dat alle 
              persoonsgegevens worden gevonden en vervangen. De gebruiker blijft zelf verantwoordelijk 
              voor het controleren van het eindresultaat. Bekijk voor de juridische details onze{' '}
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit', fontFamily: 'inherit', padding: 0 }}
                onClick={() => onOpenLegalModal && onOpenLegalModal('disclaimer')}
              >
                Volledige Disclaimer
              </button>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
