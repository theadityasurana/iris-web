/**
 * Website-only billing (Dodo Payments). Independent of the app's Apple/Google
 * subscriptions: it has its own table and credits. The webhook mirrors only the
 * plan status onto `profiles`, never credits (functions/api/dodo/webhook.js).
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@web/auth/AuthProvider';
import { useEntitlements, useFreeSwipes } from '@web/lib/queries';
import { supabase } from '@/lib/supabase';
import { freeSwipesPerCycle } from '@/lib/daily-swipes';
import { getPlanDisplayName } from '@/lib/subscription';

export interface WebPlan {
  plan: 'starter' | 'pro' | 'ultra' | 'trial';
  period: 'monthly' | 'quarterly' | 'biweekly';
  status: 'active' | 'on_hold' | 'cancelled' | 'expired';
  credits_remaining: number;
  credits_limit: number;
  current_period_end: string | null;
}

/** Trial gets Starter's features; its credits come from its own 14-day cycle. */
export const webPlanTier = (plan: WebPlan['plan']): 'starter' | 'pro' | 'ultra' => (plan === 'trial' ? 'starter' : plan);
export const webPlanName = (plan: WebPlan['plan']) => (plan === 'trial' ? 'Trial' : getPlanDisplayName(plan));
export const webPeriodName = (period: WebPlan['period']) => (period === 'biweekly' ? 'every 14 days' : period);

export function webPlanUsable(p: WebPlan | null | undefined): p is WebPlan {
  if (!p || (p.status !== 'active' && p.status !== 'cancelled')) return false;
  return !p.current_period_end || new Date(p.current_period_end).getTime() > Date.now();
}

export function useWebPlan() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['web-plan', userId],
    enabled: !!userId,
    staleTime: 60_000,
    // Before the billing table exists this simply returns no plan.
    queryFn: async (): Promise<WebPlan | null> => {
      const { data, error } = await supabase.from('web_subscriptions').select('plan, period, status, credits_remaining, credits_limit, current_period_end').eq('user_id', userId!).maybeSingle();
      return error ? null : (data as WebPlan | null);
    },
  });
}

export function useCredits() {
  const ent = useEntitlements();
  const { data: free } = useFreeSwipes();
  const { data: web } = useWebPlan();
  const webLeft = webPlanUsable(web) ? web.credits_remaining : 0;
  const base = ent.usesCredits ? ent.creditsRemaining : (free?.remaining ?? freeSwipesPerCycle());
  const paid = ent.usesCredits || webLeft > 0;
  return { left: base + webLeft, webLeft, noun: paid ? 'credits' : 'free applications' };
}

async function authedPost(path: string, body?: unknown): Promise<{ url: string }> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out.url) throw new Error(out.error || 'Something went wrong. Please try again.');
  return out;
}

export const startCheckout = (plan: string, period: string) => authedPost('/api/dodo/checkout', { plan, period });
export const openBillingPortal = () => authedPost('/api/dodo/portal');

export async function fetchRegion(): Promise<'IN' | 'INTL'> {
  try {
    const res = await fetch('/api/dodo/checkout');
    if (res.ok) { const { region } = await res.json(); if (region === 'IN' || region === 'INTL') return region; }
  } catch { /* fall through to the local guess */ }
  return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata' ? 'IN' : 'INTL';
}
