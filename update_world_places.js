import fs from 'fs';
const file = 'C:/Users/Dennis/Documents/Vibecoden/AntiGravity/Tekst Anonimiseerder/src/utils/dictionaries/places.js';
let content = fs.readFileSync(file, 'utf8');

const newCountries = [
  'afghanistan', 'albanië', 'algerije', 'andorra', 'angola', 'antigua en barbuda', 'argentinië', 'armenië', 'australië', 
  'azerbeidzjan', 'bahama\'s', 'bahrein', 'bangladesh', 'barbados', 'belgië', 'belize', 'benin', 'bhutan', 'bolivia', 
  'bosnië en herzegovina', 'botswana', 'brazilië', 'brunei', 'bulgarije', 'burkina faso', 'burundi', 'cambodja', 'canada', 
  'centraal-afrikaanse republiek', 'chili', 'china', 'colombia', 'comoren', 'congo-brazzaville', 'congo-kinshasa', 
  'costa rica', 'cuba', 'cyprus', 'denemarken', 'djibouti', 'dominica', 'dominicaanse republiek', 'duitsland', 'ecuador', 
  'egypte', 'el salvador', 'equatoriaal-guinea', 'eritrea', 'estland', 'eswatini', 'ethiopië', 'fiji', 'filipijnen', 
  'finland', 'frankrijk', 'gabon', 'gambia', 'georgië', 'ghana', 'grenada', 'griekenland', 'guatemala', 'guinee', 
  'guinee-bissau', 'guyana', 'haïti', 'honduras', 'hongarije', 'ierland', 'ijsland', 'india', 'indonesië', 'irak', 'iran', 
  'israël', 'italië', 'ivoorkust', 'jamaica', 'japan', 'jemen', 'jordanië', 'kaapverdië', 'kameroen', 'kazachstan', 
  'kenia', 'kirgizië', 'kiribati', 'koeweit', 'kosovo', 'kroatië', 'laos', 'lesotho', 'letland', 'libanon', 'liberia', 
  'libië', 'liechtenstein', 'litouwen', 'luxemburg', 'madagaskar', 'malawi', 'maldiven', 'maleisië', 'mali', 'malta', 
  'marokko', 'marshalleilanden', 'mauritanië', 'mauritius', 'mexico', 'micronesië', 'moldavië', 'monaco', 'mongolië', 
  'montenegro', 'mozambique', 'myanmar', 'namibië', 'nauru', 'nederland', 'nepal', 'nicaragua', 'nieuw-zeeland', 'niger', 
  'nigeria', 'noord-korea', 'noord-macedonië', 'noorwegen', 'oeganda', 'oekraïne', 'oezbekistan', 'oman', 'oostenrijk', 
  'oost-timor', 'pakistan', 'palau', 'palestina', 'panama', 'papoea-nieuw-guinea', 'paraguay', 'peru', 'polen', 'portugal', 
  'qatar', 'roemenië', 'rusland', 'rwanda', 'saint kitts en nevis', 'saint lucia', 'saint vincent en de grenadines', 
  'salomonseilanden', 'samoa', 'san marino', 'sao tomé en principe', 'saoedi-arabië', 'senegal', 'servië', 'seychellen', 
  'sierra leone', 'singapore', 'slovenië', 'slowakije', 'soedan', 'somalië', 'spanje', 'sri lanka', 'suriname', 'syrië', 
  'tadzjikistan', 'tanzania', 'thailand', 'togo', 'tonga', 'trinidad en tobago', 'tsjaad', 'tsjechië', 'tunesië', 'turkije', 
  'turkmenistan', 'tuvalu', 'uruguay', 'vanuatu', 'vaticaanstad', 'venezuela', 'verenigde arabische emiraten', 'verenigde staten', 
  'verenigd koninkrijk', 'vietnam', 'wit-rusland', 'zambia', 'zimbabwe', 'zuid-afrika', 'zuid-korea', 'zuid-soedan', 
  'zweden', 'zwitserland', 'engeland', 'schotland', 'wales', 'amerika', 'kroatië', 'bosnië', 'slovenie', 'indonesië'
];

