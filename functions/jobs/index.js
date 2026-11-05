/**
 * Shared searches on /jobs/ get a preview made for that search. This only rewrites tags: it never
 * queries the database, so opening the page stays as fast as before. Plain /jobs/ is untouched.
 */
import { clean, isFixed, normalize } from '../api/jobs.js';
import { searchWords } from '../_lib/og-svg.js';
import { withPreview } from '../_lib/preview-page.js';

/** Keeps how someone typed it if they used capitals, otherwise title-cases it. */
export function displayText(raw) {
  const t = clean(raw, 60);
  return /[A-Z]/.test(t) ? t : t.replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase());
}

/** The validated query string, with text as the person typed it. */
export function searchParams(filters, raw) {
  const out = new URLSearchParams();
  for (const k of ['q', 'loc']) if (filters[k]) out.set(k, clean(raw.get(k), 60));
  for (const k of ['level', 'mode', 'type', 'days']) if (filters[k]) out.set(k, filters[k]);
  return out;
}

export function searchPreview(filters, raw, origin) {
  if (isFixed(filters) || filters.offset) return null;
  const words = searchWords(filters);
  const role = filters.q ? displayText(raw.get('q')) : '';
  const place = filters.loc ? displayText(raw.get('loc')) : '';
  const lead = [words && words[0].toUpperCase() + words.slice(1), role].filter(Boolean).join(' ');
  const phrase = `${lead || 'Open'} jobs${place ? ` in ${place}` : ''}`;
  return {
    title: `${phrase} | Iris`,
    description: `Browse ${phrase} on Iris, and apply to any of them in a single swipe. The Tinder for jobs, free to try.`,
    image: `${origin}/og/search/preview.jpg?${searchParams(filters, raw)}`,
  };
}

export async function onRequestGet({ request, next }) {
  const page = await next();
  try {
    const url = new URL(request.url);
    const p = searchPreview(normalize(request.url), url.searchParams, url.origin);
    return p ? withPreview(page, p, request.url) : page;
  } catch (e) {
    console.error('search preview failed', e);
    return page;
  }
}
