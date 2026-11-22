/**
 * Influencer referral tracking. Partners (name, promo code, private URL slug)
 * live in web_referral_partners. Sales come straight from Dodo: every
 * subscription records the discount it was bought with, and each discount has
 * a code, so a partner's buyers are the subscriptions carrying their code.
 */
import { dodo, db, json } from './dodo.js';

const CACHE_KEY = 'https://irisjobs.live/__cache/referral-sales-v1';
const CACHE_SECONDS = 60;
const PAGE_SIZE = 100;
const MAX_PAGES = 50;
/** Subscriptions that never got a first successful payment are not purchases. */
const NOT_BOUGHT = new Set(['pending', 'failed']);
const DAY = 24 * 60 * 60 * 1000;

export const normCode = c => String(c || '').trim().toUpperCase();
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;

export function slugify(name) {
  const base = String(name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'partner';
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)), b => b.toString(36).padStart(2, '0')).join('').slice(0, 5);
  return `${base}-${rand}`;
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** The admin page sends the password in X-Admin-Key. No key configured means no admin access at all. */
export function isAdmin(request, env) {
  const key = env.REFERRAL_ADMIN_KEY;
  return !!key && safeEqual(request.headers.get('X-Admin-Key') || '', key);
}

async function listAll(env, path) {
  const out = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const res = await dodo(env, `${path}${sep}page_size=${PAGE_SIZE}&page_number=${page}`);
    if (!res.ok) throw new Error(`dodo ${path} ${res.status}`);
    const { items = [] } = await res.json();
    out.push(...items);
    if (items.length < PAGE_SIZE) break;
  }
  return out;
}

/** product_id -> { plan, period, region }, read from the DODO_PRODUCT_* env vars. */
function productMap(env) {
  const map = {};
  for (const [k, v] of Object.entries(env)) {
    const m = /^DODO_PRODUCT_([A-Z]+)_([A-Z]+)_([A-Z]+)$/.exec(k);
    if (m && typeof v === 'string') map[v] = { plan: m[1].toLowerCase(), period: m[2].toLowerCase(), region: m[3] };
  }
  return map;
}

/** Discounts, subscriptions and payments from Dodo, cached for a minute so public pages can't hammer the API. */
export async function loadSales(env, { fresh = false } = {}) {
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  if (cache && !fresh) {
    const hit = await cache.match(CACHE_KEY);
    if (hit) return hit.json();
  }
  const [discounts, subscriptions, payments] = await Promise.all([
    listAll(env, '/discounts'),
    listAll(env, '/subscriptions'),
    listAll(env, '/payments?status=succeeded'),
  ]);
  const products = productMap(env);
  const data = {
    fetchedAt: new Date().toISOString(),
    discounts: discounts.map(d => ({ id: d.discount_id, code: normCode(d.code), timesUsed: d.times_used ?? 0, type: d.type, amount: d.amount })),
    subscriptions: subscriptions.map(s => {
      const meta = s.metadata || {};
      const prod = products[s.product_id] || {};
      const ids = new Set([s.discount_id, ...(s.discounts || []).map(d => d.discount_id)].filter(Boolean));
      return {
        id: s.subscription_id,
        createdAt: s.created_at,
        status: s.status,
        plan: meta.plan || prod.plan || null,
        period: meta.period || prod.period || null,
        region: meta.region || prod.region || null,
        discountIds: [...ids],
      };
    }),
    payments: payments.map(p => ({ subscriptionId: p.subscription_id || p.subscription_ids?.[0] || null, amount: p.total_amount || 0, currency: p.currency, refund: p.refund_status || null })),
  };
  if (cache) {
    await cache.put(CACHE_KEY, new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${CACHE_SECONDS}` } }));
  }
  return data;
}

/** Pure: one partner's numbers from the sales snapshot. */
export function partnerStats(code, sales, now = Date.now()) {
  const discount = sales.discounts.find(d => d.code === normCode(code));
  const empty = { discountFound: !!discount, timesUsed: discount?.timesUsed ?? 0, buyers: 0, active: 0, last7: 0, last30: 0, byPlan: {}, revenue: {}, recent: [], monthly: [] };
  if (!discount) return empty;

  const subs = sales.subscriptions
    .filter(s => s.discountIds.includes(discount.id) && !NOT_BOUGHT.has(s.status))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const subIds = new Set(subs.map(s => s.id));
  const stats = { ...empty, buyers: subs.length };
  const months = {};
  for (const s of subs) {
    const t = new Date(s.createdAt).getTime();
    if (s.status === 'active') stats.active++;
    if (now - t <= 7 * DAY) stats.last7++;
    if (now - t <= 30 * DAY) stats.last30++;
    const plan = s.plan || 'other';
    stats.byPlan[plan] = (stats.byPlan[plan] || 0) + 1;
    const m = s.createdAt?.slice(0, 7);
    if (m) months[m] = (months[m] || 0) + 1;
  }
  for (const p of sales.payments) {
    if (!subIds.has(p.subscriptionId) || p.refund === 'full') continue;
    stats.revenue[p.currency] = (stats.revenue[p.currency] || 0) + p.amount;
  }
  stats.monthly = Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
  stats.recent = subs.slice(0, 50).map(s => ({ date: s.createdAt, plan: s.plan, period: s.period, region: s.region, status: s.status }));
  return stats;
}

export async function listPartners(env, query = '') {
  const res = await db(env, `web_referral_partners?select=*&order=created_at.asc${query}`);
  if (!res.ok) throw new Error(`partners read ${res.status}`);
  return res.json();
}

export const serverError = (what, err) => {
  console.error(what, err?.message || err);
  return json({ error: 'Something went wrong loading referral data. Try again in a minute.' }, 502);
};
