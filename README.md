# (De-)Anonimiseerder 🛡️

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-purple.svg)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/Security-A%2B-success.svg)](#)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local-success.svg)](#)
[![Version](https://img.shields.io/badge/version-1.3.2-informational.svg)](#)

Een webapplicatie (SPA) waarmee teksten, notulen en persoonsgegevens (PII) lokaal en **omkeerbaar gepseudonimiseerd** kunnen worden, zonder dat er data de browser verlaat. Alle verwerking vindt plaats in het werkgeheugen van het apparaat van de gebruiker.

## 🚀 Belangrijkste Functies

- **Privacy by Design:** Geen API's, geen databases, geen externe backend elementen, geen client-side analytics. Alles draait 100% offline in de browser — er wordt nooit data verstuurd.
- **Instructievideo's:** Twee ingebedde YouTube tutorials (basis en geavanceerd gebruik) in het uitleg-paneel.
- **Transparantie:** Volledig Open Source. De broncode is vrij inzichtelijk op GitHub.
- **Patroonherkenning:** Herkent veelvoorkomende PII-categorieën via reguliere expressies en ingebouwde referentielijsten (>2200 voornamen en >3300 Nederlandse/wereldwijde locaties).
- **Consistente Pseudonimisering:** Genereert leesbare, context-bewuste vervangers (bijv. `Jan de Vries` → `Sofie van Houten`) om de leesbaarheid van de tekst te behouden.
- **Omkeerbaar (De-anonimiseren):** Exporteert na elke sessie een `.anon` JSON-sleutelbestand waarmee de originele tekst later exact hersteld kan worden.
- **Document Ondersteuning:** Verwerking van `.docx`, `.xlsx` en `.csv` bestanden (tot 100 MB), waarbij opmaak en styling behouden blijven. Verouderde `.doc` bestanden worden geblokkeerd met conversie-instructies.
- **Twee Modi:** Keuze tussen *Realistische Vertaalslag* (fictieve namen voor leesbaarheid) en *Placeholder Modus* (bijv. `[PERSOON_1]` voor machinale verwerking). Met tips voor AI-gebruik.
- **Terugkerende Onderwerpen:** Ondersteuning voor het hergebruiken van eerdere `.anon` bestanden, zodat dezelfde personen bij elke sessie hetzelfde pseudoniem houden.
- **Deduplicatie (1x Uniek):** Weergavemodus die elk woord slechts één keer toont, handig voor het scannen op gemiste PII in lange teksten.
- **Woordgrens-herkenning:** Vervangingen vinden alleen plaats op hele woorden — "Sam" wordt niet vervangen als onderdeel van "samen" of "samenwerkingsruimte".
- **UI:** Vormgegeven met glassmorphism, drag-and-drop zones, light/dark mode en responsive layout.
- **Frequentie-tellingen:** Live overzicht van het aantal keer dat elke gevonden term voorkomt in de tekst of het document.

## 🔎 Wat wordt er herkend?

De engine detecteert (zonder AI) de volgende categorieën:
1. **(Voor/Achter) Namen** — op basis van interne woordenlijsten, hoofdlettergebruik en woord-uitsluiting
2. **Plaatsnamen en Landen** — >195 landen en >3300 Nederlandse gemeentes/dorpen
3. **E-mailadressen** — inclusief geobfusceerde notaties zoals `(at)`, `[at]`, `apestaartje`
4. **URL's & Netwerkprotocollen** — `https`, `ftp`, `sftp`, `smb`, inclusief paden en kale domeinen
5. **Telefoon- en Mobiele nummers** — internationale prefixes en diverse notaties
6. **Datums** — US, ISO, NL, uitgeschreven maanden, afgekorte jaren (`'26`), optioneel met tijdnotaties
7. **Postcodes** — NL formaten
8. **Fysieke Adressen** — straatnamen op basis van prefix/suffix lijsten, inclusief huisnummers
9. **IBAN / Rekeningnummers**
10. **BSN-nummers** — diverse notaties (bijv. `1234 56 789` of `1234/56/789`)

Patroonherkenning is niet foutloos. Controleer het resultaat altijd handmatig.

## 🔐 Beveiliging, Architectuur & Prestaties

- **Zero-Footprint:** Geen client-side analytics, geen tracking beacons, geen cookies. De CSP `connect-src` staat uitsluitend `'self'` toe — de browser maakt vanuit deze applicatie geen externe verbindingen. Sourcemaps zijn uitgeschakeld (`build.sourcemap: false`).
- **Security Headers:** Content Security Policy (CSP), `object-src: 'none'`, X-Frame-Options (DENY), Cross-Origin-Opener-Policy (COOP) en Cross-Origin-Resource-Policy (CORP). Getest met een **A+ score** op de Mozilla HTTP Observatory.
- **Supply Chain Security:** Dependencies worden gemonitord op kwetsbaarheden. Bekende CVE's worden gepatcht via gerichte overrides.
- **Prestaties:** Geoptimaliseerd voor snelle laadtijden (LCP ~1.1s, CLS 0.0) via code-splitting, Brotli-compressie en skeleton loading.
- **Toegankelijkheid (WCAG 2.1 AA):** Doorgelicht met Axe en Catchpoint. Contrastverhoudingen (minimaal 4.5:1) en semantiek zijn geoptimaliseerd voor zowel light als dark mode.
- **Juridisch:** Ingebouwde *Disclaimer* en *Privacybeleid* pagina's (dynamisch en als statische HTML). Omdat de output via het `.anon` sleutelbestand omkeerbaar is, betreft het strikt genomen *pseudonimisering*, geen volledige anonimisering. Gebruikers dienen zelf op contextuele herleidbaarheid te letten.
- **Open voor Audits:** De broncode staat open voor onafhankelijke code-audits. Beveiligingsonderzoekers en ontwikkelaars worden uitgenodigd verbeteringen aan te dragen.

## 🛠️ Installatie & Scripts

Vereist: [Node.js](https://nodejs.org/)

1. **Installeer pakketten:**
   ```bash
   npm install
   ```

2. **Start de development server:**
   ```bash
   npm run dev
   ```
   De applicatie draait op `http://localhost:5173/`.

3. **Bouw voor productie:**
   ```bash
   npm run build
   ```
   De statische output (`dist/`) kan gedeployd worden op platformen als Vercel of Netlify.

---
*Ontworpen met een focus op dataveiligheid en lokale verwerking.*
