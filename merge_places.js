import fs from 'fs';
const placesJsPath = 'C:/Users/Dennis/Documents/Vibecoden/AntiGravity/Tekst Anonimiseerder/src/utils/dictionaries/places.js';
let content = fs.readFileSync(placesJsPath, 'utf8');
const scrapedPlaces = JSON.parse(fs.readFileSync('scraped_places.json', 'utf8'));
const lowerScraped = scrapedPlaces.map(p => p.toLowerCase());

const currentMatch = content.match(/export const DUTCH_PLACES = new Set\(\[\s*([\s\S]*?)\s*\]\);/);
if (currentMatch) {
  let currentPlaces = currentMatch[1].replace(/['\n\r]/g, '').split(',').map(p => p.trim()).filter(p => p);
  let allPlaces = Array.from(new Set([...currentPlaces, ...lowerScraped])).sort();
  
  const rows = [];
  for (let i = 0; i < allPlaces.length; i+=8) {
     rows.push('  ' + allPlaces.slice(i, i+8).map(p => `'${p.replace(/'/g, "\\'")}'`).join(', '));
  }
  
  const newSetBlock = `export const DUTCH_PLACES = new Set([\n${rows.join(',\n')}\n]);`;
  content = content.replace(/export const DUTCH_PLACES = new Set\(\[\s*[\s\S]*?\s*\]\);/, newSetBlock);
  fs.writeFileSync(placesJsPath, content);
  console.log('Merged successfully. Total Dutch places: ' + allPlaces.length);
}
