/** A shared search's image, as a JPEG. Cached for six hours per search, so it runs rarely. */
import { normalize } from '../../api/jobs.js';
import { serveJpeg } from '../../_lib/og-serve.js';

export function onRequest(ctx) {
  const url = new URL(ctx.request.url);
  const f = normalize(ctx.request.url);
  const key = ['q', 'loc', 'level', 'mode', 'type', 'days'].map(k => `${k}=${encodeURIComponent(f[k])}`).join('&');
  return serveJpeg(ctx, `/api/og/search/preview.svg${url.search}`, `/og/search/v2/${encodeURIComponent(key)}.jpg`, 21600);
}
