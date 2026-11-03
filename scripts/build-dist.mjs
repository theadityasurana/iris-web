#!/usr/bin/env node
/**
 * After `vite build`, merges the static landing-site files from public/
 * into dist/ so Cloudflare Pages gets everything in one folder.
 *
 * Files copied: everything in public/ EXCEPT app/ and how-it-works/
 * (those are produced by Vite and already in dist/).
 */
import { cpSync, readdirSync, existsSync } from 'node:fs';
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

console.log('done');
