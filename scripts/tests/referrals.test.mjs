import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdmin, partnerStats, slugify, SLUG_RE } from '../../functions/_lib/referrals.js';
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
    { subscriptionId: 's1', amount: 49900, currency: 'INR' },
    { subscriptionId: 's3', amount: 2499, currency: 'USD' },
    { subscriptionId: 's3', amount: 2499, currency: 'USD' },
    { subscriptionId: 's2', amount: 19900, currency: 'INR', refund: 'full' },
    { subscriptionId: 's5', amount: 99900, currency: 'INR' },
  ],
};

test('counts only bought subscriptions carrying the code', () => {
  const s = partnerStats('priya20', sales, NOW);
  assert.equal(s.discountFound, true);
  assert.equal(s.buyers, 3);
  assert.equal(s.active, 2);
  assert.equal(s.last7, 1);
  assert.equal(s.last30, 2);
  assert.deepEqual(s.byPlan, { pro: 2, starter: 1 });
  assert.deepEqual(s.revenue, { INR: 49900, USD: 4998 });
  assert.equal(s.recent[0].plan, 'pro');
  assert.equal(s.recent.length, 3);
});

test('unknown code yields zeros and a flag', () => {
  const s = partnerStats('NOPE', sales, NOW);
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
