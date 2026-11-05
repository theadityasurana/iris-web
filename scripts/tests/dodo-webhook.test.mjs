import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { nextState, verify } from '../../functions/api/dodo/webhook.js';

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
