/**
 * Referral links: the same page as always, but link previews show who invited you and their code.
 * Unknown codes and any failure fall back to the normal page, so links never break.
 */
import { withPreview } from '../_lib/preview-page.js';
import { findReferrer, INVITE_REWARD, normalizeCode } from '../_lib/referrer.js';

export function invitePreview(name, code, origin) {
  const who = name || 'A friend';
  return {
    title: `${who} invited you to Iris`,
    description: `Use code ${code} and you both get ${INVITE_REWARD} free swipes. Iris is the Tinder for jobs: swipe right, and AI applies for you.`,
    image: `${origin}/og/invite/${code}.jpg`,
  };
}

export async function onRequestGet({ request, env, params }) {
  const page = await env.ASSETS.fetch(new Request(new URL('/', request.url), { headers: request.headers }));
  try {
    const code = normalizeCode(params.code);
    const referrer = code && await findReferrer(code);
    if (!referrer) return page;
    return withPreview(page, invitePreview(referrer.name, code, new URL(request.url).origin), request.url);
  } catch (e) {
    console.error('invite preview failed', e);
    return page;
  }
}
