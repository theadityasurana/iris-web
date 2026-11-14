/** Shared helpers for the website-only Dodo Payments functions. Secrets live in Cloudflare env vars. */
// Public values, the same ones the browser client ships with.
const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHVqeHBhaHpscGVnempqcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTI2NjIsImV4cCI6MjA4NzMyODY2Mn0.OyjX0Qg4UlDPfTmCwhdK3JuE30698f6A-a01LunhDtM';

export const CREDITS_PER_MONTH = { starter: 75, pro: 200, ultra: 500 };
export const MONTHS = { monthly: 1, quarterly: 3 };
/** Trial: its own recurring plan, 30 applications every 14 days. */
export const TRIAL_CREDITS = 30;

/** Credits granted for one billing cycle, or 0 for an unknown plan/period pair. */
export function creditsFor(plan, period) {
  if (plan === 'trial') return period === 'biweekly' ? TRIAL_CREDITS : 0;
  return CREDITS_PER_MONTH[plan] && MONTHS[period] ? CREDITS_PER_MONTH[plan] * MONTHS[period] : 0;
}

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

export const dodoBase = env => (env.DODO_ENV === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com');

export async function dodo(env, path, init = {}) {
  return fetch(dodoBase(env) + path, {
    ...init,
    headers: { Authorization: `Bearer ${env.DODO_PAYMENTS_API_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

/** Resolves the signed-in user from their Supabase token. The body is never trusted for identity. */
export async function requireUser(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: SUPABASE_ANON_KEY } });
  if (!res.ok) return null;
  const user = await res.json();
  return user?.id ? user : null;
}

export function db(env, path, init = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

export const regionOf = request => (request.cf?.country === 'IN' ? 'IN' : 'INTL');
