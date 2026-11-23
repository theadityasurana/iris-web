/**
 * Share images that market the job, not Iris: the company's logo and name
 * dominate, with no job counts. Five designs for one company (rotated per
 * company), one for a single job, three for searches across companies.
 * Text is drawn as shapes from the bundled fonts, as in og-svg.js.
 */
import { BOLD, MONO, SANS, SERIF } from './og-assets.js';
import { centred, clean, fit, line, widthOf, wrap } from './og-svg.js';

export const COMPANY_VARIANTS = 5;
export const SEARCH_VARIANTS = 3;

const esc = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const PALETTE = ['#f05a14', '#3b5bdb', '#0c8f5d', '#c2255c', '#7048e8', '#e8590c', '#1c7ed6', '#d6336c', '#2b8a3e', '#5f3dc4'];
export function hashOf(text) {
  let h = 2166136261;
  for (const ch of String(text).toLowerCase()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
const colourFor = name => PALETTE[hashOf(name) % PALETTE.length];
const FOOT = (x, y, fill, anchor = 'start') => anchor === 'middle'
  ? centred(MONO, 'IRISJOBS.LIVE', x, y, 15, fill, 2.1)
  : line(MONO, 'IRISJOBS.LIVE', x, y, 15, fill, 2.1);

/** A logo tile: white rounded square (or circle) with the logo inset; the initial when there is no logo. */
function tile(x, y, size, logo, name, { radius = size * 0.2, circle = false, shadow = 'rgba(0,0,0,.35)', border = 0 } = {}) {
  const r = circle ? size / 2 : radius;
  const inset = size * (circle ? 0.2 : 0.11);
  const shape = (extra = '') => `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" ${extra}/>`;
  const shadowEl = shadow ? `<g filter="url(#soft)" opacity=".9">${shape(`fill="${shadow}" transform="translate(0 ${size * 0.06})"`)}</g>` : '';
  const ring = border ? `<rect x="${x - border}" y="${y - border}" width="${size + border * 2}" height="${size + border * 2}" rx="${r + border}" fill="#fff" opacity=".92"/>` : '';
  if (logo) {
    return `${shadowEl}${ring}${shape('fill="#fff"')}<image x="${x + inset}" y="${y + inset}" width="${size - inset * 2}" height="${size - inset * 2}" preserveAspectRatio="xMidYMid meet" href="${esc(logo)}"/>`;
  }
  const initial = (clean(name)[0] || '?').toUpperCase();
  return `${shadowEl}${ring}${shape(`fill="${colourFor(name)}"`)}${centred(BOLD, initial, x + size / 2, y + size * 0.66, size * 0.5, '#fff')}`;
}

const svgOpen = defs => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<defs><filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>${defs ?? ''}</defs>`;

/** Wraps to at most `max` lines, the last one shortened with … if it still doesn't fit. */
function wrapN(font, text, size, width, max = 3) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (widthOf(font, next, size) <= width || !cur) cur = next;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length <= max) return lines.map(l => fit(font, l, size, width));
  return [...lines.slice(0, max - 1), fit(font, lines.slice(max - 1).join(' '), size, width)];
}

/** Largest size (≤ max) at which text fits in width. */
const sizeFor = (font, text, max, width, min = 40) => {
  let s = max;
  while (s > min && widthOf(font, text, s) > width) s -= 2;
  return s;
};

// ── One company: "Jobs at Sarvam" ────────────────────────────────────────────
export function companySvg(variant, { name, logo, place }) {
  const n = clean(name) || 'This company';
  const sub = place ? `Open roles · ${place}` : 'See open roles';
  switch (variant % COMPANY_VARIANTS) {
    case 0: { // dark spotlight
      const size = sizeFor(BOLD, n, 118, 640);
      return `${svgOpen('<radialGradient id="bg" cx="22%" cy="50%" r="80%"><stop offset="0" stop-color="#2a2433"/><stop offset=".7" stop-color="#0d0c0f"/></radialGradient>')}
<rect width="1200" height="630" fill="url(#bg)"/>
${tile(90, 135, 360, logo, n, { radius: 72, shadow: 'rgba(0,0,0,.6)' })}
${line(MONO, 'NOW HIRING', 510, 200, 20, '#a58bf5', 2.8)}
${line(BOLD, 'Jobs at', 510, 300, 118, '#ffffff', -3)}
${line(BOLD, fit(BOLD, n, size, 650), 510, 300 + size * 0.98, size, '#ffffff', -3)}
${line(SANS, fit(SANS, sub, 30, 640), 510, 300 + size * 0.98 + 62, 30, '#c9c2d6')}
${FOOT(510, 578, 'rgba(255,255,255,.55)')}
</svg>`;
    }
    case 1: { // light editorial
      const size = sizeFor(SERIF, n, 112, 600);
      return `${svgOpen()}<rect width="1200" height="630" fill="#f6f1e7"/>
${tile(80, 120, 390, logo, n, { radius: 60, shadow: 'rgba(60,45,20,.22)' })}
${line(SERIF, fit(SERIF, n, size, 620), 530, 250, size, '#1f1b16')}
${line(SERIF, 'is hiring.', 530, 250 + 106, 104, '#6d4ae0')}
<rect x="530" y="392" width="90" height="4" fill="#1f1b16"/>
${line(SANS, fit(SANS, sub, 30, 610), 530, 452, 30, '#5b5346')}
${FOOT(530, 578, '#8a8170')}
</svg>`;
    }
    case 2: { // brand colour
      const colour = colourFor(n);
      const size = sizeFor(BOLD, n, 120, 600);
      return `${svgOpen('<radialGradient id="glow" cx="85%" cy="80%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>')}
<rect width="1200" height="630" fill="${colour}"/><rect width="1200" height="630" fill="url(#glow)"/>
${tile(710, 115, 400, logo, n, { circle: true, shadow: 'rgba(0,0,0,.28)' })}
${line(MONO, "WE'RE HIRING", 80, 200, 20, 'rgba(255,255,255,.85)', 2.8)}
${line(BOLD, 'Join', 80, 300, 120, '#ffffff', -4)}
${line(BOLD, fit(BOLD, n, size, 610), 80, 300 + size * 0.94, size, '#ffffff', -4)}
${line(SANS, fit(SANS, sub, 32, 600), 80, 300 + size * 0.94 + 64, 32, 'rgba(255,255,255,.92)')}
${FOOT(80, 578, 'rgba(255,255,255,.6)')}
</svg>`;
    }
    case 3: { // centred poster
      const head = `${n} is hiring`;
      const size = sizeFor(BOLD, head, 96, 1080);
      const pillW = widthOf(SANS, 'See open roles', 24) + 86;
      return `${svgOpen()}<rect width="1200" height="630" fill="#111111"/>
<rect x="475" y="60" width="250" height="250" rx="62" fill="#ffffff" opacity=".06"/>
${tile(485, 70, 230, logo, n, { radius: 52, shadow: '' })}
${centred(BOLD, fit(BOLD, head, size, 1080), 600, 410, size, '#ffffff', -2)}
<rect x="${600 - pillW / 2}" y="440" width="${pillW}" height="54" rx="27" fill="#ffffff"/>
${line(SANS, 'See open roles', 600 - pillW / 2 + 28, 476, 24, '#111111')}
<path d="M${600 + pillW / 2 - 44} 467h20m-8-8 8 8-8 8" stroke="#111111" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
${FOOT(600, 578, 'rgba(255,255,255,.5)', 'middle')}
</svg>`;
    }
    default: { // split panel
      const size = sizeFor(BOLD, n, 104, 560);
      const s2 = place ? `Open roles · ${place}` : 'Engineering · Product · More';
      return `${svgOpen()}<rect width="1200" height="630" fill="#0e1726"/><rect width="520" height="630" fill="#ffffff"/>
${logo ? `<image x="95" y="150" width="330" height="330" preserveAspectRatio="xMidYMid meet" href="${esc(logo)}"/>` : tile(135, 165, 250, null, n, { shadow: '' })}
${line(MONO, 'CAREERS', 590, 200, 19, '#7fb0ff', 2.8)}
${line(BOLD, 'Jobs at', 590, 296, 104, '#ffffff', -3)}
${line(BOLD, fit(BOLD, n, size, 570), 590, 296 + size * 0.98, size, '#ffffff', -3)}
${line(SANS, fit(SANS, s2, 28, 560), 590, 296 + size * 0.98 + 60, 28, '#9fb3cf')}
${FOOT(590, 578, 'rgba(255,255,255,.55)')}
</svg>`;
    }
  }
}

// ── One job ───────────────────────────────────────────────────────────────────
export function jobShareSvg({ name, logo, title, place, type }) {
  const n = clean(name) || 'This company';
  const meta = [clean(place), clean(type)].filter(Boolean).join(' · ');
  const lines = wrap(BOLD, clean(title) || 'Open role', 84, 1040);
  return `${svgOpen('<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#140f12"/><stop offset="1" stop-color="#2a0d10"/></linearGradient>')}
<rect width="1200" height="630" fill="url(#bg)"/>
${tile(80, 80, 180, logo, n, { radius: 44, shadow: 'rgba(0,0,0,.5)' })}
${line(BOLD, fit(BOLD, n, 58, 820), 290, 164, 58, '#ffffff', -1)}
${meta ? line(SANS, fit(SANS, meta, 26, 820), 292, 214, 26, '#f3b9b9') : ''}
${lines.map((l, i) => line(BOLD, l, 80, 390 + i * 88, 84, '#ffffff', -2)).join('\n')}
${FOOT(80, 578, 'rgba(255,255,255,.55)')}
</svg>`;
}

// ── A search across companies: "Product jobs in India" + their logos ─────────
export function searchShareSvg(variant, { headline, companies }) {
  const list = companies.slice(0, 6);
  const names = list.map(c => clean(c.name)).filter(Boolean);
  const listed = names.length > 1 ? `${names.slice(0, 4).join(', ')} & more` : names[0] ? `at ${names[0]}` : 'Open roles now';
  switch (variant % SEARCH_VARIANTS) {
    case 0: { // logo wall, dark
      const head = wrapN(BOLD, headline, 80, 470, 3);
      const sub = wrapN(SANS, names.length > 1 ? `at ${listed}` : listed, 28, 470, 2);
      const y0 = 300 - head.length * 40;
      const tiles = list.map((c, i) => tile(590 + (i % 3) * 192, 130 + Math.floor(i / 3) * 192, 170, c.logo, c.name, { radius: 40, shadow: 'rgba(0,0,0,.55)' })).join('');
      return `${svgOpen()}<rect width="1200" height="630" fill="#0f0f12"/>
${line(MONO, 'HIRING NOW', 70, y0 - 50, 19, '#a58bf5', 2.8)}
${head.map((l, i) => line(BOLD, l, 70, y0 + 40 + i * 78, 80, '#ffffff', -2)).join('\n')}
${sub.map((l, i) => line(SANS, l, 70, y0 + 40 + head.length * 78 + 14 + i * 36, 28, '#b9b9c4')).join('\n')}
${tiles}
${FOOT(70, 578, 'rgba(255,255,255,.55)')}
</svg>`;
    }
    case 1: { // logo row, light
      const size = sizeFor(SERIF, headline, 96, 1080);
      const n = list.length || 1;
      const w = 150, gap = 22, total = n * w + (n - 1) * gap;
      const tiles = list.map((c, i) => tile(600 - total / 2 + i * (w + gap), 300, w, c.logo, c.name, { radius: 34, shadow: 'rgba(50,40,20,.2)' })).join('');
      return `${svgOpen()}<rect width="1200" height="630" fill="#f7f3ea"/>
${centred(SERIF, fit(SERIF, headline, size, 1080), 600, 170, size, '#1c1915')}
${centred(SANS, names.length > 1 ? 'Open roles at these companies and more' : 'See open roles', 600, 236, 30, '#5c5446')}
${tiles}
${FOOT(600, 578, '#8a8170', 'middle')}
</svg>`;
    }
    default: { // collage, purple
      const pos = [[60, 60, 200], [300, 30, 160], [500, 90, 190], [90, 330, 170], [310, 250, 230], [560, 340, 170]];
      const circles = list.map((c, i) => tile(pos[i][0], pos[i][1], pos[i][2], c.logo, c.name, { circle: true, shadow: 'rgba(10,0,30,.5)', border: 6 })).join('');
      const head = wrapN(BOLD, headline, 68, 340, 3);
      const sub = wrapN(SANS, listed, 26, 340, 3);
      return `${svgOpen('<linearGradient id="bg" x1="0" y1="0" x2="1" y2=".6"><stop offset="0" stop-color="#1b1340"/><stop offset="1" stop-color="#3a1e6b"/></linearGradient>')}
<rect width="1200" height="630" fill="url(#bg)"/>
${circles}
<rect x="770" width="430" height="630" fill="#0a061e" opacity=".55"/>
${line(MONO, 'NOW HIRING', 820, 170, 18, '#c4b5ff', 2.8)}
${head.map((l, i) => line(BOLD, l, 820, 250 + i * 70, 68, '#ffffff', -2)).join('\n')}
${sub.map((l, i) => line(SANS, l, 820, 250 + head.length * 70 + 20 + i * 34, 26, '#d6cdf5')).join('\n')}
${FOOT(820, 578, 'rgba(255,255,255,.55)')}
</svg>`;
    }
  }
}
