#!/usr/bin/env node
/** Checks every public page in dist/ for the on-page SEO basics. Exits non-zero on errors. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const DIST = resolve(import.meta.dirname, '../dist');
const SITE = 'https://irisjobs.live';
const errors = [];
const warnings = [];
const pages = [];

function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!['app', 'media'].includes(e.name)) walk(p); } else if (e.name.endsWith('.html') && e.name !== '404.html') pages.push(p);
  }
}
walk(DIST);

const urlOf = p => `${SITE}/${relative(DIST, p).replace(/index\.html$/, '')}`;
const titles = new Map(); const descs = new Map(); const links = new Map();
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const add = (m, k, v) => m.set(k, [...(m.get(k) ?? []), v]);

for (const p of pages) {
  const h = readFileSync(p, 'utf8');
  const url = urlOf(p);
  const bad = m => errors.push(`${url}: ${m}`);
  const title = decode(h.match(/<title>(.*?)<\/title>/s)?.[1] ?? '');
  const desc = decode(h.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  if (!title) bad('missing title'); else if (title.length > 60) bad(`title ${title.length} chars: ${title}`);
  if (!desc) bad('missing description'); else if (desc.length < 70 || desc.length > 165) warnings.push(`${url}: description ${desc.length} chars`);
  add(titles, title, url); add(descs, desc, url);
  if ((h.match(/<h1[\s>]/g) ?? []).length !== 1) bad(`h1 count ${(h.match(/<h1[\s>]/g) ?? []).length}`);
  const canon = h.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canon !== url) bad(`canonical ${canon}`);
  if (/name="robots" content="[^"]*noindex/.test(h)) bad('noindex');
  // Strip scripts first: strings inside them are not rendered markup.
  const markup = h.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const img of markup.match(/<img\b[^>]*>/g) ?? []) {
    if (!/\balt="[^"]+"/.test(img)) bad(`image without alt: ${img.slice(0, 80)}`);
    if (!/\bwidth="\d+"/.test(img) || !/\bheight="\d+"/.test(img)) warnings.push(`${url}: image without dimensions: ${img.slice(0, 70)}`);
  }
  for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try { JSON.parse(m[1]); } catch { bad('invalid JSON-LD'); }
  }
  for (const m of markup.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const raw = m[1];
    if (!raw.startsWith('/') || raw.startsWith('//')) continue;
    const path = raw.split(/[?#]/)[0];
    add(links, path, url);
    if (path.startsWith('/app')) continue;
    const target = join(DIST, path, path.endsWith('/') ? 'index.html' : '');
    if (!existsSync(target)) bad(`broken link ${raw}`);
    if (!path.endsWith('/') && !/\.[a-z0-9]+$/i.test(path)) warnings.push(`${url}: link missing trailing slash causes a redirect: ${raw}`);
  }
}
for (const [t, us] of titles) if (t && us.length > 1) errors.push(`duplicate title "${t}": ${us.length} pages`);
for (const [d, us] of descs) if (d && us.length > 1) errors.push(`duplicate description on ${us.length} pages: ${us[0]}`);

const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const inMap = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));
for (const p of pages) if (!inMap.has(urlOf(p))) errors.push(`${urlOf(p)}: not in sitemap`);
for (const u of inMap) if (!pages.some(p => urlOf(p) === u)) errors.push(`${u}: in sitemap but no page`);
for (const p of pages) {
  const path = '/' + relative(DIST, p).replace(/index\.html$/, '');
  if (path !== '/' && !links.has(path)) errors.push(`${urlOf(p)}: orphan (no internal links)`);
}
const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
if (!/Sitemap: https:\/\/irisjobs\.live\/sitemap\.xml/.test(robots)) errors.push('robots.txt missing sitemap');
if (/^Disallow:\s*\/\s*$/m.test(robots)) errors.push('robots.txt blocks the whole site');

console.log(`${pages.length} pages · ${errors.length} errors · ${warnings.length} warnings`);
errors.slice(0, 40).forEach(e => console.log('ERROR', e));
warnings.slice(0, 15).forEach(w => console.log('warn ', w));
process.exit(errors.length ? 1 : 0);
