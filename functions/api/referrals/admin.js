/**
 * Admin API for influencer referrals. Every request needs X-Admin-Key equal to
 * the REFERRAL_ADMIN_KEY secret.
 *   GET            leaderboard: every partner with stats, plus Dodo codes nobody owns yet
 *   POST           add a partner { name, promo_code, slug?, notes? }
 *   PATCH          edit a partner { id, name?, promo_code?, slug?, notes?, active? }
 *   DELETE ?id=    remove a partner (the Dodo code is untouched)
 */
import { db, json } from '../../_lib/dodo.js';
import { SLUG_RE, isAdmin, listPartners, loadSales, normCode, partnerStats, serverError, slugify } from '../../_lib/referrals.js';

const deny = () => json({ error: 'Wrong admin password.' }, 401);

export async function onRequestGet({ request, env }) {
  if (!isAdmin(request, env)) return deny();
  try {
    const fresh = new URL(request.url).searchParams.get('fresh') === '1';
    const [partners, sales] = await Promise.all([listPartners(env), loadSales(env, { fresh })]);
    const owned = new Set(partners.map(p => p.promo_code));
    return json({
      updatedAt: sales.fetchedAt,
      partners: partners.map(p => ({ ...p, stats: partnerStats(p, sales) })),
      unassignedCodes: sales.discounts.filter(d => !owned.has(d.code)).map(d => ({ code: d.code, timesUsed: d.timesUsed })),
    });
  } catch (err) {
    return serverError('referral admin load', err);
  }
}

/** Validates and normalises editable fields. Returns { fields } or { error }. */
export function cleanFields(body, { partial }) {
  const out = {};
  if (!partial || 'name' in body) {
    const name = String(body.name || '').trim();
    if (!name || name.length > 80) return { error: 'Give the influencer a name (up to 80 characters).' };
    out.name = name;
  }
  if (!partial || 'promo_code' in body) {
    const code = normCode(body.promo_code);
    if (!/^[A-Z0-9_-]{2,64}$/.test(code)) return { error: 'Promo code can only use letters, numbers, - and _.' };
    out.promo_code = code;
  }
  if ('slug' in body && body.slug) {
    const slug = String(body.slug).trim().toLowerCase();
    if (!SLUG_RE.test(slug)) return { error: 'URL must be 3-64 characters: lowercase letters, numbers and dashes.' };
    out.slug = slug;
  } else if (!partial) {
    out.slug = slugify(out.name);
  }
  if ('commission_percent' in body && body.commission_percent !== '' && body.commission_percent !== undefined) {
    const pct = Number(body.commission_percent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return { error: 'Revenue share must be between 0 and 100%.' };
    out.commission_percent = Math.round(pct * 100) / 100;
  }
  if ('paid_out' in body && body.paid_out !== '' && body.paid_out !== undefined) {
    const usd = Number(body.paid_out);
    if (!Number.isFinite(usd) || usd < 0) return { error: 'Paid so far must be a positive dollar amount.' };
    out.paid_out_cents = Math.round(usd * 100);
  }
  if ('notes' in body) out.notes = body.notes ? String(body.notes).slice(0, 500) : null;
  if ('active' in body) out.active = !!body.active;
  return { fields: out };
}

async function writeResult(res) {
  if (res.ok) return json({ partner: (await res.json())[0] });
  const text = await res.text();
  if (res.status === 409 || text.includes('duplicate key')) {
    return json({ error: text.includes('slug') ? 'That URL is already taken.' : 'That promo code already belongs to another influencer.' }, 409);
  }
  console.error('partner write failed', res.status, text);
  return json({ error: 'Could not save. Try again.' }, 500);
}

async function readBody(request) {
  try { return (await request.json()) || {}; } catch { return null; }
}

export async function onRequestPost({ request, env }) {
  if (!isAdmin(request, env)) return deny();
  const body = await readBody(request);
  if (!body) return json({ error: 'Invalid request.' }, 400);
  const { fields, error } = cleanFields(body, { partial: false });
  if (error) return json({ error }, 400);
  return writeResult(await db(env, 'web_referral_partners', {
    method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(fields),
  }));
}

export async function onRequestPatch({ request, env }) {
  if (!isAdmin(request, env)) return deny();
  const body = await readBody(request);
  if (!body?.id) return json({ error: 'Invalid request.' }, 400);
  const { fields, error } = cleanFields(body, { partial: true });
  if (error) return json({ error }, 400);
  return writeResult(await db(env, `web_referral_partners?id=eq.${encodeURIComponent(body.id)}`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(fields),
  }));
}

export async function onRequestDelete({ request, env }) {
  if (!isAdmin(request, env)) return deny();
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Invalid request.' }, 400);
  const res = await db(env, `web_referral_partners?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
  return res.ok ? json({ ok: true }) : json({ error: 'Could not delete.' }, 500);
}
