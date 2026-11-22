/**
 * Public stats for one influencer's private dashboard URL. Shows purchase
 * counts only: no buyer names or emails, and no revenue.
 */
import { json } from '../../../_lib/dodo.js';
import { SLUG_RE, listPartners, loadSales, partnerStats, serverError } from '../../../_lib/referrals.js';

export async function onRequestGet({ params, env }) {
  const slug = String(params.slug || '').toLowerCase();
  if (!SLUG_RE.test(slug)) return json({ error: 'Not found' }, 404);
  try {
    const [partner] = await listPartners(env, `&slug=eq.${encodeURIComponent(slug)}&active=is.true`);
    if (!partner) return json({ error: 'Not found' }, 404);
    const { revenue, timesUsed, discountFound, ...stats } = partnerStats(partner.promo_code, await loadSales(env));
    return json({ name: partner.name, promo_code: partner.promo_code, since: partner.created_at, ...stats });
  } catch (err) {
    return serverError('referral partner load', err);
  }
}
