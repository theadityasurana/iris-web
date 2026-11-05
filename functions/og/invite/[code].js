/** One referral link's share image, as a JPEG. A day of caching, so a changed name shows up soon. */
import { serveJpeg } from '../../_lib/og-serve.js';
import { normalizeCode } from '../../_lib/referrer.js';

export function onRequest(ctx) {
  const code = normalizeCode(String(ctx.params.code || '').replace(/\.jpe?g$/i, '')) || 'INVALID';
  return serveJpeg(ctx, `/api/og/invite/${code}.svg`, `/og/invite/v2/${code}.jpg`, 86400);
}
