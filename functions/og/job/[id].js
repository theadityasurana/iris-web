/** One job's share image, as a JPEG: the job design, then the previous design as a fallback. */
import { serveJpeg } from '../../_lib/og-serve.js';

export function onRequest(ctx) {
  const id = encodeURIComponent(String(ctx.params.id || '').replace(/\.jpe?g$/i, ''));
  return serveJpeg(ctx, [`/api/og/job/${id}.svg`, `/api/og/job/${id}.svg?v=legacy`], `/og/job/v3/${id}.jpg`);
}
