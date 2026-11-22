/**
 * Sample partner dashboard to show prospective influencers what they could
 * earn. Fictional person and illustrative numbers. Nothing here touches real
 * data, the database or the admin leaderboard. The page labels it as a sample.
 *
 * Purchases are generated from a fixed seed, so the totals never change;
 * dates are relative to today so the page always looks current.
 */
export const DEMO_SLUG = 'riya-malhotra-k4t9w';

const DEMO = { name: 'Riya Malhotra', promo_code: 'RIYA10', commissionPercent: 20, purchases: 146, paidCents: 52000, sinceDaysAgo: 158 };

const PRICES = {
  IN: { starter: { monthly: 499, quarterly: 1199 }, pro: { monthly: 999, quarterly: 2399 }, ultra: { monthly: 2199, quarterly: 5999 } },
  INTL: { starter: { monthly: 19.99, quarterly: 47.99 }, pro: { monthly: 39.99, quarterly: 95.99 }, ultra: { monthly: 59.99, quarterly: 143.99 } },
};
const DAY = 24 * 60 * 60 * 1000;

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, options) => {
  let x = r() * options.reduce((n, [, w]) => n + w, 0);
  for (const [v, w] of options) if ((x -= w) <= 0) return v;
  return options[0][0];
};

/** Net USD cents for one purchase with the 10% code: price minus tax (India GST) and payment fees. */
function netCents(region, plan, period) {
  const price = PRICES[region][plan][period] * 0.9;
  if (region === 'IN') {
    const usd = price / 84;
    return Math.round((usd - (usd * 18) / 118 - (0.06 * usd + 0.2)) * 100);
  }
  return Math.round((price - (0.05 * price + 0.2)) * 100);
}

export function demoStats(now = Date.now()) {
  const r = rng(7);
  const share = c => Math.round((c * DEMO.commissionPercent) / 100);
  const purchases = [];
  for (let i = 0; i < DEMO.purchases; i++) {
    const region = pick(r, [['IN', 62], ['INTL', 38]]);
    const plan = pick(r, [['starter', 30], ['pro', 52], ['ultra', 18]]);
    const period = pick(r, [['monthly', 70], ['quarterly', 30]]);
    // Skewed towards recent days, so the monthly chart grows like a channel picking up.
    const daysAgo = Math.floor(Math.pow(r(), 1.6) * (DEMO.sinceDaysAgo - 3));
    const status = pick(r, daysAgo < 30 ? [['active', 95], ['cancelled', 5]] : [['active', 72], ['cancelled', 22], ['expired', 6]]);
    const minutes = Math.floor(r() * 24 * 60);
    purchases.push({ date: new Date(now - daysAgo * DAY - minutes * 60000).toISOString(), plan, period, region, status, earnedCents: share(netCents(region, plan, period)) });
  }
  purchases.sort((a, b) => new Date(b.date) - new Date(a.date));

  const byPlan = {};
  const months = {};
  let earned = 0;
  for (const p of purchases) {
    byPlan[p.plan] = (byPlan[p.plan] || 0) + 1;
    const m = p.date.slice(0, 7);
    months[m] = months[m] || { count: 0, earnedCents: 0 };
    months[m].count++;
    months[m].earnedCents += p.earnedCents;
    earned += p.earnedCents;
  }
  const within = d => purchases.filter(p => now - new Date(p.date).getTime() <= d * DAY).length;
  return {
    sample: true,
    name: DEMO.name,
    promo_code: DEMO.promo_code,
    since: new Date(now - DEMO.sinceDaysAgo * DAY).toISOString(),
    buyers: purchases.length,
    active: purchases.filter(p => p.status === 'active').length,
    last7: within(7),
    last30: within(30),
    byPlan,
    recent: purchases.slice(0, 50),
    monthly: Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v })),
    payments: purchases.length,
    unsettled: 0,
    commissionPercent: DEMO.commissionPercent,
    earnedCents: earned,
    paidCents: DEMO.paidCents,
    dueCents: Math.max(0, earned - DEMO.paidCents),
  };
}
