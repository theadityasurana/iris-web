/**
 * Sends www.irisjobs.live to irisjobs.live for SEO. The mobile app registers
 * www.irisjobs.live for universal and app links, and Apple does not follow
 * redirects for the association file, so those paths must keep answering on www.
 */
const APP_LINK_PATHS = /^\/(\.well-known\/|job\/|post\/|invite\/|iris\/?$|download\/?$)/;

export function canonicalRedirect(requestUrl) {
  const url = new URL(requestUrl);
  if (url.hostname !== 'www.irisjobs.live' || APP_LINK_PATHS.test(url.pathname)) return null;
  url.hostname = 'irisjobs.live';
  return url.toString();
}

export async function onRequest(context) {
  const target = canonicalRedirect(context.request.url);
  return target ? Response.redirect(target, 301) : context.next();
}
