/**
 * Self-serve partner sign-up (footer → /partners/join/). No login: the
 * partner's private dashboard URL is their only key, so the page tells them
 * to save it.
 *
 * POST { name, email, social, website (honeypot) }
 *   1. creates a 10%-off Dodo discount code from their name (same settings as
 *      the hand-made codes), trying variants until one is free;
 *   2. saves them in web_referral_partners at the default 20% share;
 *   3. returns their dashboard slug. If saving fails, the Dodo code is deleted.
 *
 * Abuse limits: honeypot field, 3 sign-ups per IP per day, 100 per day overall,
 * one partner per email.
 */
import { db, dodo, json } from '../../_lib/dodo.js';
import { slugify } from '../../_lib/referrals.js';

export const DEFAULT_SHARE = 20;
const PER_IP_PER_DAY = 3;
const GLOBAL_PER_DAY = 100;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Pure: validates and tidies the form. Returns { fields } or { error }. */
export function cleanJoin(body) {
  const name = String(body?.name || '').trim().replace(/\s+/g, ' ');
  const email = String(body?.email || '').trim().toLowerCase();
  const social = String(body?.social || '').trim();
  if (name.length < 2 || name.length > 80) return { error: 'Please enter your name.' };
  if (!EMAIL_RE.test(email) || email.length > 200) return { error: 'Please enter a valid email so we can pay you.' };
  if (social.length < 2 || social.length > 200) return { error: 'Add the social profile you’ll post from (a link or @handle).' };
  return { fields: { name, email, social } };
}

/** Pure: promo code candidates from a name, e.g. "Priya Kapoor" → PRIYA10, PRIYAK10, PRIYAKAPOOR10, then random. */
export function codeCandidates(name, rand = Math.random) {
  const parts = String(name).normalize('NFKD').toUpperCase().replace(/[^A-Z ]/g, '').split(' ').filter(Boolean);
  const first = (parts[0] || '').slice(0, 12);
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const base = first.length >= 2 ? first : 'IRIS';
  const out = [];
  if (first.length >= 2) out.push(`${first}10`);
  if (last) out.push(`${first}${last[0]}10`, `${(first + last).slice(0, 14)}10`);
  for (let i = 0; i < 4; i++) out.push(`${base}${100 + Math.floor(rand() * 900)}`);
  return [...new Set(out)];
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

async function count(env, filter) {
  const res = await db(env, `web_referral_partners?select=id&${filter}`, { headers: { Prefer: 'count=exact', Range: '0-0' } });
  const range = res.headers.get('content-range') || '';
  return Number(range.split('/')[1] || 0);
}

/** Creates the first free code in Dodo. Returns { code, id } or null if Dodo itself is failing. */
async function createDiscount(env, candidates) {
  for (const code of candidates) {
    const taken = await db(env, `web_referral_partners?select=id&promo_code=eq.${encodeURIComponent(code)}`);
    if (taken.ok && (await taken.json()).length) continue;
    const existing = await dodo(env, `/discounts/code/${encodeURIComponent(code)}`);
    if (existing.ok) continue;
    if (existing.status !== 404) { console.error('dodo code lookup failed', existing.status); return null; }
    const res = await dodo(env, '/discounts', {
      method: 'POST',
      body: JSON.stringify({
        code, name: code, type: 'percentage', amount: 1000,
        preserve_on_plan_change: true, customer_eligibility: 'any',
        metadata: { campaign: 'partner-self-serve', created_by: 'iris-partner-join' },
      }),
    });
    if (res.ok) return { code, id: (await res.json()).discount_id };
    if (res.status === 401 || res.status === 403 || res.status >= 500) { console.error('dodo discount create failed', res.status, await res.text()); return null; }
    // Any other 4xx: treat the code as unavailable and try the next one.
  }
  return null;
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  // Bots fill every field; people never see this one.
  if (body?.website) return json({ error: 'Something went wrong. Please try again.' }, 400);
  const { fields, error } = cleanJoin(body);
  if (error) return json({ error }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await sha256(`${ip}|${env.REFERRAL_ADMIN_KEY || ''}`);
  const since = encodeURIComponent(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  try {
    if (await count(env, `ip_hash=eq.${ipHash}&created_at=gte.${since}`) >= PER_IP_PER_DAY) {
      return json({ error: 'Too many sign-ups from this network today. Please try again tomorrow.' }, 429);
    }
    if (await count(env, `source=eq.self&created_at=gte.${since}`) >= GLOBAL_PER_DAY) {
      return json({ error: 'We’ve hit today’s sign-up limit. Please try again tomorrow.' }, 429);
    }
    if (await count(env, `email=ilike.${encodeURIComponent(fields.email.replace(/[%_*]/g, ''))}`) > 0) {
      return json({ error: 'This email already has a partner dashboard. If you lost your link, DM @irisjobs.live on Instagram.' }, 409);
    }
  } catch (err) {
    console.error('join checks failed', err);
    return json({ error: 'Something went wrong. Please try again.' }, 502);
  }

  const discount = await createDiscount(env, codeCandidates(fields.name));
  if (!discount) return json({ error: 'Couldn’t create your code right now. Please try again in a minute.' }, 502);

  const res = await db(env, 'web_referral_partners', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...fields, promo_code: discount.code, slug: slugify(fields.name), commission_percent: DEFAULT_SHARE, source: 'self', ip_hash: ipHash }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('partner insert failed', res.status, text);
    await dodo(env, `/discounts/${encodeURIComponent(discount.id)}`, { method: 'DELETE' });
    return json({ error: text.includes('email') ? 'This email already has a partner dashboard.' : 'Something went wrong. Please try again.' }, res.status === 409 ? 409 : 500);
  }
  const [partner] = await res.json();
  return json({ slug: partner.slug, promo_code: partner.promo_code });
}
