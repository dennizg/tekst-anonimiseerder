import fs from 'fs';

async function scrapePlaces() {
  const url = 'https://nl.wikipedia.org/wiki/Lijst_van_Nederlandse_plaatsen';
  console.log('Fetching', url);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AntiGravityBot/1.0 (test@vibecoden.nl)'
    }
  });
  
  if (!res.ok) {
    console.log('HTTP Error:', res.status);
    return;
  }
  
  const text = await res.text();
  
  let places = new Set();
  
  // Format is: <a rel="mw:WikiLink" href="//nl.wikipedia.org/wiki/Aadorp" title="Aadorp" id="mwDQ">Aadorp</a> -
  const regex = /<a rel="mw:WikiLink" href="\/\/nl\.wikipedia\.org\/wiki\/[^"]+" title="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
      let title = match[1];
      let display = match[2];
      
      // We take the title because it's usually the full correct name, without HTML formatting
      let place = title.split(' (')[0].trim();
      
      if (place.length > 2 && !place.includes(':') && !place.includes('Lijst')) {
        places.add(place);
      }
  }
  
  const arr = Array.from(places).sort();
  console.log(`Found ${arr.length} places.`);
  fs.writeFileSync('C:/Users/Dennis/Documents/Vibecoden/AntiGravity/Tekst Anonimiseerder/scraped_places.json', JSON.stringify(arr, null, 2));
}

scrapePlaces().catch(console.error);
