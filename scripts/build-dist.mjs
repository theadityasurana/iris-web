#!/usr/bin/env node
/**
 * After `vite build`, merges the static landing-site files from public/
 * into dist/ so Cloudflare Pages gets everything in one folder.
 *
 * Files copied: everything in public/ EXCEPT app/ and how-it-works/
 * (those are produced by Vite and already in dist/).
 */
import { cpSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dir, '../public');
const DIST = resolve(__dir, '../dist');

const SKIP = new Set(['app']);

for (const entry of readdirSync(PUBLIC)) {
  if (SKIP.has(entry)) continue;
  const src = resolve(PUBLIC, entry);
  const dest = resolve(DIST, entry);
  cpSync(src, dest, { recursive: true, force: true });
  console.log('copied', entry, '->', dest);
}

// Analytics and search-console tags come from build-time environment variables,
// so nothing is added until the owner has real IDs.
const GA = process.env.IRIS_GA_ID;
const GSC = process.env.IRIS_GSC_TOKEN;
const BING = process.env.IRIS_BING_TOKEN;
const valid = v => !v || /^[\w.-]+$/.test(v);
if (!valid(GA) || !valid(GSC) || !valid(BING)) throw new Error('Invalid analytics or verification ID');
const tags = [
  GSC && `<meta name="google-site-verification" content="${GSC}">`,
  BING && `<meta name="msvalidate.01" content="${BING}">`,
  GA && `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA}');</script>`,
].filter(Boolean).join('');
function inject(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'assets' && entry.name !== 'media') inject(path); continue; }
    if (entry.name.endsWith('.html')) writeFileSync(path, readFileSync(path, 'utf8').replace('</head>', `${tags}</head>`));
  }
}
if (tags) { inject(DIST); console.log('injected analytics and verification tags'); }

console.log('done');
