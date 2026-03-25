/**
 * detector.js — PII Detection Engine
 * 
 * Detecteert persoonsgevoelige informatie (PII) in tekst
 * met behulp van regex-patronen. Geen AI, alles lokaal.
 */

import { DUTCH_FIRST_NAMES, DUTCH_LAST_NAMES } from './dictionaries/names';
import { DUTCH_PLACES, WORLD_CITIES, COUNTRIES } from './dictionaries/places';

// Woorden die NIET als naam herkend moeten worden (veelvoorkomende zelfstandige naamwoorden aan begin van zinnen)
const COMMON_WORDS = new Set([
  '// Maanden en dagen (beginnen ook vaak met hoofdletter)  januari', '// Veelvoorkomende woorden die aan het begin van een zin staan  daarom', 'aan', 'absoluut', 'ad', 'af', 'al', 'alhoewel',
  'alle', 'alleen', 'allereerst', 'alles', 'als', 'altijd', 'ander', 'andere',
  'anderzijds', 'april', 'augustus', 'behalve', 'beiden', 'ben', 'bent', 'beslist',
  'best', 'bij', 'bijna', 'bijvoorbeeld', 'binnenkort', 'blijkbaar', 'boven', 'bovendien',
  'boy', 'circa', 'daar', 'daardoor', 'daarmee', 'daarna', 'daarnaast', 'dan',
  'dat', 'de', 'december', 'deze', 'die', 'dik', 'dinsdag', 'dit',
  'donderdag', 'door', 'doorgaans', 'dus', 'echt', 'echter', 'een', 'eerder',
  'eergisteren', 'elk', 'elkaar', 'elke', 'enerzijds', 'enkel', 'erg', 'februari',
  'fout', 'gaandeweg', 'geen', 'gelukkig', 'gewoonlijk', 'gisteren', 'goed', 'haar',
  'haast', 'hadden', 'heb', 'hebt', 'heeft', 'heel', 'helaas', 'hem',
  'herhaaldelijk', 'het', 'hier', 'hiermee', 'hij', 'hoe', 'hoewel', 'hoogstens',
  'hopelijk', 'hun', 'iedereen', 'iemand', 'iets', 'ik', 'immers', 'in',
  'inderdaad', 'indien', 'inmiddels', 'intussen', 'is', 'je', 'jij', 'job',
  'juist', 'juli', 'jullie', 'juni', 'kan', 'kennelijk', 'kortom', 'kunnen',
  'later', 'lente', 'maandag', 'maar', 'maart', 'mag', 'meer', 'mei',
  'meis', 'men', 'mens', 'met', 'mij', 'mijn', 'minder', 'minstens',
  'misschien', 'mits', 'moet', 'moeten', 'mogelijk', 'mogen', 'momenteel', 'morgen',
  'na', 'naar', 'nadat', 'namelijk', 'natuurlijk', 'niemand', 'niet', 'niets',
  'nog', 'nooit', 'november', 'nu', 'oftewel', 'ofwel', 'ogenschijnlijk', 'oktober',
  'om', 'omdat', 'ondanks', 'onder', 'ondertussen', 'ongetwijfeld', 'ongeveer', 'onmogelijk',
  'ons', 'onwaar', 'onze', 'ook', 'op', 'opdat', 'over', 'overmorgen',
  'pas', 'peer', 'per', 'precies', 'reeds', 'regelmatig', 'ruim', 'samengevat',
  'schijnbaar', 'sedert', 'september', 'sinds', 'slechts', 'soms', 'steeds', 'straks',
  'te', 'tegen', 'tegenwoordig', 'telkens', 'ten slotte', 'tenslotte', 'tenzij', 'ter',
  'terwijl', 'tijdens', 'toch', 'toe', 'toen', 'ton', 'tot', 'totdat',
  'tussen', 'uit', 'uiteindelijk', 'uiteraard', 'uw', 'vaak', 'van', 'vandaag',
  'vandaar', 'vanzelfsprekend', 'vast', 'veel', 'verder', 'vervolgens', 'volgens', 'voor',
  'voordat', 'vrij', 'vrijdag', 'vroeger', 'waar', 'waarom', 'waarschijnlijk', 'wanneer',
  'want', 'waren', 'was', 'wat', 'we', 'wel', 'welke', 'wellicht',
  'werd', 'werden', 'wie', 'wij', 'wil', 'willen', 'wilt', 'woensdag',
  'zal', 'zaterdag', 'ze', 'zeer', 'zeker', 'zelden', 'zelf', 'zich',
  'zij', 'zijn', 'zo', 'zodat', 'zodra', 'zondag', 'zonder', 'zullen'
]);

