/**
 * Website A/B experiment: "pay after the first application" (group `paywall`) vs the usual
 * free swipes (group `control`). Settings live in web_experiments, edited from the
 * nextquark dashboard. Website-only: the mobile app never reads any of this.
 *
 *   GET   public settings { enabled, percent, run } (used before sign-up for the copy)
 *   POST  (signed in) { hint?, event? } -> { variant: 'paywall' | 'control' | null }
 *         Assigns the user once, for good. Only accounts created after the run started,
 *         outside Africa (which already has its own paywall). `hint` is the group the
 *         visitor saw before signing up, so the promise on the sign-up page holds.
 *         event: 'paywall_seen' stamps the first time they reached the upgrade page.
 *         With force_all on, everyone gets 'paywall' (assignments are not changed).
 */
import { db, json, regionOf, requireUser } from '../_lib/dodo.js';

const KEY = 'paywall_after_first';
const VARIANTS = new Set(['paywall', 'control']);

async function settings(env) {
  const res = await db(env, `web_experiments?key=eq.${KEY}&select=enabled,paywall_percent,run,started_at,force_all`);
  const rows = res.ok ? await res.json() : [];
  const s = rows[0];
  return s ? { enabled: !!s.enabled, percent: s.paywall_percent, run: s.run, startedAt: s.started_at, forceAll: !!s.force_all } : { enabled: false, percent: 0, run: '', startedAt: null, forceAll: false };
}

export async function onRequestGet({ env }) {
  const s = await settings(env).catch(() => ({ enabled: false, percent: 0, run: '' }));
  return json({ enabled: s.enabled, percent: s.percent, run: s.run, forceAll: s.forceAll }, 200, { 'Cache-Control': 'public, max-age=60' });
}

export async function onRequestPost({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Please sign in again.' }, 401);
  let body = {};
  try { body = await request.json(); } catch { /* empty body is fine */ }

  try {
    const s = await settings(env);
    const r = await db(env, `web_experiment_assignments?user_id=eq.${user.id}&experiment=eq.${KEY}&select=variant,run,paywall_seen_at`);
    const existing = r.ok ? (await r.json())[0] : null;

    if (body.event === 'paywall_seen' && existing && !existing.paywall_seen_at) {
      await db(env, `web_experiment_assignments?user_id=eq.${user.id}&experiment=eq.${KEY}`, {
        method: 'PATCH', body: JSON.stringify({ paywall_seen_at: new Date().toISOString() }),
      });
    }

    // "Everyone pays": the paywall rule for every website user, whatever their group.
    if (s.forceAll) return json({ variant: 'paywall' });
    // Switched off: everyone gets the normal free swipes (assignments are kept for the results).
    if (!s.enabled) return json({ variant: null });
    if (existing) return json({ variant: existing.run === s.run ? existing.variant : null });

    // Eligible: a new account (made after this run started) outside Africa.
    const created = Date.parse(user.created_at || '');
    const start = Date.parse(s.startedAt || '');
    const region = regionOf(request);
    if (!Number.isFinite(created) || !Number.isFinite(start) || created < start - 10 * 60 * 1000 || region === 'AF') {
      return json({ variant: null });
    }

    const variant = VARIANTS.has(body.hint) ? body.hint : (Math.random() * 100 < s.percent ? 'paywall' : 'control');
    await db(env, 'web_experiment_assignments', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify({ user_id: user.id, experiment: KEY, run: s.run, variant, region }),
    });
    return json({ variant });
  } catch (err) {
    console.error('experiment', err);
    return json({ variant: null });
  }
}
