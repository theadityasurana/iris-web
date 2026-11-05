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

export function jobSvg(job, logo) {
  const raw = clean(job.company_name) || 'This company';
  const company = raw === 'Spacex' ? 'SpaceX' : raw;
  const title = clean(job.title) || 'Open role';
  const salary = job.salary_range && !/competitive|undisclosed/i.test(job.salary_range) ? clean(job.salary_range) : '';
  const place = clean(job.location);
  const meta = fit(SANS, [place && fit(SANS, place, 25, 430), clean(job.type), salary].filter(Boolean).join('  ·  '), 25, 800);

  // Iris | Company, centred as one unit.
  const name = fit(SANS, company, 30, 380);
  const irisW = widthOf(SERIF, 'Iris', 40);
  const nameW = widthOf(SANS, name, 30);
  const total = 52 + 12 + irisW + 56 + 52 + 14 + nameW;
  let x = 600 - total / 2;
  const logoX = x + 52 + 12 + irisW + 56;
  const badge = logo
    ? `<rect x="${logoX.toFixed(1)}" y="36" width="52" height="52" rx="13" fill="#fff"/><image x="${(logoX + 5).toFixed(1)}" y="41" width="42" height="42" href="${logo}"/>`
    : `<rect x="${logoX.toFixed(1)}" y="36" width="52" height="52" rx="13" fill="#5536c4"/>${centred(SERIF, company[0].toUpperCase(), logoX + 26, 73, 34, '#fff')}`;

  const lines = wrap(SERIF, title, 54, 810);
  const cardH = lines.length === 2 ? 266 : 208;
  const cardY = 222;
  const titleY = cardY + 118;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<image width="1200" height="630" href="${BG}"/>
<image x="${x.toFixed(1)}" y="36" width="52" height="52" href="${LOGO}"/>
${line(SERIF, 'Iris', x + 64, 75, 40, '#23201b')}
<rect x="${(x + 64 + irisW + 27).toFixed(1)}" y="42" width="2" height="40" fill="#23201b" opacity=".28"/>
${badge}
${line(SANS, name, logoX + 66, 73, 30, '#23201b')}
${centred(SERIF, 'Apply to this job in one swipe.', 600, 178, 68, '#23201b')}
<rect x="147" y="${cardY + 8}" width="906" height="${cardH}" rx="30" fill="#3a2a10" opacity=".14"/>
<rect x="150" y="${cardY}" width="900" height="${cardH}" rx="30" fill="#fffdf9"/>
${line(SANS, fit(SANS, `${company.toUpperCase()} IS HIRING`, 21, 800), 192, cardY + 58, 21, '#5536c4', 2.2)}
${lines.map((l, i) => line(SERIF, l, 192, titleY + i * 58, 54, '#23201b')).join('\n')}
${line(SANS, meta, 192, cardY + cardH - 34, 25, '#4e4a41')}
${centred(SANS, 'Tinder for Jobs: Free to Try  ·  iOS  ·  Android  ·  Web', 600, Math.min(590, cardY + cardH + 66), 25, '#2f2b24')}
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
<rect x="340" y="282" width="520" height="118" rx="20" fill="#f7f3ff" stroke="#5536c4" stroke-width="2" stroke-dasharray="9 8"/>
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
