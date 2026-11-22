import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdmin, netFromLedger, partnerStats, slugify, SLUG_RE } from '../../functions/_lib/referrals.js';
import { cleanFields } from '../../functions/api/referrals/admin.js';

const NOW = Date.parse('2026-11-22T00:00:00Z');
const day = n => new Date(NOW - n * 86400000).toISOString();
const sales = {
  discounts: [{ id: 'dsc_a', code: 'PRIYA20', timesUsed: 4 }, { id: 'dsc_b', code: 'RAHUL', timesUsed: 1 }],
  subscriptions: [
    { id: 's1', createdAt: day(1), status: 'active', plan: 'pro', period: 'monthly', region: 'IN', discountIds: ['dsc_a'] },
    { id: 's2', createdAt: day(10), status: 'cancelled', plan: 'starter', period: 'monthly', region: 'IN', discountIds: ['dsc_a'] },
    { id: 's3', createdAt: day(40), status: 'active', plan: 'pro', period: 'quarterly', region: 'INTL', discountIds: ['dsc_a'] },
    { id: 's4', createdAt: day(2), status: 'failed', plan: 'pro', period: 'monthly', region: 'IN', discountIds: ['dsc_a'] },
    { id: 's5', createdAt: day(2), status: 'active', plan: 'ultra', period: 'monthly', region: 'IN', discountIds: ['dsc_b'] },
    { id: 's6', createdAt: day(2), status: 'active', plan: 'ultra', period: 'monthly', region: 'IN', discountIds: [] },
  ],
  payments: [
    { subscriptionId: 's1', createdAt: day(1), amount: 49900, currency: 'INR', netUsd: 500 },
    { subscriptionId: 's3', createdAt: day(40), amount: 2499, currency: 'USD', netUsd: 2300 },
    { subscriptionId: 's3', createdAt: day(10), amount: 2499, currency: 'USD', netUsd: 2300 },
    { subscriptionId: 's3', createdAt: day(0), amount: 2499, currency: 'USD', netUsd: null },
    { subscriptionId: 's2', createdAt: day(10), amount: 19900, currency: 'INR', refund: 'full', netUsd: 200 },
    { subscriptionId: 's5', createdAt: day(2), amount: 99900, currency: 'INR', netUsd: 1000 },
  ],
};

test('counts only bought subscriptions carrying the code', () => {
  const s = partnerStats({ promo_code: 'priya20', commission_percent: 25, paid_out_cents: 300 }, sales, NOW);
  assert.equal(s.discountFound, true);
  assert.equal(s.buyers, 3);
  assert.equal(s.active, 2);
  assert.equal(s.last7, 1);
  assert.equal(s.last30, 2);
  assert.deepEqual(s.byPlan, { pro: 2, starter: 1 });
  assert.deepEqual(s.revenue, { INR: 49900, USD: 7497 });
  assert.equal(s.netCents, 5100);
  assert.equal(s.unsettled, 1);
  assert.equal(s.earnedCents, 1275);
  assert.equal(s.dueCents, 975);
  assert.equal(s.recent.find(r => r.status === 'cancelled').earnedCents, 0);
  assert.equal(s.recent[0].plan, 'pro');
  assert.equal(s.recent.length, 3);
});

test('unknown code yields zeros and a flag', () => {
  const s = partnerStats({ promo_code: 'NOPE', commission_percent: 20 }, sales, NOW);
  assert.equal(s.discountFound, false);
  assert.equal(s.buyers, 0);
});

test('admin key must match exactly and must be configured', () => {
  const req = k => new Request('https://x', { headers: k ? { 'X-Admin-Key': k } : {} });
  assert.equal(isAdmin(req('secret'), { REFERRAL_ADMIN_KEY: 'secret' }), true);
  assert.equal(isAdmin(req('secreT'), { REFERRAL_ADMIN_KEY: 'secret' }), false);
  assert.equal(isAdmin(req(''), {}), false);
  assert.equal(isAdmin(req('x'), {}), false);
});

test('slugify makes a valid unguessable slug', () => {
  const s = slugify('Priya Sharma!');
  assert.match(s, /^priya-sharma-[a-z0-9]+$/);
  assert.ok(SLUG_RE.test(s));
});

test('cleanFields validates and normalises', () => {
  assert.deepEqual(cleanFields({ name: ' Priya ', promo_code: ' priya20 ', slug: 'Priya-X' }, { partial: false }).fields, { name: 'Priya', promo_code: 'PRIYA20', slug: 'priya-x' });
  assert.ok(cleanFields({ name: 'P', promo_code: 'bad code' }, { partial: false }).error);
  assert.ok(cleanFields({ name: 'P', promo_code: 'OK', slug: '-x' }, { partial: false }).error);
  assert.deepEqual(cleanFields({ active: false }, { partial: true }).fields, { active: false });
});

test('net from ledger = payment - tax - fees, in USD', () => {
  assert.equal(netFromLedger([
    { is_credit: false, usd_equivalent_amount: 71 },
    { is_credit: false, usd_equivalent_amount: 138 },
    { is_credit: true, usd_equivalent_amount: 905 },
  ]), 696);
  assert.equal(netFromLedger([]), null);
});

test('share and paid amounts are validated', () => {
  assert.deepEqual(cleanFields({ commission_percent: '22.5', paid_out: '10.004' }, { partial: true }).fields, { commission_percent: 22.5, paid_out_cents: 1000 });
  assert.ok(cleanFields({ commission_percent: 120 }, { partial: true }).error);
  assert.ok(cleanFields({ paid_out: -1 }, { partial: true }).error);
});
