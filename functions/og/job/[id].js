/**
 * A job's share image, as a plain JPEG on our own domain. Crawlers such as X obey robots.txt
 * for images, and the converter's robots.txt blocks them, so we fetch from it and serve the
 * result here. This path must stay outside /api/, which robots.txt disallows.
 */
const FALLBACK = '/media/iris-og.jpg';
const JPEG = { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, s-maxage=604800' };

export function converterUrl(host, id) {
  const source = `${host}/api/og/job/${encodeURIComponent(id)}.svg`;
  return `https://images.weserv.nl/?url=${encodeURIComponent(source)}&output=jpg&q=86&w=1200&h=630`;
}

export async function onRequest({ params, request, env, waitUntil }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405 });
  const url = new URL(request.url);
  const id = String(params.id || '').replace(/\.jpe?g$/i, '');
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request(`${url.origin}/og/job/v1/${encodeURIComponent(id)}.jpg`);
  const hit = await cache?.match(key);
  if (hit) return request.method === 'HEAD' ? new Response(null, { headers: hit.headers }) : hit;

  try {
    const res = await fetch(converterUrl(url.host, id), { signal: AbortSignal.timeout(9000) });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('image')) throw new Error(`converter ${res.status}`);
    const out = new Response(await res.arrayBuffer(), { headers: JPEG });
    if (cache) { const put = cache.put(key, out.clone()); if (waitUntil) waitUntil(put); else await put; }
    return request.method === 'HEAD' ? new Response(null, { headers: JPEG }) : out;
  } catch (e) {
    // Never leave a link with no image: use the site's preview, without caching the failure for long.
    console.error('job image failed', e);
    const asset = await env.ASSETS.fetch(new Request(new URL(FALLBACK, url)));
    return new Response(request.method === 'HEAD' ? null : asset.body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=300' } });
  }
}
