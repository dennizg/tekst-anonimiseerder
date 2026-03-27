import fs from 'fs';

async function scrape() {
  let names = new Set();
  let emptyPages = 0;
  
  // Maximaal 100 pagina's om infinite loops te voorkomen
  for (let i = 1; i <= 100; i++) {
    const url = i === 1 ? 'https://www.babybytes.nl/namen/Nederlandse-namen' : `https://www.babybytes.nl/namen/Nederlandse-namen&page=${i}`;
    console.log('Fetching', url);
    const res = await fetch(url);
    const text = await res.text();
    
    let foundOnPage = 0;
    const regex = /\/namen\/(?:jongens|meisjes|gemengde)\/([A-Za-z\u00C0-\u00FF]+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1] && match[1].length > 1) {
        names.add(match[1]);
        foundOnPage++;
      }
    }
    
    console.log(`Page ${i} yielded ${foundOnPage} names.`);
    if (foundOnPage === 0) {
      emptyPages++;
      if (emptyPages >= 2) {
        console.log('Stop scraper: 2 lege pagina\'s op rij bereikt.');
        break;
      }
    } else {
      emptyPages = 0;
    }
  }
  
  const arr = Array.from(names).sort();
  console.log(`Total unique names collected: ${arr.length}`);
  fs.writeFileSync('C:/Users/Dennis/Documents/Vibecoden/AntiGravity/Tekst Anonimiseerder/scraped_names.json', JSON.stringify(arr, null, 2));
}

scrape().catch(console.error);
