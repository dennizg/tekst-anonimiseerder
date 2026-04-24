/**
 * generator.js — Fictieve Vervanging Generator
 * 
 * Genereert realistische maar fictieve vervangingen
 * voor elke PII-categorie. Alles lokaal, geen externe calls.
 */

import { DUTCH_FIRST_NAMES, DUTCH_LAST_NAMES } from './dictionaries/names';
import { DUTCH_PLACES, WORLD_CITIES, COUNTRIES } from './dictionaries/places';

// Zet de Sets om naar Arrays voor pseudo-random pick functionaliteit
const FAKE_FIRST_NAMES = Array.from(DUTCH_FIRST_NAMES).map(name => name.charAt(0).toUpperCase() + name.slice(1));
const FAKE_LAST_NAMES = Array.from(DUTCH_LAST_NAMES).map(name => name.split(' ').map(part => part === 'van' || part === 'de' || part === 'den' || part === 'der' ? part : part.charAt(0).toUpperCase() + part.slice(1)).join(' '));
const FAKE_CITIES = [...Array.from(DUTCH_PLACES), ...Array.from(WORLD_CITIES), ...Array.from(COUNTRIES)].map(city => city.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '));

const FAKE_DOMAINS = [
  'voorbeeld.nl', 'test-mail.nl', 'demo-adres.nl', 'fictief.nl',
  'nep-domein.nl', 'ander-adres.nl', 'sample.nl', 'placeholder.nl',
];

// Houdt bij welke vervangers al zijn uitgedeeld om duplicaten te voorkomen
let usedFirstNames = new Set();
let usedLastNames = new Set();
let usedCounters = {};

// ── Placeholder-modus ──────────────────────────────────────────────────────
// Doorgenummerde labels per categorie: [Persoon1], [Plaatsnaam1], etc.

const PLACEHOLDER_LABELS = {
  naam:     'Persoon',
  email:    'E-mailadres',
  telefoon: 'Telefoonnummer',
  postcode: 'Postcode',
  datum:    'Datum',
  iban:     'IBAN',
  bsn:      'BSN',
  url:      'URL',
  nummer:   'Nummer',
  plaats:   'Plaatsnaam',
  adres:    'Adres',
};

let placeholderCounters = {};

/**
 * Genereert een doorgenummerde placeholder op basis van de categorie.
 * Bijv. [Persoon1], [Persoon2], [Plaatsnaam1], …
 */
export function generatePlaceholder(original, category) {
  const label = PLACEHOLDER_LABELS[category] || 'Anoniem';
  if (!placeholderCounters[category]) placeholderCounters[category] = 0;
  placeholderCounters[category]++;
  return `[${label}${placeholderCounters[category]}]`;
}

/**
 * Genereert een cryptografisch veilige random float tussen 0 en 1
 * Ter vervanging van het onveilige Math.random()
 */
const secureRandom = () => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / 4294967296; // 2^32
};

/**
 * Reset de generator (voor een nieuwe sessie).
 */
export function resetGenerator() {
  usedFirstNames = new Set();
  usedLastNames = new Set();
  usedCounters = {};
  placeholderCounters = {};
}

/**
 * Registreert eerder gebruikte vervangers (bijv. uit een ingeladen sleutelbestand)
 * zodat deze niet opnieuw als "nieuwe" pseudoniemen worden uitgedeeld.
 */
export function registerUsedReplacements(mappings) {
  if (!mappings || !Array.isArray(mappings)) return;
  
  for (const mapping of mappings) {
    if (mapping.replacement && mapping.category === 'naam') {
      const words = mapping.replacement.split(/\s+/);
      const significantWords = words.filter(w => /^[A-Z\u00C0-\u00FF]/.test(w));
      
      if (significantWords.length >= 2) {
        usedFirstNames.add(significantWords[0]);
        usedLastNames.add(significantWords[significantWords.length - 1]);
      } else if (significantWords.length === 1) {
        usedFirstNames.add(significantWords[0]);
        usedLastNames.add(significantWords[0]);
      }
    }
  }
}

/**
 * Pak een willekeurig element uit een lijst dat nog niet is gebruikt.
 */
