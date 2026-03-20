# Tekst Anonimiseerder 🛡️

Een veilige, snelle en betrouwbare webapplicatie die geschreven tekst of `.txt` bestanden anonimiseert **zonder** dat er data naar het internet wordt gestuurd. Alle verwerking en analyse vindt voor 100% plaats in het werkgeheugen van de browser van de gebruiker.

## Belangrijkste Functies

- **Privacy by Design:** Geen API's, geen databases, geen cloud. Alles draait offline in de browser via JavaScript.
- **Diepgaande Patroonherkenning:** Herkent en vervangt automatisch persoonsgegevens (PII) met behulp van reguliere expressies en lokale referentielijsten (vooramen, achternamen, plaatsnamen etc.).
- **Unieke Pseudo-sleutels:** Genereert unieke vervangers (zoals `[Naam 1]`, `[Plaats 2]`) om de leesbaarheid te waarborgen.
- **Omkeerbaar (De-anonimiseren):** Exporteert een veilig `.anon` JSON-sleutelbestand, waarmee bevoegden later de originele tekst lokaal weer kunnen omzetten.
- **Prachtige UI:** Strak vormgegeven met moderne *Glassmorphism*, zwevende sliders, en een hoogwaardige Canvas particle-achtergrond.
- **Performance & Security Geoptimaliseerd:** Lazy-loaded React componenten via Vite en ingebouwde configuraties voor Content Security Policies (CSP).

## Lijst van Herkende Elementen:
1. E-mailadressen
2. Telefoon- en mobiele nummers (NL/Internationaal)
3. IBAN / Rekeningnummers
4. Postcodes (NL)
5. BSN-nummers
6. Datums (DD-MM-YYYY, voluit geschreven etc.)
7. (Voor/Achter) Namen (O.b.v. grote interne lexicons)
8. Plaatsnamen en Landen
9. Leeftijden

## Beveiliging & Architectuur
Tijdens de ontwikkeling zijn uitvoerige safety-checks gedaan:
- Geen source map leakage (`build.sourcemap: false`).
- Geen framework of cloud fingerprinting (geen Firebase, backend of AI-modellen).
- Standaard inclusie van `_headers` voor directe beveiliging bij het hosten op CDN netwerken (Netlify/Cloudflare).
- Juridisch dekkend: Uitgebreide ingebouwde *Disclaimer* en *Privacybeleid* modals geïntegreerd in de UI.

## Installatie & Scripts

Zorg dat [Node.js](https://nodejs.org/) op je computer staat geïnstalleerd.

1. Installeer de afhankelijkheden:
   ```bash
   npm install
   ```

2. Start de development server:
   ```bash
   npm run dev
   ```
   De applicatie draait nu lokaal op `http://localhost:5173/`.

3. Bouw de applicatie voor productie:
   ```bash
   npm run build
   ```
   De geoptimaliseerde statische site komt in de `dist/` map terecht. Deze map kan op willekeurig welke statische webhost (zoals Vercel of Netlify) worden geplaatst.

## Herkomst
Deze tool is gebouwd met een sterke focus op dataveiligheid en ethisch programmeren. De achtergrond animatie is toegevoegd als subtiele 'ode' aan de ontwerper: AntiGravity.
