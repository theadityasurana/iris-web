/**
 * Serves a share image as a plain JPEG on our own domain. Crawlers such as X obey robots.txt for
 * images, and the converter's robots.txt blocks them, so we fetch from it and serve the result.
 * These paths must stay outside /api/, which robots.txt disallows.
 */
const FALLBACK = '/media/iris-og.jpg';

export function converterUrl(host, svgPath) {
  return `https://images.weserv.nl/?url=${encodeURIComponent(host + svgPath)}&output=jpg&q=86&w=1200&h=630`;
}

export async function serveJpeg({ request, env, waitUntil }, svgPath, cachePath, cacheSeconds = 604800) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405 });
  const url = new URL(request.url);
  const headers = { 'Content-Type': 'image/jpeg', 'Cache-Control': `public, max-age=86400, s-maxage=${cacheSeconds}` };
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request(url.origin + cachePath);
  const hit = await cache?.match(key);
  if (hit) return request.method === 'HEAD' ? new Response(null, { headers: hit.headers }) : hit;
  try {
    const res = await fetch(converterUrl(url.host, svgPath), { signal: AbortSignal.timeout(9000) });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('image')) throw new Error(`converter ${res.status}`);
    const out = new Response(await res.arrayBuffer(), { headers });
    if (cache) { const put = cache.put(key, out.clone()); if (waitUntil) waitUntil(put); else await put; }
    return request.method === 'HEAD' ? new Response(null, { headers }) : out;
  } catch (e) {
    // Never leave a link with no image: use the site's preview, without caching the failure for long.
    console.error('share image failed', e);
    const asset = await env.ASSETS.fetch(new Request(new URL(FALLBACK, url)));
    return new Response(request.method === 'HEAD' ? null : asset.body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=300' } });
  }
}
