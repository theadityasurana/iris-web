/** One job's share image, as a JPEG. */
import { serveJpeg } from '../../_lib/og-serve.js';

export function onRequest(ctx) {
  const id = encodeURIComponent(String(ctx.params.id || '').replace(/\.jpe?g$/i, ''));
  return serveJpeg(ctx, `/api/og/job/${id}.svg`, `/og/job/v2/${id}.jpg`);
}
