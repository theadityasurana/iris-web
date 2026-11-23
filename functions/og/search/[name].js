/**
 * A shared search's image, as a JPEG. The design rotates per search (stable for a
 * given link), and if one design fails the next ones are tried before the site's
 * image. Cached for six hours per search, so it runs rarely.
 */
import { normalize } from '../../api/jobs.js';
import { serveJpeg } from '../../_lib/og-serve.js';
import { COMPANY_VARIANTS, hashOf } from '../../_lib/og-share.js';

export function onRequest(ctx) {
  const url = new URL(ctx.request.url);
  const f = normalize(ctx.request.url);
  const key = ['q', 'loc', 'level', 'mode', 'type', 'days'].map(k => `${k}=${encodeURIComponent(f[k])}`).join('&');
  // The SVG decides company vs. several companies; variants beyond a kind's count wrap around.
  const start = hashOf(key) % COMPANY_VARIANTS;
  const base = new URLSearchParams(url.search);
  const paths = Array.from({ length: COMPANY_VARIANTS }, (_, i) => {
    const p = new URLSearchParams(base);
    p.set('v', String((start + i) % COMPANY_VARIANTS));
    return `/api/og/search/preview.svg?${p}`;
  });
  return serveJpeg(ctx, paths, `/og/search/v3/${encodeURIComponent(key)}.jpg`, 21600);
}
