import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { nextState, verify, profileUpdate } from '../../functions/api/dodo/webhook.js';

const secret = 'whsec_' + Buffer.from('test-secret-bytes').toString('base64');
const sign = (id, ts, body) => 'v1,' + createHmac('sha256', Buffer.from('test-secret-bytes')).update(`${id}.${ts}.${body}`).digest('base64');
const now = 1_800_000_000;

test('accepts a valid signature', async () => {
  assert.equal(await verify(secret, 'm1', String(now), sign('m1', now, '{}'), '{}', now), true);
});
test('accepts when one of several signatures matches', async () => {
  assert.equal(await verify(secret, 'm1', String(now), `v1,bad ${sign('m1', now, '{}')}`, '{}', now), true);
});
test('rejects a tampered body', async () => {
  assert.equal(await verify(secret, 'm1', String(now), sign('m1', now, '{}'), '{"x":1}', now), false);
});
test('rejects an old timestamp', async () => {
  assert.equal(await verify(secret, 'm1', String(now - 301), sign('m1', now - 301, '{}'), '{}', now), false);
});
test('rejects when the secret is missing', async () => {
  assert.equal(await verify('', 'm1', String(now), 'v1,abc', '{}', now), false);
});

const data = { subscription_id: 's1', next_billing_date: '2026-12-05T00:00:00Z', customer: { customer_id: 'c1' }, metadata: { plan: 'pro', period: 'quarterly' } };
test('activation grants credits for the whole period', () => {
  const s = nextState('subscription.active', data, null);
  assert.equal(s.credits_remaining, 600);
  assert.equal(s.status, 'active');
});
test('repeat event for the same period does not refill', () => {
  const s = nextState('subscription.active', data, { dodo_subscription_id: 's1', current_period_end: data.next_billing_date, credits_remaining: 12 });
  assert.equal(s.credits_remaining, 12);
});
test('renewal into a new period refills', () => {
  const s = nextState('subscription.renewed', data, { dodo_subscription_id: 's1', current_period_end: '2026-09-05T00:00:00Z', credits_remaining: 12 });
  assert.equal(s.credits_remaining, 600);
});
test('cancel keeps credits; expiry clears them', () => {
  assert.equal('credits_remaining' in nextState('subscription.cancelled', data, null), false);
  assert.equal(nextState('subscription.expired', data, null).credits_remaining, 0);
});
test('unknown plan and unknown event are ignored', () => {
  assert.equal(nextState('subscription.active', { ...data, metadata: { plan: 'x', period: 'monthly' } }, null), null);
  assert.equal(nextState('payment.succeeded', data, null), null);
});

// --- profiles mirror ---
const T = Date.parse('2026-11-09T12:00:00Z');
const webData = { subscription_id: 's1', created_at: '2026-11-09T11:20:00Z', next_billing_date: '2026-12-09T11:20:48Z', metadata: { plan: 'pro', period: 'monthly', region: 'IN' } };
const freeProfile = { subscription_type: 'free', subscription_status: null, subscription_end_date: null };

test('activation marks a free profile premium without touching credits', () => {
  const p = profileUpdate('subscription.active', webData, freeProfile, null, T);
  assert.equal(p.subscription_type, 'premium');
  assert.equal(p.subscription_plan, 'pro');
  assert.equal(p.billing_period, 'monthly');
  assert.equal(p.subscription_status, 'active');
  assert.equal(p.subscription_end_date, webData.next_billing_date);
  assert.equal(p.subscription_start_date, webData.created_at);
  assert.equal(p.pricing_region, 'IN');
  assert.equal(p.iris_enabled, true);
  assert.equal('applications_remaining' in p, false);
  assert.equal('applications_limit' in p, false);
});
test('renewal keeps the original start date', () => {
  const prof = { subscription_type: 'premium', subscription_status: 'active', subscription_start_date: '2026-11-09T11:20:00Z', subscription_end_date: '2026-12-09T11:20:48Z' };
  const p = profileUpdate('subscription.renewed', { ...webData, next_billing_date: '2027-01-09T11:20:48Z' }, prof, { current_period_end: '2026-12-09T11:20:48+00:00' }, T);
  assert.equal('subscription_start_date' in p, false);
  assert.equal(p.subscription_end_date, '2027-01-09T11:20:48Z');
});
test('a live Play subscription is never overridden', () => {
  const play = { subscription_type: 'premium', subscription_status: 'active', subscription_end_date: '2026-11-30T00:00:00Z', google_play_purchase_token: 'tok' };
  assert.equal(profileUpdate('subscription.active', webData, play, null, T), null);
});
test('a lapsed Play subscription is replaced by the web plan', () => {
  const lapsed = { subscription_type: 'free', subscription_status: 'expired', subscription_end_date: '2026-10-01T00:00:00Z', google_play_purchase_token: 'tok' };
  assert.equal(profileUpdate('subscription.active', webData, lapsed, null, T).subscription_type, 'premium');
});
test('cancel / hold / expiry only touch a web-owned profile', () => {
  const owned = { subscription_type: 'premium', subscription_status: 'active', subscription_end_date: '2026-12-09T11:20:48Z' };
  const web = { current_period_end: '2026-12-09T11:20:48+00:00' };
  assert.deepEqual(profileUpdate('subscription.cancelled', webData, owned, web, T), { subscription_status: 'cancelled' });
  assert.deepEqual(profileUpdate('subscription.on_hold', webData, owned, web, T), { subscription_status: 'payment_failed' });
  assert.deepEqual(profileUpdate('subscription.expired', webData, owned, web, T), { subscription_type: 'free', subscription_status: 'expired', iris_enabled: false });
  const play = { ...owned, subscription_end_date: '2026-11-30T00:00:00Z', google_play_purchase_token: 'tok' };
  assert.equal(profileUpdate('subscription.expired', webData, play, web, T), null);
  assert.equal(profileUpdate('subscription.cancelled', webData, play, web, T), null);
});
test('missing profile or unknown plan is ignored', () => {
  assert.equal(profileUpdate('subscription.active', webData, undefined, null, T), null);
  assert.equal(profileUpdate('subscription.active', { ...webData, metadata: { plan: 'x', period: 'monthly' } }, freeProfile, null, T), null);
});

const trial = { subscription_id: 't1', next_billing_date: '2026-11-28T00:00:00Z', customer: { customer_id: 'c1' }, metadata: { plan: 'trial', period: 'biweekly', region: 'IN' } };
test('trial grants 30 credits per 14-day cycle', () => {
  const s = nextState('subscription.active', trial, null);
  assert.equal(s.credits_remaining, 30);
  assert.equal(s.plan, 'trial');
  assert.equal(s.period, 'biweekly');
});
test('trial with a wrong period is ignored', () => {
  assert.equal(nextState('subscription.active', { ...trial, metadata: { plan: 'trial', period: 'monthly' } }, null), null);
});
test('trial mirrors onto profiles as a plan the app knows', () => {
  const out = profileUpdate('subscription.active', trial, { subscription_type: 'free' }, null);
  assert.equal(out.subscription_plan, 'starter');
  assert.equal(out.billing_period, 'monthly');
  assert.equal(out.subscription_type, 'premium');
});
