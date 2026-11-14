/**
 * Dodo webhook (Standard Webhooks). Credits live only in the website's own
 * tables, web_subscriptions and web_billing_events. The plan's status is also
 * mirrored onto `profiles` (subscription_type / plan / status / dates), which
 * is what the app's paid-access gates, the admin dashboard and the upgrade
 * alert read. That mirror never touches profile credits (the web adds its own
 * on top) and never overrides a live Google Play / Razorpay subscription.
 */
import { creditsFor, db, json } from '../../_lib/dodo.js';

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
      const grant = creditsFor(plan, period);
      if (!grant) return null;
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

const RENEWAL_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

/** Same rule as the app's hasPaidAccess() / SQL has_paid_access(). */
export function hasPaidAccess(p, now = Date.now()) {
  if (p?.subscription_type !== 'premium') return false;
  const status = p.subscription_status || null;
  const end = p.subscription_end_date ? new Date(p.subscription_end_date).getTime() : null;
  if (status === 'cancelled') return end !== null && end > now;
  if (status === null || status === 'active' || status === 'grace_period') return end === null || end + RENEWAL_GRACE_MS > now;
  return false;
}

const sameInstant = (a, b) => !!a && !!b && new Date(a).getTime() === new Date(b).getTime();

/**
 * Pure: the `profiles` fields to write for this event, or null to leave the
 * profile alone. `existing` is the web_subscriptions row before this event.
 */
export function profileUpdate(type, data, profile, existing, now = Date.now()) {
  if (!profile) return null;
  const meta = data.metadata || {};
  const otherStore = !!(profile.google_play_purchase_token || profile.razorpay_subscription_id);
  // The profile's paid state came from the web if its end date is the one we last wrote.
  const webOwned = sameInstant(profile.subscription_end_date, existing?.current_period_end);

  switch (type) {
    case 'subscription.active':
    case 'subscription.renewed': {
      if (!creditsFor(meta.plan, meta.period)) return null;
      if (otherStore && hasPaidAccess(profile, now) && !webOwned) return null;
      // The app only knows starter/pro/ultra and monthly/quarterly, so the trial
      // is mirrored as Starter monthly. Its real plan lives in web_subscriptions.
      const trial = meta.plan === 'trial';
      const out = {
        subscription_type: 'premium',
        subscription_plan: trial ? 'starter' : meta.plan,
        billing_period: trial ? 'monthly' : meta.period,
        subscription_status: 'active',
        subscription_end_date: data.next_billing_date ?? null,
        iris_enabled: true,
      };
      // Keep the original start date across renewals.
      if (profile.subscription_type !== 'premium' || !profile.subscription_start_date) {
        out.subscription_start_date = data.previous_billing_date || data.created_at || new Date(now).toISOString();
      }
      if (meta.region === 'IN' || meta.region === 'INTL') out.pricing_region = meta.region;
      return out;
    }
    case 'subscription.cancelled':
      // Auto-renew off: access runs until the paid period ends.
      return webOwned ? { subscription_status: 'cancelled' } : null;
    case 'subscription.on_hold':
    case 'subscription.past_due':
    case 'subscription.paused':
    case 'subscription.failed':
      return webOwned ? { subscription_status: 'payment_failed' } : null;
    case 'subscription.expired':
      return webOwned ? { subscription_type: 'free', subscription_status: 'expired', iris_enabled: false } : null;
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

  // Forget the delivery so Dodo's retry is processed rather than dropped.
  const retry = async (what, status) => {
    await db(env, `web_billing_events?webhook_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    console.error(`${what} failed`, status);
    return json({ error: 'retry' }, 500);
  };

  const profRes = await db(env, `profiles?id=eq.${encodeURIComponent(userId)}&select=subscription_type,subscription_status,subscription_start_date,subscription_end_date,google_play_purchase_token,razorpay_subscription_id`);
  if (!profRes.ok) return retry('profile read', profRes.status);
  const [profile] = await profRes.json();

  const write = await db(env, 'web_subscriptions?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, ...next }),
  });
  if (!write.ok) return retry('subscription write', write.status);

  const prof = profileUpdate(event.type, data, profile, existing);
  if (prof) {
    const pw = await db(env, `profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(prof),
    });
    // A retry re-runs the web_subscriptions upsert harmlessly: the same period never refills credits.
    if (!pw.ok) return retry('profile write', pw.status);
  }
  return json({ ok: true });
}
