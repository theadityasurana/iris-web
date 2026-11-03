#!/usr/bin/env node
/**
 * After `bun run build`, copies the website dist into the nextquark-links
 * public folder so both sites deploy together.
 *
 * Usage: node website/scripts/copy-to-links.mjs
 *
 * What it copies:
 *   website/dist/app/**        → nextquark-links/public/app/**
 *   website/dist/how-it-works/ → nextquark-links/public/how-it-works/
 */
import { cpSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dir, '../dist');
const LINKS = resolve(__dir, '../../../nextquark-links/public');

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `bun run build` first');
  process.exit(1);
}

if (!existsSync(LINKS)) {
  console.error('nextquark-links/public not found at', LINKS);
  process.exit(1);
}

const copies = [
  { src: resolve(DIST, 'app'), dest: resolve(LINKS, 'app') },
  { src: resolve(DIST, 'how-it-works'), dest: resolve(LINKS, 'how-it-works') },
];

for (const { src, dest } of copies) {
  if (!existsSync(src)) { console.warn('skip (not found):', src); continue; }
  cpSync(src, dest, { recursive: true, force: true });
  console.log('copied', src, '->', dest);
}

console.log('done');
