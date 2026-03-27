# (De-)Anonimiseerder 🛡️

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-purple.svg)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/Security-A%2B-success.svg)](#)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local-success.svg)](#)
[![Version](https://img.shields.io/badge/version-1.0.3-informational.svg)](#)

Een veilige, bliksemsnelle en betrouwbare webapplicatie (SPA) ontworpen om teksten, notulen en persoonsgegevens (PII) te anonimiseren **zonder** dat er ooit data de browser verlaat. Alle verwerking en analyse vindt voor 100% lokaal in het werkgeheugen plaats.

![Schermafbeelding Webapp](https://img.shields.io/badge/Screenshot-App-blue?style=for-the-badge) <!-- Optional screenshot placeholder -->

## 🚀 Belangrijkste Functies

- **Privacy by Design:** Geen API's, geen databases, geen externe backend elementen. Alles draait offline in je eigen client.
- **Diepgaande Patroonherkenning:** Herkent geavanceerde datatypes via complexe reguliere expressies en gigantische ingebouwde referentielijsten (>2200 veelvoorkomende voornamen en >3300 wereldwijde/Nederlandse locaties).
- **Consistente Pseudonimisering:** Genereert direct leesbare, context-bewuste vervangers (zoals `Jan de Vries` → `Sofie van Houten`) om de vloeiendheid in de tekst te behouden.
- **Omkeerbaar (De-anonimiseren):** Exporteert na elke sessie een veilig `.anon` JSON-sleutelbestand. Deze fungeert als versleutelloze mapping om de originele tekst later simpel en exact te herstellen.
- **Terugkerende Onderwerpen:** Ondersteuning voor het 'stacken' of uploaden van voorgaande `.anon` bestanden. Ideaal voor periodieke besprekingen waarbij dezelfde personen elke iteratie exact hetzelfde unieke pseudoniem moeten houden.
- **State-of-the-Art UI:** Strak vormgegeven met *Glassmorphism*, in/uitklapbare tabbladen, vloeiende micro-interacties, responsief Mobile design en een strak, contrastrijk dark-mode thema mét iconisch (De-)Anonimiseerder logo.

## 🔎 Wat wordt er feilloos herkend?

De engine is ontworpen (bewust zónder ondoorzichtige AI te gebruiken) op het trefzeker en razendsnel detecteren van:
1. **(Voor/Achter) Namen** (o.b.v. grote interne lexicons, hoofdlettergebruik en woord-uitsluiting)
2. **Plaatsnamen en Landen** (Globale dekking via >195 staten en >3300 actuele Nederlandse gemeentes/dorpen)
3. **E-mailadressen** (Inclusief hardnekkig geobfusceerde formaten zoals `(at)`, `[at]` en `apestaartje`)
4. **URL's & Netwerkprotocollen** (`https`, `ftp`, `sftp`, `smb`, incl. paden en kale domeinen)
5. **Telefoon- en Mobiele nummers** (Internationale prefixes en complexe notaties inclusief leestekening en spatiëring)
6. **Datums** (US, ISO, NL, uitgeschreven maanden, afgekorte jaren `’26`, optioneel met tijdnotaties er aan vastgeplakt)
7. **Postcodes** (NL formaten)
8. **Fysieke Adressen** (Straatnamen gebaseerd op gigantische prefix/suffix lijsten incl huisnummers)
9. **IBAN / Rekeningnummers**
10. **BSN-nummers** (Alle notaties, bijv. `1234 56 789` of `1234/56/789`)

## 🔐 Beveiliging & Architectuur

Deze codebase is op het hoogste niveau verhard en geoptimaliseerd voor productie:
- **Zero-Footprint:** Geen trackable analytics, geen cloud fingerprinting map-leaks (`build.sourcemap: false`), volledig AVG proof.
- **Security Headers:** Strict geconfigureerd met Content Security Policies (CSP), X-Frame-Options (DENY) via `vercel.json` en legacy `_headers` bestanden voor absolute browser lockdown.
- **Geoptimaliseerde Bundels:** Vite Manual-Chunking (Rollup Configuratie) separeert zware externe vendor blokken van de eigen applicatielogica voor sneller paralellizeren van browser caches.
- **CSS Skeleton Loading:** Voorkomt Flash-Of-Unstyled-Content (FOUC), vult de DOM vóór React hydratatie en maximaliseert Performance scores bij scan-tools.
- **Juridisch Dekkend:** Volledig ingebouwde dynamische én indexeerbare statische *Disclaimer* en *Privacybeleid* pagina's beschikbaar voor inspectie-crawlers.

## 🛠️ Installatie & Scripts

Zorg dat [Node.js](https://nodejs.org/) op je development machine beschikbaar is.

1. **Clone de repository en installeer pakketten:**
   ```bash
   npm install
   ```

2. **Start de lokale (Development) server:**
   ```bash
   npm run dev
   ```
   De applicatie en watch-server starten op `http://localhost:5173/`.

3. **Bouw voor Productie / Deployment:**
   ```bash
   npm run build
   ```
   De geoptimaliseerde statische applicatie (`dist/` map) is hiermee geprepareerd voor zero-config CI/CD verwerking bij platformen als **Vercel** of **Netlify**.

---
*Gebouwd met een compromisloze visie op dataveiligheid en snelle betrouwbaarheid.* 
*Ontwerpers-Ode: The background canvas engine and sleek frontend concepts are inspired by the digital aesthetics of AntiGravity.*
