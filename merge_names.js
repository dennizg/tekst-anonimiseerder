import fs from 'fs';
const namesJsPath = 'C:/Users/Dennis/Documents/Vibecoden/AntiGravity/Tekst Anonimiseerder/src/utils/dictionaries/names.js';
let content = fs.readFileSync(namesJsPath, 'utf8');
const scrapedNames = JSON.parse(fs.readFileSync('scraped_names.json', 'utf8'));
const lowerScraped = scrapedNames.map(n => n.toLowerCase());

const currentMatch = content.match(/export const DUTCH_FIRST_NAMES = new Set\(\[\s*([\s\S]*?)\s*\]\);/);
if (currentMatch) {
  let currentNames = currentMatch[1].replace(/['\n\r]/g, '').split(',').map(n => n.trim()).filter(n => n);
  let allNames = Array.from(new Set([...currentNames, ...lowerScraped])).sort();
  
  const rows = [];
  for (let i = 0; i < allNames.length; i+=8) {
     rows.push('  ' + allNames.slice(i, i+8).map(n => `'${n}'`).join(', '));
  }
  
  const newSetBlock = `export const DUTCH_FIRST_NAMES = new Set([\n${rows.join(',\n')}\n]);`;
  content = content.replace(/export const DUTCH_FIRST_NAMES = new Set\(\[\s*[\s\S]*?\s*\]\);/, newSetBlock);
  fs.writeFileSync(namesJsPath, content);
  console.log('Merged successfully. Total names: ' + allNames.length);
}
