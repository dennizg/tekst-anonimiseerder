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

/**
 * Reset de generator (voor een nieuwe sessie).
 */
export function resetGenerator() {
  usedFirstNames = new Set();
  usedLastNames = new Set();
  usedCounters = {};
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
    return list[Math.floor(Math.random() * list.length)] + counter;
  }
  const picked = available[Math.floor(Math.random() * available.length)];
  usedSet.add(picked);
  return picked;
}

/**
 * Genereert een willekeurig getal met exact N cijfers.
 */
function randomDigits(n) {
  let result = '';
  for (let i = 0; i < n; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  // Eerste cijfer mag niet 0 zijn (tenzij n==1)
  if (n > 1 && result[0] === '0') {
    result = (Math.floor(Math.random() * 9) + 1).toString() + result.slice(1);
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
      const parts = original.split('@');
      const localLength = parts[0].length;
      const fakeName = `gebruiker${randomDigits(Math.max(2, Math.min(localLength, 4)))}`;
      const domain = FAKE_DOMAINS[Math.floor(Math.random() * FAKE_DOMAINS.length)];
      return `${fakeName}@${domain}`;
    }

    case 'telefoon': {
      // Behoud het formaat (met of zonder streepjes, spaties, etc.)
      const digitsOnly = original.replace(/\D/g, '');
      let fakeDigits;
      if (digitsOnly.startsWith('31')) {
        fakeDigits = '31' + '6' + randomDigits(8);
      } else if (digitsOnly.startsWith('06')) {
        fakeDigits = '06' + randomDigits(8);
      } else {
        fakeDigits = randomDigits(digitsOnly.length);
      }
      
      // Probeer het originele formaat te behouden
      let result = '';
      let digitIndex = 0;
      for (const ch of original) {
        if (/\d/.test(ch)) {
          result += digitIndex < fakeDigits.length ? fakeDigits[digitIndex++] : '0';
        } else {
          result += ch;
        }
      }
      return result;
    }

    case 'postcode': {
      const hasSpace = original.includes(' ');
      const digits = randomDigits(4);
      const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                      String.fromCharCode(65 + Math.floor(Math.random() * 26));
      return hasSpace ? `${digits} ${letters}` : `${digits}${letters}`;
    }

    case 'datum': {
      // Behoud het formaat maar verander de waarden
      const separator = original.match(/[\-\/\.]/)?.[0] || '-';
      const parts = original.split(/[\-\/\.]/);
      if (parts.length === 3) {
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(parts[0].length, '0');
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(parts[1].length, '0');
        const yearLen = parts[2].length;
        const year = yearLen === 4
          ? String(Math.floor(Math.random() * 50) + 1970)
          : String(Math.floor(Math.random() * 99)).padStart(2, '0');
        return `${day}${separator}${month}${separator}${year}`;
      }
      return original; // Kon niet parseren, teruggeven
    }

    case 'iban': {
      // NL + 2 check digits + 4 letter bankcode + 10 cijfers
      const bankCodes = ['ABNA', 'INGB', 'RABO', 'SNSB', 'TRIO', 'KNAB'];
      const bank = bankCodes[Math.floor(Math.random() * bankCodes.length)];
      const hasSpaces = original.includes(' ');
      const raw = `NL${randomDigits(2)}${bank}${randomDigits(10)}`;
      if (hasSpaces) {
        return raw.replace(/(.{4})/g, '$1 ').trim();
      }
      return raw;
    }

    case 'bsn': {
      return randomDigits(9);
    }

    case 'url': {
      const domain = FAKE_DOMAINS[Math.floor(Math.random() * FAKE_DOMAINS.length)];
      // Behoud pad-structuur
      try {
        const url = new URL(original);
        return `${url.protocol}//${domain}${url.pathname}`;
      } catch {
        return `https://${domain}/pagina`;
      }
    }

    case 'nummer': {
      return randomDigits(original.length);
    }

    case 'plaats': {
      return pickUnique(FAKE_CITIES, new Set()); // We hoeven steden niet per se uniek te houden over de hele tekst, maar kan wel
    }

    default:
      return `[ANONIEM_${(usedCounters['default'] = (usedCounters['default'] || 0) + 1)}]`;
  }
}
