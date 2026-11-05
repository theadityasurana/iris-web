/**
 * Dodo webhook (Standard Webhooks). Writes only to the website's own tables,
 * web_subscriptions and web_billing_events; it never touches `profiles`, so
 * mobile subscriptions and credits are unaffected.
 */
import { CREDITS_PER_MONTH, MONTHS, db, json } from '../../_lib/dodo.js';

const MAX_AGE_SECONDS = 300;
const enc = new TextEncoder();

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verify(secret, id, timestamp, signatureHeader, rawBody, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret || !id || !timestamp || !signatureHeader) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > MAX_AGE_SECONDS) return false;
  const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${id}.${timestamp}.${rawBody}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return signatureHeader.split(' ').some(part => timingSafeEqual(part.split(',')[1] || '', expected));
}

/** Pure state transition, so it can be unit-tested. Returns the fields to write, or null to ignore. */
export function nextState(type, data, existing) {
  const meta = data.metadata || {};
  const plan = meta.plan;
  const period = meta.period;
  const base = {
    dodo_subscription_id: data.subscription_id,
    dodo_customer_id: data.customer?.customer_id ?? existing?.dodo_customer_id ?? null,
    current_period_end: data.next_billing_date ?? existing?.current_period_end ?? null,
    updated_at: new Date().toISOString(),
  };
  switch (type) {
    case 'subscription.active':
    case 'subscription.renewed': {
      if (!CREDITS_PER_MONTH[plan] || !MONTHS[period]) return null;
      const grant = CREDITS_PER_MONTH[plan] * MONTHS[period];
      // A repeat event for a period already granted must not refill credits.
      const samePeriod = existing?.dodo_subscription_id === data.subscription_id && existing?.current_period_end === data.next_billing_date;
      return { ...base, plan, period, status: 'active', credits_limit: grant, credits_remaining: samePeriod ? existing.credits_remaining : grant };
    }
    case 'subscription.on_hold':
    case 'subscription.past_due':
    case 'subscription.paused':
    case 'subscription.failed':
      return { ...base, status: 'on_hold' };
    case 'subscription.cancelled':
      // Access continues until the paid period ends.
      return { ...base, status: 'cancelled' };
    case 'subscription.expired':
      return { ...base, status: 'expired', credits_remaining: 0 };
    default:
      return null;
  }
}

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  const id = request.headers.get('webhook-id');
  const ok = await verify(env.DODO_PAYMENTS_WEBHOOK_KEY, id, request.headers.get('webhook-timestamp'), request.headers.get('webhook-signature'), raw);
  if (!ok) return json({ error: 'invalid signature' }, 401);

  let event;
  try { event = JSON.parse(raw); } catch { return json({ error: 'bad json' }, 400); }
  const data = event.data || {};
  const userId = data.metadata?.user_id;
  if (!userId || data.metadata?.source !== 'iris-web') return json({ ignored: true });

  // Each delivery is processed once; Dodo retries are answered with 200.
  const seen = await db(env, 'web_billing_events', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({ webhook_id: id, event_type: event.type, user_id: userId, payload: event }),
  });
  if (!seen.ok) { console.error('event insert failed', seen.status); return json({ error: 'retry' }, 500); }
  if ((await seen.json()).length === 0) return json({ duplicate: true });

  const rowRes = await db(env, `web_subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=*`);
  const [existing] = rowRes.ok ? await rowRes.json() : [];
  const next = nextState(event.type, data, existing);
  if (!next) return json({ ignored: true });

  const write = await db(env, 'web_subscriptions?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, ...next }),
  });
  if (!write.ok) {
    // Forget the delivery so Dodo's retry is processed rather than dropped.
    await db(env, `web_billing_events?webhook_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    console.error('subscription write failed', write.status);
    return json({ error: 'retry' }, 500);
  }
  return json({ ok: true });
}
