// Rebuilds public/sheets/bengaluru-jobs.csv (pulled into the public Google Sheet via IMPORTDATA).
// 1) supabase db query --linked "select id, company_name, title, experience, coalesce(posted_at, created_at::date) added from jobs where location ilike any(array['%bangalore%','%bengaluru%']) and coalesce(status,'') not in ('closed','expired','inactive');" > /tmp/blr.json
// 2) node scripts/build-bengaluru-sheet.mjs /tmp/blr.json public/sheets/bengaluru-jobs.csv, then push.
import fs from 'fs';
const [, , src, out] = process.argv;
const raw = fs.readFileSync(src, 'utf8');
const rows = JSON.parse(raw.slice(raw.indexOf('{'))).rows;
const D = [
  ['Data & AI', /\b(data|machine learning|ml|ai|genai|llm|analytics|analyst|scientist|nlp|computer vision|deep learning|bi\b|business intelligence|mlops)\b/i],
  ['Cloud, DevOps & security', /\b(devops|sre|site reliability|cloud|platform engineer|infrastructure|kubernetes|security|cyber|network|sysadmin|system administrator|devsecops|soc\b)\b/i],
  ['Product & project management', /\b(product manage(r|ment)|product owner|program(me)? manage(r|ment)|project manage(r|ment)|project\/ ?program|scrum|delivery manager|pmo|product lead|head of product|technical program)\b/i],
  ['Design', /\b(designer|design lead|ux|ui\/ux|user experience|user research|visual design|creative)\b/i],
  ['Hardware & core engineering', /\b(hardware|embedded|firmware|vlsi|asic|fpga|rtl|silicon|analog|electrical|mechanical|electronics|pcb|chip|soc design|validation engineer|verification engineer|automotive|manufacturing|process engineer|quality engineer|reliability engineer)\b/i],
  ['Software engineering', /\b(software|developer|engineer|engineering|sde|full[- ]?stack|frontend|front[- ]end|backend|back[- ]end|android|ios|mobile|java|python|react|node|golang|qa\b|test|automation|architect|programmer|salesforce developer|sap)\b/i],
  ['Finance & accounting', /\b(finance|financial|accountant|accounting|accounts|tax|audit|controller|fp&a|treasury|payroll|billing|cfo|auditor|company secretary|actuar(y|ial))\b/i],
  ['Risk & compliance', /\b(risk|compliance|regulatory|aml|kyc|fraud|governance|legal|counsel|lawyer|paralegal)\b/i],
  ['Sales & marketing', /\b(sales|account executive|business development|bdr|sdr|marketing|growth|brand|seo|content|social media|communications|pr\b|partnerships|account manager|demand gen|copywriter)\b/i],
  ['HR & talent', /\b(hr|human resources|recruiter|recruiting|talent|people partner|people operations|hrbp|learning & development|l&d)\b/i],
  ['Consulting', /\b(consultant|consulting|advisory|strategy)\b/i],
  ['Internships & freshers', /\b(intern|internship|fresher|freshers|trainee|graduate|walk-?in)\b/i],
  ['Customer success & operations', /\b(customer|support|success|operations|ops\b|service|procurement|supply chain|logistics|admin|executive assistant|office|facilities|vendor)\b/i],
];
const LV = { 'Internship': ['Internship', 0], 'Entry Level': ['Entry level', 1], 'Middle Level': ['Mid level', 2], 'Mid Level': ['Mid level', 2], 'Senior Level': ['Senior', 3], 'Lead': ['Lead', 4], 'Principal': ['Principal', 5], 'Director': ['Director', 6], 'VP': ['VP', 7], 'C-Level': ['C-level', 8] };
const seen = new Set(); const jobs = [];
for (const r of rows) {
  const title = String(r.title || '').replace(/\s+/g, ' ').trim(), co = String(r.company_name || '').trim();
  if (!title || !co || !r.id || /\[test\]|\btest req\b/i.test(title)) continue;
  const k = (co + '|' + title).toLowerCase(); if (seen.has(k)) continue; seen.add(k);
  const domain = (D.find(([, re]) => re.test(title)) || ['Other roles'])[0];
  const [lvl, rank] = LV[r.experience] || ['Not specified', 9];
  jobs.push({ co, title, domain, lvl, rank, id: r.id, added: r.added });
}
const fmt = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const groups = {}; jobs.forEach(j => (groups[j.domain] ||= []).push(j));
const order = Object.keys(groups).sort((a, b) => a === 'Other roles' ? 1 : b === 'Other roles' ? -1 : a === 'Software engineering' ? -1 : b === 'Software engineering' ? 1 : groups[b].length - groups[a].length);
const q = s => /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
const lines = [];
for (const d of order) {
  const g = groups[d].sort((a, b) => a.rank - b.rank || String(b.added).localeCompare(String(a.added)) || a.co.localeCompare(b.co));
  lines.push([`${d}  ·  ${g.length} roles`, '', '', '', '', ''].join(','));
  for (const j of g) lines.push([j.co, j.title, d, j.lvl, `https://irisjobs.live/job/${encodeURIComponent(j.id)}?utm_campaign=bengaluru-sheet`, j.added ? fmt(j.added) : ''].map(q).join(','));
}
fs.writeFileSync(out, lines.join('\n') + '\n');
const cos = new Set(jobs.map(j => j.co)).size;
console.log(JSON.stringify({ roles: jobs.length, companies: cos, domains: order.map(d => `${d}: ${groups[d].length}`) }, null, 1));
console.log('sample:', groups['Other roles']?.slice(0, 15).map(j => j.title).join(' | '));