const newCapitals = [
  'kaboel', 'tirana', 'algiers', 'andorra la vella', 'luanda', 'saint john\'s', 'buenos aires', 'jerevan', 'canberra', 
  'bakoe', 'nassau', 'manamah', 'dhaka', 'bridgetown', 'brussel', 'belmopan', 'porto-novo', 'thimphu', 'sucre', 
  'sarajevo', 'gaborone', 'brasilia', 'bandar seri begawan', 'sofia', 'ouagadougou', 'gitega', 'phnom penh', 'ottawa', 
  'bangui', 'santiago', 'peking', 'bogota', 'moroni', 'brazzaville', 'kinshasa', 'san josé', 'havana', 'nicosia', 
  'kopenhagen', 'djibouti', 'roseau', 'santo domingo', 'berlijn', 'quito', 'caïro', 'san salvador', 'malabo', 'asmara', 
  'tallinn', 'mbabane', 'addis abeba', 'suva', 'manilla', 'helsinki', 'parijs', 'libreville', 'banjul', 'tbilisi', 
  'accra', 'saint george\'s', 'athene', 'guatemala-stad', 'conakry', 'bissau', 'georgetown', 'port-au-prince', 
  'tegucigalpa', 'boedapest', 'dublin', 'reykjavik', 'new delhi', 'jakarta', 'bagdad', 'teheran', 'jeruzalem', 'rome', 
  'yamoussoukro', 'kingston', 'tokio', 'sanaa', 'amman', 'praia', 'yaoundé', 'astana', 'nairobi', 'bisjkek', 'tarawa', 
  'koeweit', 'pristina', 'zagreb', 'vientiane', 'maseru', 'riga', 'beiroet', 'monrovia', 'tripoli', 'vaduz', 'vilnius', 
  'luxemburg', 'antananarivo', 'lilongwe', 'malé', 'kuala lumpur', 'bamako', 'valletta', 'rabat', 'majuro', 'nouakchott', 
  'port louis', 'mexico-stad', 'palikir', 'chisinau', 'monaco', 'ulaanbaatar', 'podgorica', 'maputo', 'naypyidaw', 
  'windhoek', 'yaren', 'amsterdam', 'kathmandu', 'managua', 'wellington', 'niamey', 'abuja', 'pyongyang', 'skopje', 
  'oslo', 'kampala', 'kiev', 'tasjkent', 'masqat', 'wenen', 'dili', 'islamabad', 'ngerulmud', 'oost-jeruzalem', 
  'panama-stad', 'port moresby', 'asuncion', 'lima', 'warschau', 'lissabon', 'doha', 'boekarest', 'moskou', 'kigali', 
  'basseterre', 'castries', 'kingstown', 'honiara', 'apia', 'san marino', 'sao tomé', 'riyad', 'dakar', 'belgrado', 
  'victoria', 'freetown', 'singapore', 'ljubljana', 'bratislava', 'khartoem', 'mogadishu', 'madrid', 'sri jayewardenepura kotte', 
  'paramaribo', 'damascus', 'doesjanbe', 'dodoma', 'bangkok', 'lomé', 'nuku\'alofa', 'port of spain', 'ndjamena', 
  'praag', 'tunis', 'ankara', 'asjchabad', 'funafuti', 'montevideo', 'port vila', 'vaticaanstad', 'caracas', 'abu dhabi', 
  'washington d.c.', 'londen', 'hanoi', 'minsk', 'lusaka', 'harare', 'pretoria', 'seoel', 'juba', 'stockholm', 'bern'
];

const cMatch = content.match(/export const COUNTRIES = new Set\(\[\s*([\s\S]*?)\s*\]\);/);
if (cMatch) {
  let cc = cMatch[1].replace(/['\n\r]/g, '').split(',').map(n => n.trim()).filter(n => n);
  let allC = Array.from(new Set([...cc, ...newCountries])).sort();
  const rows = [];
  for (let i = 0; i < allC.length; i+=8) {
     rows.push('  ' + allC.slice(i, i+8).map(n => `'${n.replace(/'/g, "\\'")}'`).join(', '));
  }
  const nBlock = `export const COUNTRIES = new Set([\n${rows.join(',\n')}\n]);`;
  content = content.replace(/export const COUNTRIES = new Set\(\[\s*[\s\S]*?\s*\]\);/, nBlock);
}

const wMatch = content.match(/export const WORLD_CITIES = new Set\(\[\s*([\s\S]*?)\s*\]\);/);
if (wMatch) {
  let wc = wMatch[1].replace(/['\n\r]/g, '').split(',').map(n => n.trim()).filter(n => n);
  let allW = Array.from(new Set([...wc, ...newCapitals])).sort();
  const rows = [];
  for (let i = 0; i < allW.length; i+=8) {
     rows.push('  ' + allW.slice(i, i+8).map(n => `'${n.replace(/'/g, "\\'")}'`).join(', '));
  }
  const nBlock = `export const WORLD_CITIES = new Set([\n${rows.join(',\n')}\n]);`;
  content = content.replace(/export const WORLD_CITIES = new Set\(\[\s*[\s\S]*?\s*\]\);/, nBlock);
}

fs.writeFileSync(file, content);
console.log('Update finished.');
