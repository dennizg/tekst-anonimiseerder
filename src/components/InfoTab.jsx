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
          <span className="info-tab__heading-icon">👋</span>
          Welkom bij de Tekst Anonimiseerder
        </h2>
        <p className="info-tab__text">
          Deze tool helpt je om <strong>persoonsgevoelige informatie</strong> in teksten te vervangen 
          door fictieve gegevens. Het bijzondere? Dit is <strong>omkeerbaar</strong>: met een 
          sleutelbestand kun je later alles weer terugzetten naar de originele tekst.
        </p>
      </section>

      {/* Hoe werkt het? */}
      <section className="info-tab__section">
        <h2 className="info-tab__heading">
          <span className="info-tab__heading-icon">⚙️</span>
          Hoe werkt het?
        </h2>
        <div className="info-tab__steps">
          <div className="info-tab__step">
            <div className="info-tab__step-number">1</div>
            <div className="info-tab__step-content">
              <h3>Tekst invoeren</h3>
              <p>Plak je tekst in het invoerveld of sleep een <code>.txt</code> bestand erin. 
              De tekst wordt direct geanalyseerd.</p>
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
              en het <strong>sleutelbestand</strong> (<code>.anon</code>) wordt automatisch gedownload.</p>
            </div>
          </div>
          <div className="info-tab__step">
            <div className="info-tab__step-number">4</div>
            <div className="info-tab__step-content">
              <h3>Later terugdraaien</h3>
              <p>Ga naar het tabblad <em>"Terugdraaien"</em>, upload het sleutelbestand en plak de 
              geanonimiseerde tekst. De originele (persoons)gegevens zijn weer terug gezet; de tekst is ge-de-anonimiseerd.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Voorbeeld */}
      <section className="info-tab__section">
        <h2 className="info-tab__heading">
          <span className="info-tab__heading-icon">📝</span>
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
      </section>

      {/* Herkend typen */}
      <section className="info-tab__section">
        <h2 className="info-tab__heading">
          <span className="info-tab__heading-icon">🔍</span>
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
      </section>

      {/* Privacy & Veiligheid */}
      <section className="info-tab__section info-tab__section--highlight">
        <h2 className="info-tab__heading">
          <span className="info-tab__heading-icon">🔒</span>
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
          <span className="info-tab__heading-icon">⚠️</span>
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
            <h4>Het sleutelbestand is niet beveiligd</h4>
            <p>
              Het gedownloade <code>.anon</code> sleutelbestand bevat de omzettingstabel in leesbaar formaat 
              (JSON). Dit bestand is <strong>niet versleuteld of met een wachtwoord beveiligd</strong>. 
              Bewaar het sleutelbestand daarom op een veilige plek en deel het alleen met personen die 
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
