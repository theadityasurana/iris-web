/**
 * irisjobs.live keeps the earlier link-preview card (iris-share.jpg, 1200x628).
 * Every other host (nextquark.in etc.) gets index.html's tags unchanged (iris-share-v5.jpg).
 */
const IRIS_HOSTS = new Set(['irisjobs.live', 'www.irisjobs.live', 'download.nextquark.in', 'iris.nextquark.in']);
const OLD_IMAGE = 'https://irisjobs.live/media/iris-share.jpg?v=4';

export async function onRequest(context) {
  const res = await context.next();
  const host = new URL(context.request.url).hostname;
  const type = res.headers.get('content-type') || '';
  if (!IRIS_HOSTS.has(host) || !type.includes('text/html')) return res;

  const setAttr = (value) => ({ element(el) { el.setAttribute('content', value); } });
  return new HTMLRewriter()
    .on('meta[property="og:image"]', setAttr(OLD_IMAGE))
    .on('meta[property="og:image:secure_url"]', setAttr(OLD_IMAGE))
    .on('meta[property="og:image:width"]', setAttr('1200'))
    .on('meta[property="og:image:height"]', setAttr('628'))
    .on('meta[name="twitter:image"]', setAttr(OLD_IMAGE))
    .transform(res);
}
