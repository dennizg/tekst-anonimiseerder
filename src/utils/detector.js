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
  'de', 'het', 'een', 'dit', 'dat', 'deze', 'die', 'wat', 'wie', 'waar',
  'wanneer', 'waarom', 'hoe', 'welke', 'alle', 'veel', 'meer', 'minder',
  'ook', 'nog', 'wel', 'niet', 'geen', 'maar', 'want', 'omdat', 'als',
  'dan', 'toen', 'daar', 'hier', 'nu', 'reeds', 'echter', 'dus', 'toch',
  'voor', 'van', 'met', 'over', 'door', 'naar', 'bij', 'onder', 'boven',
  'tussen', 'zonder', 'tegen', 'tot', 'uit', 'op', 'in', 'aan', 'om',
  'na', 'per', 'ter', 'sinds', 'tijdens', 'volgens', 'ondanks', 'behalve',
  'zij', 'hij', 'wij', 'ik', 'jij', 'je', 'we', 'ze', 'men', 'hun',
  'haar', 'hem', 'ons', 'mij', 'zich', 'elkaar', 'zelf', 'iets', 'niets',
  'iemand', 'niemand', 'iedereen', 'alles', 'elke', 'elk', 'ander',
  'andere', 'beiden', 'heel', 'erg', 'zeer', 'zo', 'te', 'vrij',
  'best', 'juist', 'precies', 'slechts', 'alleen', 'enkel', 'pas',
  'bijna', 'haast', 'ongeveer', 'circa', 'ruim', 'minstens', 'hoogstens',
  'bovendien', 'daarnaast', 'verder', 'vervolgens', 'daarna', 'ten slotte',
  'kortom', 'samengevat', 'immers', 'namelijk', 'bijvoorbeeld', 'oftewel',
  'ofwel', 'enerzijds', 'anderzijds', 'hoewel', 'alhoewel', 'terwijl',
  'indien', 'mits', 'tenzij', 'zodra', 'voordat', 'nadat', 'totdat',
  'sinds', 'sedert', 'opdat', 'zodat',
  // Maanden en dagen (beginnen ook vaak met hoofdletter)
  'januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli',
  'augustus', 'september', 'oktober', 'november', 'december',
  'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag',
  // Veelvoorkomende woorden die aan het begin van een zin staan
  'daarom', 'daardoor', 'vandaar', 'vandaag', 'gisteren', 'morgen',
  'overmorgen', 'eergisteren', 'straks', 'later', 'eerder', 'vroeger',
  'tegenwoordig', 'momenteel', 'binnenkort', 'uiteindelijk', 'tenslotte',
  'allereerst', 'vervolgens', 'daarmee', 'hiermee', 'waarschijnlijk',
  'misschien', 'wellicht', 'mogelijk', 'onmogelijk', 'natuurlijk',
  'uiteraard', 'vanzelfsprekend', 'helaas', 'gelukkig', 'hopelijk',
  'kennelijk', 'blijkbaar', 'schijnbaar', 'ogenschijnlijk', 'inderdaad',
  'absoluut', 'zeker', 'beslist', 'ongetwijfeld', 'vast',
  'nooit', 'altijd', 'vaak', 'soms', 'zelden', 'regelmatig',
  'gewoonlijk', 'doorgaans', 'steeds', 'telkens', 'herhaaldelijk',
  'af', 'toe', 'inmiddels', 'intussen', 'ondertussen', 'gaandeweg',
]);

// Categorieën en hun regex-patronen
const PATTERNS = [
  {
    category: 'email',
    label: 'E-mailadres',
    regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    priority: 10,
  },
  {
    category: 'url',
    label: 'URL',
    regex: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g,
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
    // Nederlandse formaten: 06-12345678, 020-1234567, +31612345678, etc.
    regex: /(?:\+31[\s\-]?(?:\(0\))?[\s\-]?\d[\s\-]?\d{2,}[\s\-]?\d{2,}[\s\-]?\d{0,4}|\b0\d[\s\-]?\d{2,}[\s\-]?\d{2,}[\s\-]?\d{0,4})\b/g,
    priority: 9,
  },
  {
    category: 'postcode',
    label: 'Postcode',
    regex: /\b\d{4}\s?[A-Z]{2}\b/g,
    priority: 8,
  },
  {
    category: 'datum',
    label: 'Datum',
    // Numerieke datums: 15-03-2026, 15/03/2026, 15.03.2026, 2026-03-15, etc.
    // Ondersteunt ook unicode dashes (en-dash, em-dash)
    regex: /\b\d{1,2}[\-\/\.\u2013\u2014]\d{1,2}[\-\/\.\u2013\u2014]\d{2,4}\b|\b\d{4}[\-\/\.\u2013\u2014]\d{1,2}[\-\/\.\u2013\u2014]\d{1,2}\b/g,
    priority: 9,
  },
  {
    category: 'datum',
    label: 'Datum',
    // Tekstuele datums: 15 maart 2026, 2 jan 2024, of gewoon 1 april (jaartal is optioneel)
    regex: /\b\d{1,2}\s+(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|apr|jun|jul|aug|sep|okt|nov|dec)\.?(?:\s+\d{2,4})?\b/gi,
    priority: 9,
  },
  {
    category: 'bsn',
    label: 'BSN',
    // 9-cijferig nummer (Burger Service Nummer)
    regex: /\b\d{9}\b/g,
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
  if (/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(text)) {
    return { category: 'email', label: 'E-mailadres' };
  }
  // URL
  if (/^https?:\/\//.test(text)) {
    return { category: 'url', label: 'URL' };
  }
  // IBAN
  if (/^[A-Z]{2}\d{2}\s?[A-Z]{4}/.test(text)) {
    return { category: 'iban', label: 'IBAN' };
  }
  // Telefoon
  if (/^(?:\+31|0\d)[\s\-]?\d/.test(text)) {
    return { category: 'telefoon', label: 'Telefoonnummer' };
  }
  // Postcode
  if (/^\d{4}\s?[A-Z]{2}$/.test(text)) {
    return { category: 'postcode', label: 'Postcode' };
  }
  // Datum (Numeriek: 15-03-2026)
  if (/^\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4}$/.test(text)) {
    return { category: 'datum', label: 'Datum' };
  }
  // Datum (Tekstueel: 1 april of 15 maart 2026)
  if (/^\d{1,2}\s+(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|apr|jun|jul|aug|sep|okt|nov|dec)\.?(?:\s+\d{2,4})?$/i.test(text)) {
    return { category: 'datum', label: 'Datum' };
  }
  // BSN (9 cijfers)
  if (/^\d{9}$/.test(text)) {
    return { category: 'bsn', label: 'BSN' };
  }
  // Puur getal
  if (/^\d+$/.test(text)) {
    return { category: 'nummer', label: 'Nummer' };
  }
  // Anders: waarschijnlijk een naam
  return { category: 'naam', label: 'Naam' };
}