function pickUnique(list, usedSet) {
  const available = list.filter(item => !usedSet.has(item));
  if (available.length === 0) {
    // Alles is op — voeg een nummer toe
    const counter = (usedCounters['overflow'] || 0) + 1;
    usedCounters['overflow'] = counter;
    return list[Math.floor(secureRandom() * list.length)] + counter;
  }
  const picked = available[Math.floor(secureRandom() * available.length)];
  usedSet.add(picked);
  return picked;
}

/**
 * Genereert een willekeurig getal met exact N cijfers.
 */
function randomDigits(n) {
  let result = '';
  for (let i = 0; i < n; i++) {
    result += Math.floor(secureRandom() * 10).toString();
  }
  // Eerste cijfer mag niet 0 zijn (tenzij n==1)
  if (n > 1 && result[0] === '0') {
    result = (Math.floor(secureRandom() * 9) + 1).toString() + result.slice(1);
  }
  return result;
}

/**
 * Genereert een fictieve vervanging op basis van de categorie en originele waarde.
 */
export function generateReplacement(original, category) {
  switch (category) {
    case 'naam': {
      // Tel het aantal woorden (exclusief tussenvoegsels)
      const words = original.split(/\s+/);
      const significantWords = words.filter(w => /^[A-Z\u00C0-\u00FF]/.test(w));
      
      if (significantWords.length >= 2) {
        // Voornaam + Achternaam (behoud eventuele tussenvoegsels-structuur)
        const firstName = pickUnique(FAKE_FIRST_NAMES, usedFirstNames);
        const lastName = pickUnique(FAKE_LAST_NAMES, usedLastNames);
        
        // Kijk of er tussenvoegsels zijn zoals "van", "de", "der"
        const tussenvoegsels = words.filter(w => /^[a-z]/.test(w));
        if (tussenvoegsels.length > 0) {
          return `${firstName} ${lastName}`;
        }
        return `${firstName} ${lastName}`;
      } else {
        // Enkel woord — waarschijnlijk voornaam of achternaam
        if (original.length <= 5 || FAKE_FIRST_NAMES.some(n => n.length === original.length)) {
          return pickUnique(FAKE_FIRST_NAMES, usedFirstNames);
        }
        return pickUnique(FAKE_LAST_NAMES, usedLastNames);
      }
    }

    case 'email': {
      const sepRegex = /@|\s*[\(\[\{]at[\)\]\}]\s*|\s+at\s+|\s+apestaartje\s+/i;
      const match = original.match(sepRegex);
      const separator = match ? match[0] : '@';
      const parts = original.split(sepRegex);
      const localLength = parts[0] ? parts[0].trim().length : 5;
      const fakeName = `gebruiker${randomDigits(Math.max(2, Math.min(localLength, 4)))}`;
      const domain = FAKE_DOMAINS[Math.floor(secureRandom() * FAKE_DOMAINS.length)];
      return `${fakeName}${separator}${domain}`;
    }

    case 'telefoon': {
      const digitsOnly = original.replace(/\D/g, '');
      let fakeDigits = '';
      
      // Kijk of we de "prefix" logisch kunnen behouden
      if (digitsOnly.startsWith('316')) {
         fakeDigits = '316' + randomDigits(Math.max(0, digitsOnly.length - 3));
      } else if (digitsOnly.startsWith('3106')) {
         fakeDigits = '3106' + randomDigits(Math.max(0, digitsOnly.length - 4));
      } else if (digitsOnly.startsWith('06')) {
         fakeDigits = '06' + randomDigits(Math.max(0, digitsOnly.length - 2));
      } else if (digitsOnly.startsWith('0031')) {
         fakeDigits = '0031' + randomDigits(Math.max(0, digitsOnly.length - 4));
      } else if (digitsOnly.startsWith('0')) {
         // willekeurig lokaal nummer (vast net), we houden de eerste 3 (of 4) digits afhankelijk van lengte
         const prefixLen = digitsOnly.length > 10 ? 4 : 3;
         fakeDigits = digitsOnly.substring(0, prefixLen) + randomDigits(Math.max(0, digitsOnly.length - prefixLen));
      } else {
         // Compleet ander/buitenlands format: houd de eerste (country) digit(s) en randomiseer rest
         fakeDigits = digitsOnly.substring(0, 2) + randomDigits(Math.max(0, digitsOnly.length - 2));
      }
      
      // Forceer dat fakeDigits exact dezelfde lengte heeft als digitsOnly (voor de zekerheid)
      fakeDigits = fakeDigits.slice(0, digitsOnly.length).padEnd(digitsOnly.length, String(Math.floor(secureRandom() * 10)));
      
      // Probeer het originele formaat te behouden (incl spaties, haakjes +, etc)
      let result = '';
      let digitIndex = 0;
      for (const ch of original) {
        if (/\d/.test(ch)) {
          result += fakeDigits[digitIndex++];
        } else {
          result += ch;
        }
      }
      return result;
    }

    case 'postcode': {
      const hasSpace = original.includes(' ');
      const isLower = /[a-z]/.test(original);
      const digits = randomDigits(4);
      let letters = String.fromCharCode(65 + Math.floor(secureRandom() * 26)) +
                    String.fromCharCode(65 + Math.floor(secureRandom() * 26));
      if (isLower) {
        letters = letters.toLowerCase();
      }
      return hasSpace ? `${digits} ${letters}` : `${digits}${letters}`;
    }

    case 'datum': {
      // Is het 8-digit formaat (YYYYMMDD of DDMMYYYY) met optionele tijdstempel?
      const eightDigitMatch = original.match(/^(\d{8})(?:_(\d{4}))?$/);
      if (eightDigitMatch) {
         const timePart = eightDigitMatch[2] ? `_${String(Math.floor(secureRandom() * 24)).padStart(2, '0')}${String(Math.floor(secureRandom() * 60)).padStart(2, '0')}` : '';
         const isYYYYFirst = /^(?:19|20)\d{2}/.test(eightDigitMatch[1]);
         const day = String(Math.floor(secureRandom() * 28) + 1).padStart(2, '0');
         const month = String(Math.floor(secureRandom() * 12) + 1).padStart(2, '0');
         const year = String(Math.floor(secureRandom() * 50) + 1970);
         const newDateBase = isYYYYFirst ? `${year}${month}${day}` : `${day}${month}${year}`;
         return `${newDateBase}${timePart}`;
      }
      
      // Is het apostrof jaar ('26 of ’26)
      if (/^['’]\d{2}$/.test(original)) {
        return `'${String(Math.floor(secureRandom() * 99)).padStart(2, '0')}`;
      }

      // Bevat het letters? (Tekstuele datums zoals "25 maart 2026", "mrt25")
      if (/[a-zA-Z]/.test(original)) {
         return original.replace(/\d+/g, (m) => {
           if (m.length === 4) return String(Math.floor(secureRandom() * 50) + 1970);
           return String(Math.floor(secureRandom() * 28) + 1).padStart(m.length, '0');
         });
      }

      // Anders: numeriek met scheidingstekens of spaties
      const timeMatchSplit = original.match(/(_\d{4})$/);
      const timeStr = timeMatchSplit ? `_${String(Math.floor(secureRandom() * 24)).padStart(2, '0')}${String(Math.floor(secureRandom() * 60)).padStart(2, '0')}` : '';
      const dateOnly = original.replace(/(_\d{4})$/, '');

      const separator = dateOnly.match(/[\-\/\.\u2013\u2014]/)?.[0];
      if (separator) {
        const parts = dateOnly.split(separator);
        const randD = String(Math.floor(secureRandom() * 28) + 1);
        const randM = String(Math.floor(secureRandom() * 12) + 1);
        const randY4 = String(Math.floor(secureRandom() * 50) + 1970);
        const randY2 = String(Math.floor(secureRandom() * 99)).padStart(2, '0');

        const newParts = parts.map((p, idx) => {
           if (p.length === 4) return randY4;
           if (parts.length === 3) {
             if (parts[0].length === 4) {
                return idx === 1 ? randM.padStart(p.length, '0') : randD.padStart(p.length, '0');
             }
             if (idx === 0) return randD.padStart(p.length, '0');
             if (idx === 1) return randM.padStart(p.length, '0');
             if (idx === 2) return randY2.padStart(p.length, '0');
           }
           if (parts.length === 2) {
             if (idx === 0) return randD.padStart(p.length, '0');
             if (idx === 1) return randM.padStart(p.length, '0');
           }
           return p;
        });
        return newParts.join(separator) + timeStr;
      }

      return original; // Fallback
    }

    case 'iban': {
      // NL + 2 check digits + 4 letter bankcode + 10 cijfers
      const bankCodes = ['ABNA', 'INGB', 'RABO', 'SNSB', 'TRIO', 'KNAB'];
      const bank = bankCodes[Math.floor(secureRandom() * bankCodes.length)];
      const hasSpaces = original.includes(' ');
      const raw = `NL${randomDigits(2)}${bank}${randomDigits(10)}`;
      if (hasSpaces) {
        return raw.replace(/(.{4})/g, '$1 ').trim();
      }
      return raw;
    }

    case 'bsn': {
      // Genereer 9 cijfers
      const fake = randomDigits(9);
      // Controleer origineel op formaten
      if (/^\d{4}[\s\-\/]\d{2}[\s\-\/]\d{3}$/.test(original)) {
        const sep = original.match(/[\s\-\/]/)[0];
        return `${fake.slice(0,4)}${sep}${fake.slice(4,6)}${sep}${fake.slice(6,9)}`;
      }
      if (/^\d{3}[\s\-\/]\d{3}[\s\-\/]\d{3}$/.test(original)) {
        const sep = original.match(/[\s\-\/]/)[0];
        return `${fake.slice(0,3)}${sep}${fake.slice(3,6)}${sep}${fake.slice(6,9)}`;
      }
      return fake;
    }

    case 'url': {
      let prefix = '';
      let cleanOriginal = original;
      
      const protocolMatch = original.match(/^([a-z]+:\/\/)/i);
      if (protocolMatch) {
         prefix = protocolMatch[1]; // e.g., 'sftp://', 'https://'
         cleanOriginal = cleanOriginal.substring(prefix.length);
      }
      
      let hasWww = cleanOriginal.toLowerCase().startsWith('www.');
      
      const domain = FAKE_DOMAINS[Math.floor(secureRandom() * FAKE_DOMAINS.length)];
      
      // Pad eruit vissen
      let path = '';
      const slashIndex = cleanOriginal.indexOf('/');
      if (slashIndex !== -1) {
        path = cleanOriginal.substring(slashIndex);
      }
      
      let newDomain = domain;
      if (hasWww && !newDomain.startsWith('www.')) newDomain = 'www.' + newDomain;
      
      return `${prefix}${newDomain}${path}`;
    }

    case 'nummer': {
      return randomDigits(original.length);
    }

    case 'plaats': {
      return pickUnique(FAKE_CITIES, new Set()); // We hoeven steden niet per se uniek te houden over de hele tekst, maar kan wel
    }

    case 'adres': {
      const match = original.match(/^(.*?)(\s+\d+.*)$/);
      let street = original;
      let numberPart = '';
      if (match) {
        street = match[1];
        numberPart = match[2];
      }
      
      const FAKE_PREFIXES = ['Kerk', 'Molen', 'Dorps', 'School', 'Spoor', 'Kastanje', 'Eiken', 'Beuken', 'Zonne', 'Beatrix', 'Wilhelmina', 'Juliana', 'Prins', 'Stations', 'Nieuwe', 'Oude'];
      const FAKE_SUFFIXES = ['straat', 'weg', 'laan', 'dijk', 'plein', 'hof', 'singel'];
      const MULTI_WORDS = ['Grote Markt', 'Brink', 'Oude Haven', 'Dorpsplein', 'Lange Weg', 'Nieuwe Gracht'];
      
      const isMultiWord = street.includes(' ');
      let newStreet = '';
      if (isMultiWord) {
         newStreet = MULTI_WORDS[Math.floor(secureRandom() * MULTI_WORDS.length)];
      } else {
         newStreet = FAKE_PREFIXES[Math.floor(secureRandom() * FAKE_PREFIXES.length)] + 
                     FAKE_SUFFIXES[Math.floor(secureRandom() * FAKE_SUFFIXES.length)];
      }
      
      let newNumberPart = '';
      if (numberPart) {
         newNumberPart = numberPart.replace(/\d+/g, (n) => {
           return String(Math.floor(secureRandom() * 200) + 1);
         });
      } else {
         newNumberPart = ' ' + String(Math.floor(secureRandom() * 200) + 1);
      }
      
      return `${newStreet}${newNumberPart}`;
    }

    default:
      return `[ANONIEM_${(usedCounters['default'] = (usedCounters['default'] || 0) + 1)}]`;
  }
}