// Categorieën en hun regex-patronen
const PATTERNS = [
  {
    category: 'email',
    label: 'E-mailadres',
    regex: /\b[A-Za-z0-9._%+\-]+(?:@|\s*[\(\[\{]at[\)\]\}]\s*|\s+at\s+|\s+apestaartje\s+)[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/gi,
    priority: 10,
  },
  {
    category: 'url',
    label: 'URL',
    // Vangt http(s), ftp(s), sftp, ws(s) en meer, www., én naakte domeinen met specifieke TLD's (voorkomt false positives) inclusief eventuele paden
    regex: /\b(?:(?:https?|ftps?|sftp|wss?|smb|ssh|file|git|svn):\/\/|www\.)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9\-._~:\/?#\[\]@!$&'()*+,;=]*)?|\b[a-zA-Z0-9.\-]+\.(?:com|org|net|edu|gov|nl|be|de|fr|uk|es|it|eu|io|co|info|biz|me|tv|xyz|app|online|site|nu|ru|vlaanderen|amsterdam|frl)\b(?:\/[a-zA-Z0-9\-._~:\/?#\[\]@!$&'()*+,;=]*)?/gi,
    priority: 10,
  },
  {
    category: 'iban',
    label: 'IBAN',
    regex: /\b[A-Z]{2}\d{2}\s?[A-Z]{4}\s?\d{4}\s?\d{4}\s?\d{2,4}\s?\d{0,4}\b/g,
    priority: 10,
  },
  {
    category: 'telefoon',
    label: 'Telefoonnummer',
    // Vangt internationale (+X, 00X) en nationale (0X) nummers incl haakjes (0) en afwisselende spaties/streepjes
    regex: /(?:(?:\+|00)[1-9]\d{0,2}[\s\-\.]?(?:\(0\))?|(?:\b|\()0\d{1,4}(?:\))?)[\s\-\.]?(?:\d[\s\-\.]?){5,12}\d\b/g,
    priority: 8,
  },
  {
    category: 'postcode',
    label: 'Postcode',
    regex: /\b\d{4}\s?[A-Za-z]{2}\b/g,
    priority: 8,
  },
  {
    category: 'adres',
    label: 'Adres',
    // Vangt aaneengeschreven straatnamen (bijv. Kerkstraat 12, Zonnelaan 4-b), incl tot 5 cijfers voor huisnummer (+ toevoeging)
    regex: /\b[A-Za-z\u00C0-\u00FF]{2,}(?:straat|weg|laan|dijk|pad|steeg|plein|hof|kade|singel|gracht|baan|dreef|plantsoen|park|burg|wal|heuvel|horst|kamp|veld|brink|oord|avenue|oever|gang|passage|promenade|erf|markt|streek|hoek|zijde|kant|water|gronden|vaart)\s+\d{1,5}(?:[\s\-]?[A-Za-z]{1,2})?(?:[\s\-]?\d{1,3})?\b/gi,
    priority: 7,
  },
  {
    category: 'adres',
    label: 'Adres',
    // Vangt losgeschreven straatnamen (bijv. Grote Markt 1, Laan van Meerdervoort 12, Korte Nieuwstraat 14)
    regex: /\b(?:[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+\s+){1,4}(?:Straat|Weg|Laan|Plein|Hof|Kade|Singel|Gracht|Boulevard|Park|Plantsoen|Markt|Avenue|Oever|Gang|Passage|Promenade|Erf|Streek|Zijde|Water|Vaart)\s+\d{1,5}(?:[\s\-]?[A-Za-z]{1,2})?(?:[\s\-]?\d{1,3})?\b|\b(?:Straat|Weg|Laan|Plein|Boulevard|Kade|Avenue|Oever|Gang|Passage|Promenade|Erf|Markt)\s+(?:van\s+|de\s+|den\s+|der\s+|het\s+|'t\s+)?(?:[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+\s+){0,3}[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+\s+\d{1,5}(?:[\s\-]?[A-Za-z]{1,2})?(?:[\s\-]?\d{1,3})?\b/g,
    priority: 7,
  },
  {
    category: 'datum',
    label: 'Datum',
    // 8-digit data, YYYYMMDD of DDMMYYYY (optioneel met aan elkaar geplakte tijd _HHMM)
    regex: /\b(?:(?:(?:19|20)\d{2})(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])(?:_[0-2]\d[0-5]\d)?|(?:0[1-9]|[12]\d|3[01])(?:0[1-9]|1[0-2])(?:(?:19|20)\d{2})(?:_[0-2]\d[0-5]\d)?)\b/g,
    priority: 9,
  },
  {
    category: 'datum',
    label: 'Datum',
    // Numerieke datums met scheidingstekens: 15-03-2026, 15/03/2026, 2026-03-15, 25-03, 25/3, 25/03/26, etc.
    // Dekt ook US (MM/DD/YYYY) en Computer (YYYY-MM-DD)
    regex: /\b(?:\d{1,4}[\-\/\.\u2013\u2014]\d{1,2}[\-\/\.\u2013\u2014]\d{2,4}(?:_[0-2]\d[0-5]\d)?|\d{1,2}[\-\/]\d{1,2})\b/g,
    priority: 9,
  },
  {
    category: 'datum',
    label: 'Datum',
    // Tekstuele datums (NL & EN): 15 maart 2026, 2 jan 2024, mrt25, 25 mrt, March 15th 2026
    regex: /\b(?:\d{1,2}\s*(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|mar|apr|may|jun|jul|aug|sep|okt|oct|nov|dec)\.?(?:\s*,?\s*\d{2,4})?|(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|mar|apr|may|jun|jul|aug|sep|okt|oct|nov|dec)\.?\s*\d{1,2}(?:\s*,?\s*\d{2,4})?)\b/gi,
    priority: 9,
  },
  {
    category: 'datum',
    label: 'Datum',
    // Apostrof jaartallen ('26 of ’26)
    regex: /(?<=\s|^)['’]\d{2}\b/g,
    priority: 9,
  },
  {
    category: 'bsn',
    label: 'BSN',
    // 9-cijferig nummer (Burger Service Nummer) incl notaties 1234-56-789
    regex: /\b\d{4}[\s\-\/]\d{2}[\s\-\/]\d{3}\b|\b\d{3}[\s\-\/]\d{3}[\s\-\/]\d{3}\b|\b\d{9}\b/g,
    priority: 6,
  },
];

/**
 * Controleert of een woord waarschijnlijk een naam is.
 * Vereisten: begint met hoofdletter, staat niet in de stopwoordenlijst.
 */
function isLikelyName(word) {
  if (!word || word.length < 2) return false;
  if (!/^[A-Z\u00C0-\u00FF]/.test(word)) return false;
  const lower = word.toLowerCase();
  if (COMMON_WORDS.has(lower)) return false;
  return true;
}

/**
 * Controleert of een woord in de namenlijst voorkomt.
 */
function isKnownName(word) {
  return DUTCH_FIRST_NAMES.has(word.toLowerCase()) || DUTCH_LAST_NAMES.has(word.toLowerCase());
}

/**
 * Detecteert namen in de tekst. Zoekt naar:
 * 1. Bekende voor-/achternamen uit de lijst
 * 2. Woorden met hoofdletter die niet aan het begin van een zin staan
 * 3. Patronen als "Voornaam Achternaam" (twee hoofdletterwoorden achter elkaar)
 */
function detectNames(text) {
  const matches = [];
  
  // Patroon: twee of meer opeenvolgende woorden die met een hoofdletter beginnen
  // (middenin een zin = waarschijnlijk een naam)
  const multiWordNameRegex = /(?<=[a-z\u00E0-\u00FF.,;:!?\s]\s)([A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+(?:\s+(?:de|van|der|den|het|ter|ten)\s+)?[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+(?:\s+(?:de|van|der|den|het|ter|ten)\s+[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+)?)/g;
  
  let match;
  while ((match = multiWordNameRegex.exec(text)) !== null) {
    matches.push({
      original: match[0],
      start: match.index,
      end: match.index + match[0].length,
      category: 'naam',
      label: 'Naam',
    });
  }

  // Patroon: individuele woorden die bekende namen zijn (alleen als ze niet al onderdeel van een multi-word match zijn)
  const singleWordRegex = /\b([A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]{1,})\b/g;
  while ((match = singleWordRegex.exec(text)) !== null) {
    const word = match[1];
    // Check of dit woord al onderdeel is van een eerder gevonden match
    const alreadyCovered = matches.some(
      m => match.index >= m.start && match.index < m.end
    );
    if (alreadyCovered) continue;
    
    // Controleer of het een bekend naam is
    if (isKnownName(word)) {
      // Extra check: staat het aan het begin van een zin?
      const before = text.substring(Math.max(0, match.index - 3), match.index);
      const atSentenceStart = match.index === 0 || /[.!?]\s*$/.test(before) || /^\s*$/.test(before);
      
      // Als het aan het begin van een zin staat, alleen opnemen als het echt in de namenlijst staat
      if (atSentenceStart && !isKnownName(word)) continue;
      
      matches.push({
        original: word,
        start: match.index,
        end: match.index + word.length,
        category: 'naam',
        label: 'Naam',
      });
    }
  }

  return matches;
}

/**
 * Detecteert steden/dorpen/plaatsen aan de hand van de dictionary lijst.
 */
function detectPlaces(text) {
  const matches = [];
  const singleWordRegex = /\b([A-Z\u00C0-\u00FFa-z\u00E0-\u00FF\-\']{2,})\b/ig;
  
  let match;
  while ((match = singleWordRegex.exec(text)) !== null) {
    const word = match[1];
    const wordLower = word.toLowerCase();
    
    // Voorkom foutmaten door alleen woorden met minimaal een beginkapitaal te pakken als plaats
    if (!/^[A-Z\u00C0-\u00FF]/.test(word)) continue;
    
    if (DUTCH_PLACES.has(wordLower) || WORLD_CITIES.has(wordLower) || COUNTRIES.has(wordLower)) {
      matches.push({
        original: word,
        start: match.index,
        end: match.index + word.length,
        category: 'plaats',
        label: 'Plaats',
      });
    }
  }
  
  // Voeg ondersteuning toe voor multi-word steden ('Den Haag', 'New York' etc) en multi-word landen
  const multiWordRegex = /\b([A-Z\u00C0-\u00FF][a-zA-Z\u00C0-\u00FF]*\s(?:[a-zA-Z\u00C0-\u00FF]+\s)?[A-Z\u00C0-\u00FF][a-zA-Z\u00C0-\u00FF]*)\b/g;
  while ((match = multiWordRegex.exec(text)) !== null) {
    const phrase = match[1];
    const phraseLower = phrase.toLowerCase();
    
    if (DUTCH_PLACES.has(phraseLower) || WORLD_CITIES.has(phraseLower) || COUNTRIES.has(phraseLower)) {
      matches.push({
        original: phrase,
        start: match.index,
        end: match.index + phrase.length,
        category: 'plaats',
        label: 'Plaats',
      });
    }
  }

  return matches;
}

/**
 * Hoofd detectiefunctie: scant tekst op alle PII categorieën.
 * Retourneert een lijst van unieke gevonden waarden met hun categorie.
 */
export function detectPII(text) {
  if (!text || text.trim().length === 0) return [];

  const allMatches = [];

  // Stap 1: Zoek met regex-patronen
  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        original: match[0],
        start: match.index,
        end: match.index + match[0].length,
        category: pattern.category,
        label: pattern.label,
        priority: pattern.priority,
      });
    }
  }

  // Stap 2: Zoek namen
  const nameMatches = detectNames(text);
  for (const nm of nameMatches) {
    nm.priority = 5;
    allMatches.push(nm);
  }

  // Stap 2b: Zoek plaatsen
  const placeMatches = detectPlaces(text);
  for (const pm of placeMatches) {
    pm.priority = 6;
    allMatches.push(pm);
  }

  // Stap 3: Verwijder overlappende matches (hogere prioriteit wint)
  allMatches.sort((a, b) => b.priority - a.priority || a.start - b.start);
  const filtered = [];
  for (const m of allMatches) {
    const overlaps = filtered.some(
      existing => m.start < existing.end && m.end > existing.start
    );
    if (!overlaps) {
      filtered.push(m);
    }
  }

  // Stap 4: Maak uniek op basis van de originele tekst
  const uniqueMap = new Map();
  for (const m of filtered) {
    const key = `${m.category}::${m.original}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        original: m.original,
        category: m.category,
        label: m.label,
      });
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Vindt alle posities van een specifieke tekst in de brontext.
 * Wordt gebruikt om te markeren en te vervangen.
 */
export function findAllOccurrences(text, searchTerm) {
  const positions = [];
  if (!searchTerm) return positions;
  
  let startIndex = 0;
  while (true) {
    const index = text.indexOf(searchTerm, startIndex);
    if (index === -1) break;
    positions.push({ start: index, end: index + searchTerm.length });
    startIndex = index + 1;
  }
  return positions;
}

/**
 * Detecteert het type van een handmatig ingevoerde tekst.
 */
export function detectCategory(text) {
  text = text.trim();
  
  // E-mail
  if (/^[A-Za-z0-9._%+\-]+(?:@|\s*[\(\[\{]at[\)\]\}]\s*|\s+at\s+|\s+apestaartje\s+)[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/i.test(text)) {
    return { category: 'email', label: 'E-mailadres' };
  }
  // URL
  if (/^(?:(?:https?|ftps?|sftp|wss?|smb|ssh|file|git|svn):\/\/|www\.)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9\-._~:\/?#\[\]@!$&'()*+,;=]*)?$|^[a-zA-Z0-9.\-]+\.(?:com|org|net|edu|gov|nl|be|de|fr|uk|es|it|eu|io|co|info|biz|me|tv|xyz|app|online|site|nu|ru|vlaanderen|amsterdam|frl)(?:\/[a-zA-Z0-9\-._~:\/?#\[\]@!$&'()*+,;=]*)?$/i.test(text)) {
    return { category: 'url', label: 'URL' };
  }
  // IBAN
  if (/^[A-Z]{2}\d{2}\s?[A-Z]{4}/.test(text)) {
    return { category: 'iban', label: 'IBAN' };
  }
  // Telefoon
  if (/^(?:(?:\+|00)[1-9]\d{0,2}[\s\-\.]?(?:\(0\))?|(?:\b|\()0\d{1,4}(?:\))?)[\s\-\.]?(?:\d[\s\-\.]?){5,12}\d$/.test(text)) {
    return { category: 'telefoon', label: 'Telefoonnummer' };
  }
  // Postcode
  if (/^\d{4}\s?[A-Za-z]{2}$/.test(text)) {
    return { category: 'postcode', label: 'Postcode' };
  }
  // Adres (Fysiek)
  if (/^[A-Za-z\u00C0-\u00FF]{2,}(?:straat|weg|laan|dijk|pad|steeg|plein|hof|kade|singel|gracht|baan|dreef|plantsoen|park|burg|wal|heuvel|horst|kamp|veld|brink|oord|avenue|oever|gang|passage|promenade|erf|markt|streek|hoek|zijde|kant|water|gronden|vaart)\s+\d{1,5}(?:[\s\-]?[A-Za-z]{1,2})?(?:[\s\-]?\d{1,3})?$/i.test(text) ||
      /^(?:[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+\s+){1,4}(?:Straat|Weg|Laan|Plein|Hof|Kade|Singel|Gracht|Boulevard|Park|Plantsoen|Markt|Avenue|Oever|Gang|Passage|Promenade|Erf|Streek|Zijde|Water|Vaart)\s+\d{1,5}(?:[\s\-]?[A-Za-z]{1,2})?(?:[\s\-]?\d{1,3})?$/.test(text) ||
      /^(?:Straat|Weg|Laan|Plein|Boulevard|Kade|Avenue|Oever|Gang|Passage|Promenade|Erf|Markt)\s+(?:van\s+|de\s+|den\s+|der\s+|het\s+|'t\s+)?(?:[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+\s+){0,3}[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+\s+\d{1,5}(?:[\s\-]?[A-Za-z]{1,2})?(?:[\s\-]?\d{1,3})?$/.test(text)) {
    return { category: 'adres', label: 'Adres' };
  }
  // Datum (8-digit met evt tijd)
  if (/^(?:(?:19|20)\d{2})(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])(?:_[0-2]\d[0-5]\d)?$|^(?:0[1-9]|[12]\d|3[01])(?:0[1-9]|1[0-2])(?:(?:19|20)\d{2})(?:_[0-2]\d[0-5]\d)?$/.test(text)) {
    return { category: 'datum', label: 'Datum' };
  }
  // Datum (Numeriek met scheidingstekens)
  if (/^\d{1,4}[\-\/\.\u2013\u2014]\d{1,2}[\-\/\.\u2013\u2014]\d{2,4}(?:_[0-2]\d[0-5]\d)?$|^\d{1,2}[\-\/]\d{1,2}$/.test(text)) {
    return { category: 'datum', label: 'Datum' };
  }
  // Datum (Tekstueel)
  if (/^\d{1,2}\s*(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|mar|apr|may|jun|jul|aug|sep|okt|oct|nov|dec)\.?(?:\s*,?\s*\d{2,4})?$|^(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|mar|apr|may|jun|jul|aug|sep|okt|oct|nov|dec)\.?\s*\d{1,2}(?:\s*,?\s*\d{2,4})?$/i.test(text)) {
    return { category: 'datum', label: 'Datum' };
  }
  // Datum (Apostrof jaar)
  if (/^['’]\d{2}$/.test(text)) {
    return { category: 'datum', label: 'Datum' };
  }
  // BSN (9 cijfers incl formaten)
  if (/^\d{4}[\s\-\/]\d{2}[\s\-\/]\d{3}$|^\d{3}[\s\-\/]\d{3}[\s\-\/]\d{3}$|^\d{9}$/.test(text)) {
    return { category: 'bsn', label: 'BSN' };
  }
  // Puur getal
  if (/^\d+$/.test(text)) {
    return { category: 'nummer', label: 'Nummer' };
  }
  // Anders: waarschijnlijk een naam
  return { category: 'naam', label: 'Naam' };
}
