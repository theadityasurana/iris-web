// Builds one CSV per US city for the public "USA jobs" Google Sheet (one tab per city, IMPORTDATA).
// 1) supabase db query --linked "<query in US_QUERY below>" > /tmp/us.json
// 2) node scripts/build-us-sheets.mjs /tmp/us.json public/sheets/us   (then push)
import fs from 'fs';
import { buildCsv } from './build-bengaluru-sheet.mjs';

const PART_LINES = 6000;

export const US_TABS = [
  ['New York', 'new-york', ['new york', 'brooklyn', 'manhattan', 'new york city', 'nyc']],
  ['San Francisco', 'san-francisco', ['san francisco', 'south san francisco']],
  ['Bay Area', 'bay-area', ['palo alto', 'san jose', 'mountain view', 'sunnyvale', 'santa clara', 'menlo park', 'cupertino', 'redwood city', 'pleasanton', 'oakland', 'fremont', 'san mateo', 'berkeley', 'milpitas', 'foster city', 'san carlos', 'emeryville', 'burlingame', 'los gatos', 'san ramon']],
  ['Los Angeles', 'los-angeles', ['los angeles', 'hawthorne', 'torrance', 'santa monica', 'culver city', 'el segundo', 'pasadena', 'burbank', 'long beach', 'glendale', 'playa vista', 'irvine']],
  ['Seattle', 'seattle', ['seattle', 'bellevue', 'redmond', 'kirkland']],
  ['Austin', 'austin', ['austin']],
  ['Boston', 'boston', ['boston', 'cambridge', 'somerville', 'waltham']],
  ['Chicago', 'chicago', ['chicago']],
  ['Washington DC', 'washington-dc', ['washington dc', 'washington d.c.', 'arlington', 'reston', 'mclean', 'herndon', 'bethesda', 'alexandria']],
  ['Dallas', 'dallas', ['dallas', 'fort worth', 'plano', 'irving', 'frisco']],
  ['Denver', 'denver', ['denver', 'boulder']],
  ['Atlanta', 'atlanta', ['atlanta']],
];
export const US_QUERY = `select id, company_name, title, experience, coalesce(posted_at, created_at::date) added, loc_cities from jobs where loc_countries @> array['United States'] and loc_cities && array[${US_TABS.flatMap(t => t[2]).map(c => `'${c}'`).join(',')}] and coalesce(status,'') not in ('closed','expired','inactive')`;

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , src, outDir] = process.argv;
  if (!src) { console.log(US_QUERY); process.exit(0); }
  const raw = fs.readFileSync(src, 'utf8');
  const rows = JSON.parse(raw.slice(raw.indexOf('{'))).rows;
  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, slug, cities] of US_TABS) {
    const set = new Set(cities);
    const mine = rows.filter(r => (r.loc_cities || []).some(c => set.has(String(c).toLowerCase())));
    const { csv, jobs } = buildCsv(mine, `usa-sheet-${slug}`);
    // Google Sheets' IMPORTDATA rejects files over ~2 MB, so big cities are split into parts
    // of PART_LINES rows; the tab stacks them back together with {IMPORTDATA(1);IMPORTDATA(2)}.
    const lines = csv.trimEnd().split('\n');
    for (const f of fs.readdirSync(outDir)) if (f === `${slug}.csv` || f.startsWith(`${slug}-part`)) fs.unlinkSync(`${outDir}/${f}`);
    const parts = [];
    for (let i = 0; i < lines.length; i += PART_LINES) parts.push(lines.slice(i, i + PART_LINES).join('\n') + '\n');
    const files = parts.length === 1 ? [`${slug}.csv`] : parts.map((_, i) => `${slug}-part${i + 1}.csv`);
    files.forEach((f, i) => fs.writeFileSync(`${outDir}/${f}`, parts[i]));
    console.log(`${name}: ${jobs.length} roles, ${new Set(jobs.map(j => j.co)).size} companies → ${files.join(' + ')} (${parts.map(p => (p.length / 1e6).toFixed(2) + ' MB').join(', ')})`);
  }
}
