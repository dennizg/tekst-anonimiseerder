import fs from 'fs';

const detectorJsPath = 'C:/Users/Dennis/Documents/Vibecoden/AntiGravity/Tekst Anonimiseerder/src/utils/detector.js';
const namesJsPath = 'C:/Users/Dennis/Documents/Vibecoden/AntiGravity/Tekst Anonimiseerder/src/utils/dictionaries/names.js';
const placesJsPath = 'C:/Users/Dennis/Documents/Vibecoden/AntiGravity/Tekst Anonimiseerder/src/utils/dictionaries/places.js';

let detectorContent = fs.readFileSync(detectorJsPath, 'utf8');

// Extract COMMON_WORDS from detector.js
const match = detectorContent.match(/const COMMON_WORDS = new Set\(\[\s*([\s\S]*?)\s*\]\);/);
let commonWords = new Set();
if (match) {
    const raw = match[1].replace(/['\n\r]/g, '').split(',').map(s => s.trim()).filter(s => s);
    commonWords = new Set(raw);
}

// Add extra common words (verbs, possessive pronouns, adverbs, objects)
const extraWords = [
    "mijn", "zijn", "onze", "jullie", "uw", "hun", 
    "ben", "bent", "is", "was", "waren", "werd", "werden", "zal", "zullen", 
    "kan", "kunnen", "mag", "mogen", "heb", "hebt", "heeft", "hadden", 
    "wil", "wilt", "willen", "moet", "moeten", "echt", "al", "ad", "dik", 
    "job", "door", "ton", "peer", "goed", "fout", "waar", "onwaar", "meis",
    "mens", "boy", "lente", "roos" // let's leave Roos out actually, Roos is very common as name
];

extraWords.forEach(w => {
    if (w !== 'roos') commonWords.add(w);
});

// Zorg er ook voor dat deze extra woorden worden toegevoegd aan detector.js, zodat de engine ze blijft uitsluiten
const newCommonWordsArray = Array.from(commonWords).sort();
const rowsCommon = [];
for (let i = 0; i < newCommonWordsArray.length; i+=8) {
   rowsCommon.push('  ' + newCommonWordsArray.slice(i, i+8).map(n => `'${n}'`).join(', '));
}
const newCommonBlock = `const COMMON_WORDS = new Set([\n${rowsCommon.join(',\n')}\n]);`;
detectorContent = detectorContent.replace(/const COMMON_WORDS = new Set\(\[\s*[\s\S]*?\s*\]\);/, newCommonBlock);
fs.writeFileSync(detectorJsPath, detectorContent);


function filterFile(filePath, isName) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Vervang alle sets in de file
    const setRegex = /export const [A-Z_]+ = new Set\(\[\s*([\s\S]*?)\s*\]\);/g;
    
    content = content.replace(setRegex, (fullMatch, body) => {
        let items = body.replace(/['\n\r]/g, '').split(',').map(s => s.trim()).filter(s => s);
        
        let filtered = items.filter(val => !commonWords.has(val.toLowerCase()));
        
        // Add Mijntje if we are in names and removed Mijn
        if (isName && items.map(v => v.toLowerCase()).includes('mijn')) {
             if (!filtered.map(v => v.toLowerCase()).includes('mijntje')) {
                 filtered.push('mijntje');
             }
        }
        
        filtered.sort();
        
        const rows = [];
        for (let i = 0; i < filtered.length; i+=8) {
           rows.push('  ' + filtered.slice(i, i+8).map(n => `'${n.replace(/'/g, "\\'")}'`).join(', '));
        }
        
        const header = fullMatch.split('new Set([')[0] + 'new Set([\n';
        return header + rows.join(',\n') + '\n]);';
    });
    
    fs.writeFileSync(filePath, content);
}

filterFile(namesJsPath, true);
filterFile(placesJsPath, false);

console.log('Filtering completed!');
