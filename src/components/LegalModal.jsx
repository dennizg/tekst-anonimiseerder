import React from 'react';

export default function LegalModal({ type, onClose }) {
  if (!type) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        {type === 'privacy' ? <PrivacyPolicy /> : <Disclaimer />}
      </div>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div className="legal-text">
      <h2>Privacybeleid</h2>
      <p>Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>
      
      <h3>1. Algemene Informatie</h3>
      <p>
        Deze tool is speciaal ontworpen met privacy als hoogste prioriteit. 
        Omdat de Tekst Anonimiseerder <strong>100% offline</strong> in jouw eigen browser draait, 
        verwerken, verzenden of bewaren wij als beheerder van de website <strong>geen enkele data</strong>.
      </p>

      <h3>2. Wat gebeurt er met je gegevens?</h3>
      <p>
        <strong>Ingestuurde teksten:</strong> Je teksten verlaten nooit je computer, telefoon of tablet. Alle opsporing 
        en vervanging (anonimisering) gebeurt direct op het werkgeheugen van jouw eigen apparaat. Er vindt geen enkele netwerkverbinding plaats om teksten te analyseren.
      </p>
      <p>
        <strong>Geen servers of databases:</strong> Wij hebben geen servers die jouw bestanden, teksten of patronen opslaan.
      </p>

      <h3>3. Cookies & Tracking</h3>
      <p>
        Wij maken <strong>geen</strong> gebruik van tracking-cookies, analyse-software (zoals Google Analytics), 
        of advertentienetwerken. De website verzamelt geen gegevens over jouw bezoekgedrag.
      </p>

      <h3>4. AVG / GDPR</h3>
      <p>
        Omdat deze applicatie uitsluitend in je browser draait en wij geen data van onze gebruikers (of de in de tool verwerkte teksten) opslaan of inzien, 
        treden wij juridisch gezien niet op als 'Verwerker' in de zin van de Algemene Verordening Gegevensbescherming (AVG). 
        Je blijft als eindgebruiker te allen tijde zelf verantwoordelijk voor de rechtmatige gegevensverwerking en het veilig bewaren van het <code>.anon</code> sleutelbestand.
      </p>

      <h3>5. Omkeerbare Pseudonimisering (i.p.v. Anonimisering)</h3>
      <p>
        We noemen het een "Anonimiseerder" voor de herkenbaarheid, maar omdat de oorspronkelijke persoonsgegevens kunnen worden teruggehaald met het <code>.anon</code> sleutelbestand dat u zelf bewaart, bedrijft deze tool in technische en juridische zin <strong>geen volledige anonimisering, maar (omkeerbare) pseudonimisering</strong>. Houd daarnaast altijd rekening met <strong>contextuele herleidbaarheid</strong>: zelfs zonder vermelding van directe namen, kan iemand alsnog herkend worden aan de specifieke unieke context van de tekst.
      </p>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="legal-text">
      <h2>Disclaimer</h2>
      <p>Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>

      <h3>1. Eigen risico</h3>
      <p>
        Het gebruik van de Tekst Anonimiseerder is volledig op eigen risico. Wij aanvaarden geen aansprakelijkheid 
        voor enige directe of indirecte schade die zou kunnen ontstaan door het gebruik van de tool.
      </p>

      <h3>2. Geen garantie op volledige anonimisering (Pseudonimisering)</h3>
      <p>
        Deze tool helpt bij het lokaal herkennen en vervangen van directe persoonsgegevens, maar <strong>geeft geen enkele garantie</strong> dat een 
        tekst na gebruik 100% onherleidbaar is. Vanwege het genereerde sleutelbestand (<code>.anon</code>) is de data technisch gezien "gepseudonimiseerd". 
        Verder is de patroonherkenning beperkt en dekt de applicatie zelden tot nooit <strong>contextuele kenmerken</strong> af (bijv: "de 42 jarige directeur van basisschool X"). Er kunnen <em>false positives</em> en <em>false negatives</em> optreden.
      </p>
      <p>
        <strong>Je bent te allen tijde zelf verantwoordelijk voor het inschatten van contextuele risico's, het kritisch controleren van de uiteindelijke tekst en het eventueel handmatig verwijderen of aanpassen van gemiste privacygevoelige omschrijvingen.</strong>
      </p>

      <h3>3. Geen juridisch advies</h3>
      <p>
        De tool en de informatie op deze website vormen geen juridisch advies. Als je absolute zekerheid of formele verantwoording nodig hebt 
        over AVG-compliance of datalekken, raadpleeg dan altijd een juridisch expert binnen of buiten je organisatie.
      </p>

      <h3>4. Verantwoordelijkheid voor content</h3>
      <p>
        Aangezien alle verwerking en analyse uitsluitend op je eigen apparaat plaatsvindt, ben en blijf je zelf volledig verantwoordelijk voor de teksten en documenten die je 
        invult en opslaat. Wij hebben geen inzicht in, noch invloed op, de data die door de tool vloeit. En dat willen we ook helemaal niet.
      </p>

      <h3>5. Toepasselijk recht</h3>
      <p>
        Op het gebruik van deze tool en website is uitsluitend Nederlands recht van toepassing. Eventuele geschillen behoren tot de jurisdictie van de bevoegde Nederlandse rechter.
      </p>
    </div>
  );
}
