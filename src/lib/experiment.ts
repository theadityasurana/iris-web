/**
 * "Pay after the first application" experiment (website only).
 *   paywall: the onboarding application is free, then the paywall (same rule as Africa)
 *   control: the usual free swipes
 * Settings come from the nextquark dashboard via /api/experiment; null = not in the test.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@web/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

export type Variant = 'paywall' | 'control';
type Settings = { enabled: boolean; percent: number; run: string; forceAll?: boolean };

const ANON_KEY = 'iris_exp_paywall';

export async function fetchExperimentSettings(): Promise<Settings> {
  try {
    const r = await fetch('/api/experiment');
    return r.ok ? await r.json() : { enabled: false, percent: 0, run: '' };
  } catch { return { enabled: false, percent: 0, run: '' }; }
}

function readAnon(run: string): Variant | null {
  try {
    const v = JSON.parse(localStorage.getItem(ANON_KEY) || 'null');
    return v?.run === run && (v.variant === 'paywall' || v.variant === 'control') ? v.variant : null;
  } catch { return null; }
}

/** Before sign-up: pick (once per run) which promise this visitor sees. */
export function useAnonVariant() {
  return useQuery({
    queryKey: ['exp-anon'],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<Variant | null> => {
      const s = await fetchExperimentSettings();
      if (s.forceAll) return 'paywall';
      if (!s.enabled || !s.run) return null;
      const saved = readAnon(s.run);
      if (saved) return saved;
      const variant: Variant = Math.random() * 100 < s.percent ? 'paywall' : 'control';
      try { localStorage.setItem(ANON_KEY, JSON.stringify({ run: s.run, variant })); } catch { /* private mode */ }
      return variant;
    },
  });
}

async function post(body: Record<string, unknown>): Promise<Variant | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  const r = await fetch('/api/experiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const out = r.ok ? await r.json().catch(() => ({})) : {};
  return out.variant === 'paywall' || out.variant === 'control' ? out.variant : null;
}

export const experimentQuery = (userId: string) => ({
  queryKey: ['exp-variant', userId],
  staleTime: 10 * 60_000,
  queryFn: async (): Promise<Variant | null> => {
    let hint: Variant | null = null;
    try { hint = JSON.parse(localStorage.getItem(ANON_KEY) || 'null')?.variant ?? null; } catch { /* ignore */ }
    return post(hint ? { hint } : {}).catch(() => null);
  },
});

/** This user's group (null = normal free swipes). */
export function useExperimentVariant() {
  const { userId } = useAuth();
  return useQuery({ ...experimentQuery(userId ?? ''), enabled: !!userId });
}

/** Records the first time someone reaches the upgrade page (for the funnel). */
export function markPaywallSeen() {
  void post({ event: 'paywall_seen' }).catch(() => {});
}

/**
 * Records (or reads) the signed-in user's group right away, given their access token.
 * Called before a new profile row is created, so the welcome email webhook already
 * knows the group. Never holds things up for more than 2 seconds.
 */
export async function assignVariantNow(token: string): Promise<Variant | null> {
  let hint: Variant | null = null;
  try { hint = JSON.parse(localStorage.getItem(ANON_KEY) || 'null')?.variant ?? null; } catch { /* ignore */ }
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2000);
    const r = await fetch('/api/experiment', {
      method: 'POST', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(hint ? { hint } : {}),
    });
    clearTimeout(t);
    const out = r.ok ? await r.json().catch(() => ({})) : {};
    return out.variant === 'paywall' || out.variant === 'control' ? out.variant : null;
  } catch { return null; }
}
