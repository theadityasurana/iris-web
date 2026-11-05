/** Draws a job's share image as SVG, with text already turned into shapes. Quick enough for free-tier limits. */
import { BG, LOGO, SANS, SERIF } from './og-assets.js';

const clean = v => String(v ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const widthOf = (font, text, size, track = 0) => {
  let w = 0;
  for (const ch of text) w += ((font.g[ch] ?? font.g[' '])[0] / font.upm) * size + track;
  return w;
};

/** One line of text as one path, with its left edge at x and baseline at y. */
function line(font, text, x, y, size, fill, track = 0) {
  const k = size / font.upm;
  let cx = 0, out = '';
  for (const ch of text) {
    const g = font.g[ch];
    if (!g) continue;
    if (g[1]) out += `<path transform="translate(${(cx / k).toFixed(0)} 0)" d="${g[1]}"/>`;
    cx += g[0] * k + track;
  }
  return `<g fill="${fill}" transform="translate(${x.toFixed(1)} ${y}) scale(${k.toFixed(5)} ${(-k).toFixed(5)})">${out}</g>`;
}
const centred = (font, text, cx, y, size, fill, track = 0) => line(font, text, cx - widthOf(font, text, size, track) / 2, y, size, fill, track);

function fit(font, text, size, max) {
  if (widthOf(font, text, size) <= max) return text;
  let t = text;
  while (t && widthOf(font, `${t}…`, size) > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/** Wraps to at most two lines. */
function wrap(font, text, size, max) {
  if (widthOf(font, text, size) <= max) return [text];
  const words = text.split(' ');
  let first = '', i = 0;
  while (i < words.length && widthOf(font, `${first} ${words[i]}`.trim(), size) <= max) first = `${first} ${words[i++]}`.trim();
  if (!first) return [fit(font, text, size, max)];
  return [first, fit(font, words.slice(i).join(' '), size, max)];
}

const skillList = v => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : []).map(clean).filter(Boolean);

function postedLabel(v) {
  const t = new Date(v).getTime();
  if (!v || Number.isNaN(t)) return '';
  const days = Math.floor((Date.now() - t) / 864e5);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function workMode(job) {
  const text = `${job.type ?? ''} ${job.location ?? ''}`.toLowerCase();
  return text.includes('remote') ? 'Remote' : text.includes('hybrid') ? 'Hybrid' : 'On-site';
}

/** The chips on the app's job card, each with its colours, leaving out anything unknown. */
export function jobChips(job, company = {}) {
  const salary = job.salary_range && !/undisclosed/i.test(job.salary_range) ? clean(job.salary_range) : '';
  const experience = job.experience && !/^(null|not specified)$/i.test(job.experience) ? clean(job.experience) : '';
  return [
    [clean(company.industry), '#ede9fe', '#5b34c9'],
    [clean(company.company_type), '#dcfce7', '#1c7a43'],
    [clean(job.type), '#ffedd5', '#b4560f'],
    [workMode(job), '#f1f0ee', '#4e4a41'],
    [experience, '#dbeafe', '#2159b5'],
    [postedLabel(job.posted_at), '#f1f0ee', '#4e4a41'],
    [salary, '#f1f0ee', '#4e4a41'],
    [clean(job.education_level), '#dbeafe', '#2159b5'],
  ].filter(c => c[0]);
}

/** Lays pills out in centred rows, stopping when the space runs out. */
function pills(items, cx, top, maxW, opts) {
  const { size, height, gap, maxRows, pad } = opts;
  const rows = [[]];
  let used = 0;
  for (const item of items) {
    const label = fit(SANS, item[0], size, maxW - pad * 2);
    const w = widthOf(SANS, label, size) + pad * 2;
    if (used && used + gap + w > maxW) {
      if (rows.length === maxRows) break;
      rows.push([]); used = 0;
    }
    rows[rows.length - 1].push([label, w, item[1], item[2]]);
    used += (used ? gap : 0) + w;
  }
  let out = '', y = top;
  for (const row of rows) {
    if (!row.length) continue;
    const total = row.reduce((n, p) => n + p[1], 0) + gap * (row.length - 1);
    let x = cx - total / 2;
    for (const [label, w, bg, fg] of row) {
      out += `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${height}" rx="${height / 2}" fill="${bg}"/>${line(SANS, label, x + pad, y + height * 0.69, size, fg)}`;
      x += w + gap;
    }
    y += height + gap;
  }
  return { svg: out, bottom: y };
}

/** The app's job card on a phone, filled in with this job. */
function phone(job, company, name, logo) {
  const X = 842, Y = 18, W = 308, H = 594;
  const sx = X + 11, sy = Y + 11, sw = W - 22, sh = H - 22, cx = X + W / 2;
  const logoBox = 74, logoY = sy + 74;
  const badge = logo
    ? `<rect x="${cx - logoBox / 2}" y="${logoY}" width="${logoBox}" height="${logoBox}" rx="18" fill="#f7f5f1"/><image x="${cx - 26}" y="${logoY + 11}" width="52" height="52" href="${logo}"/>`
    : `<rect x="${cx - logoBox / 2}" y="${logoY}" width="${logoBox}" height="${logoBox}" rx="18" fill="#5536c4"/>${centred(SERIF, name[0].toUpperCase(), cx, logoY + 52, 44, '#fff')}`;

  const company_y = logoY + logoBox + 22;
  const titleLines = wrap(SANS, clean(job.title) || 'Open role', 20, sw - 48);
  const title = titleLines.map((l, i) => centred(SANS, l, cx, company_y + 27 + i * 25, 20, '#111')).join('');
  const chipsTop = company_y + 27 + (titleLines.length - 1) * 25 + 15;
  const chips = pills(jobChips(job, company), cx, chipsTop, sw - 40, { size: 11.5, height: 22, gap: 5, maxRows: 4, pad: 9 });
  const skills = skillList(job.skills).map(v => [v, '#111111', '#ffffff']);
  const footerY = sy + sh - 118;
  let skillBlock = '';
  if (skills.length && chips.bottom < footerY - 44) {
    const rows = Math.min(3, Math.floor((footerY - chips.bottom - 22) / 26));
    skillBlock = line(SANS, 'Skills', sx + 22, chips.bottom + 12, 13, '#111')
      + pills(skills, cx, chips.bottom + 19, sw - 40, { size: 11, height: 21, gap: 5, maxRows: rows, pad: 8 }).svg;
  }
  const nav = [0.14, 0.32, 0.5, 0.68, 0.86].map((f, i) => `<circle cx="${(sx + sw * f).toFixed(1)}" cy="${sy + sh - 30}" r="${i === 2 ? 7 : 6}" fill="${i === 2 ? '#111' : '#c8c6c1'}"/>`).join('');
  const icons = [0, 1, 2, 3].map(i => `<circle cx="${sx + sw - 30 - i * 34}" cy="${sy + 45}" r="14" fill="#f7f5f1" stroke="#e6e3dd"/>`).join('');
  return `<rect x="${X}" y="${Y + 12}" width="${W}" height="${H}" rx="50" fill="#2a1d08" opacity=".22"/>
<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="50" fill="#0c0c0d"/>
<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="40" fill="#fff"/>
<rect x="${cx - 42}" y="${sy + 9}" width="84" height="24" rx="12" fill="#0c0c0d"/>
${line(SERIF, 'Iris', sx + 20, sy + 55, 30, '#6d4ae0')}
${icons}
<rect x="${sx + 10}" y="${sy + 66}" width="${sw - 20}" height="${sh - 66 - 58}" rx="20" fill="#fff" stroke="#ececea"/>
${badge}
${centred(SANS, fit(SANS, name, 14, sw - 48), cx, company_y, 14, '#111')}
${title}
${chips.svg}
${skillBlock}
<rect x="${cx + 18}" y="${footerY + 20}" width="108" height="30" rx="15" fill="#d9a52a"/>
${centred(SANS, 'Check FIT Score', cx + 72, footerY + 40, 11.5, '#fff')}
<rect x="${sx + 10}" y="${footerY + 59}" width="${sw - 20}" height="1" fill="#ececea"/>
${centred(SANS, 'Tap to see full details', cx, footerY + 78, 11.5, '#111')}
${nav}
<rect x="${cx - 44}" y="${sy + sh - 11}" width="88" height="4" rx="2" fill="#c8c6c1"/>`;
}

export function jobSvg(job, logo, company = {}) {
  const raw = clean(job.company_name) || 'This company';
  const name = raw === 'Spacex' ? 'SpaceX' : raw;
  const place = clean(job.location);
  const meta = [place && fit(SANS, place, 24, 380), clean(job.type)].filter(Boolean).join('  ·  ');

  // Left side: Iris | Company, the headline, then who is hiring.
  const left = 58;
  const irisW = widthOf(SERIF, 'Iris', 40);
  const shortName = fit(SANS, name, 28, 400);
  const logoX = left + 52 + 12 + irisW + 50;
  const lockup = logo
    ? `<rect x="${logoX.toFixed(1)}" y="46" width="52" height="52" rx="13" fill="#fff"/><image x="${(logoX + 5).toFixed(1)}" y="51" width="42" height="42" href="${logo}"/>`
    : `<rect x="${logoX.toFixed(1)}" y="46" width="52" height="52" rx="13" fill="#5536c4"/>${centred(SERIF, name[0].toUpperCase(), logoX + 26, 83, 34, '#fff')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<image width="1200" height="630" href="${BG}"/>
<image x="${left}" y="46" width="52" height="52" href="${LOGO}"/>
${line(SERIF, 'Iris', left + 64, 85, 40, '#23201b')}
<rect x="${(left + 64 + irisW + 24).toFixed(1)}" y="52" width="2" height="40" fill="#23201b" opacity=".28"/>
${lockup}
${line(SANS, shortName, logoX + 66, 83, 28, '#23201b')}
${line(SERIF, 'Apply to this job', left, 228, 88, '#23201b')}
${line(SERIF, 'in one swipe.', left, 318, 88, '#5536c4')}
${line(SANS, fit(SANS, `${name.toUpperCase()} IS HIRING`, 21, 720), left, 386, 21, '#5536c4', 2.2)}
${wrap(SERIF, clean(job.title) || 'Open role', 40, 730).map((l, i) => line(SERIF, l, left, 434 + i * 44, 40, '#23201b')).join('\n')}
${line(SANS, fit(SANS, meta, 24, 730), left, wrap(SERIF, clean(job.title) || 'Open role', 40, 730).length === 2 ? 516 : 472, 24, '#4e4a41')}
${line(SANS, 'Tinder for Jobs: Free to Try  ·  iOS  ·  Android  ·  Web', left, 578, 23, '#2f2b24')}
${phone(job, company, name, logo)}
</svg>`;
}

/** How a search reads in words, such as "entry-level remote". */
export function searchWords(f) {
  const level = { intern: 'internship', entry: 'entry-level', experienced: 'experienced' }[f.level];
  const mode = { remote: 'remote', hybrid: 'hybrid', onsite: 'on-site' }[f.mode];
  const type = { full: 'full-time', part: 'part-time', contract: 'contract' }[f.type];
  return [level, mode, type].filter(Boolean).join(' ');
}

/** A shared search: how many roles match, with the top match on the phone. */
export function searchSvg({ count, more, query, atCompany, place, filters, top, logo, company }) {
  const label = searchWords(filters);
  const total = `${count}${more ? '+' : ''}`;
  const first = fit(SERIF, `${total} ${label ? `${label} ` : ''}${count === 1 ? 'job' : 'jobs'}`, 70, 740);
  const second = query ? fit(SERIF, `${atCompany ? 'at' : 'for'} ${query}`, 70, 740) : '';
  const third = place ? fit(SERIF, `in ${place}`, 70, 740) : '';
  const lines = [first, second, third].filter(Boolean);
  const raw = clean(top.company_name) || 'This company';
  const name = raw === 'Spacex' ? 'SpaceX' : raw;
  const left = 58;
  const irisW = widthOf(SERIF, 'Iris', 40);
  const startY = lines.length === 3 ? 196 : lines.length === 2 ? 226 : 266;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<image width="1200" height="630" href="${BG}"/>
<image x="${left}" y="46" width="52" height="52" href="${LOGO}"/>
${line(SERIF, 'Iris', left + 64, 85, 40, '#23201b')}
${lines.map((l, i) => line(SERIF, l, left, startY + i * 80, 70, i === 0 ? '#5536c4' : '#23201b')).join('\n')}
${line(SANS, count === 1 ? 'Apply to it in a single swipe.' : 'Apply to any of them in a single swipe.', left, startY + lines.length * 80 - 18, 31, '#2f2b24')}
${line(SANS, 'Tinder for Jobs: Free to Try  ·  iOS  ·  Android  ·  Web', left, 578, 23, '#2f2b24')}
${phone(top, company, name, logo)}
</svg>`;
}

/** Latin names only, since the bundled fonts are Latin. Others read "A friend", as on an unknown code. */
function displayName(name) {
  const n = clean(name);
  return /^[\x20-\x7e]+$/.test(n) ? fit(SERIF, n, 68, 560) : '';
}

export function inviteSvg(name, code, reward = 5) {
  const who = displayName(name) || 'A friend';
  const irisW = widthOf(SERIF, 'Iris', 40);
  const x = 600 - (52 + 12 + irisW) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<image width="1200" height="630" href="${BG}"/>
<image x="${x.toFixed(1)}" y="36" width="52" height="52" href="${LOGO}"/>
${line(SERIF, 'Iris', x + 64, 75, 40, '#23201b')}
${centred(SERIF, `${who} invited you to Iris.`, 600, 178, 68, '#23201b')}
<rect x="147" y="230" width="906" height="268" rx="30" fill="#3a2a10" opacity=".14"/>
<rect x="150" y="222" width="900" height="268" rx="30" fill="#fffdf9"/>
<rect x="270" y="282" width="660" height="118" rx="20" fill="#f7f3ff" stroke="#5536c4" stroke-width="2" stroke-dasharray="9 8"/>
${centred(SANS, 'YOUR INVITE CODE', 600, 265, 21, '#5536c4', 2.2)}
${centred(SERIF, code, 600, 368, 84, '#23201b', 8)}
${centred(SANS, `Sign up with this code and you both get ${reward} free swipes.`, 600, 448, 28, '#4e4a41')}
${centred(SANS, 'Tinder for Jobs: Free to Try  ·  iOS  ·  Android  ·  Web', 600, 556, 25, '#2f2b24')}
</svg>`;
}

export function companyDomain(job) {
  return String(job.company_website || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]
    || `${String(job.company_name).toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
}

/** The company's icon as a data URL, or null so the image shows its initial instead. */
export async function fetchLogo(job) {
  try {
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(companyDomain(job))}&sz=128`, { signal: AbortSignal.timeout(2500), cf: { cacheTtl: 604800, cacheEverything: true } });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length < 200 || bytes.length > 60000) return null;
    let s = '';
    for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    return `data:${res.headers.get('content-type') || 'image/png'};base64,${btoa(s)}`;
  } catch { return null; }
}
