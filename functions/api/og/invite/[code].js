/** The SVG behind a referral link's share image. */
import { inviteSvg } from '../../../_lib/og-svg.js';
import { findReferrer, normalizeCode } from '../../../_lib/referrer.js';

export async function onRequestGet({ params }) {
  const code = normalizeCode(String(params.code || '').replace(/\.svg$/, ''));
  const referrer = code && await findReferrer(code);
  if (!referrer) return new Response('Not found', { status: 404 });
  return new Response(inviteSvg(referrer.name, code), { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
}
