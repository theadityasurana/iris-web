/**
 * Website-only billing (Dodo Payments). Independent of the app's Apple/Google
 * subscriptions: it has its own table and credits. The webhook mirrors only the
 * plan status onto `profiles`, never credits (functions/api/dodo/webhook.js).
 */
import { useQuery } from '@tanstack/react-query';
import { getPromoCode } from '@web/lib/promo';
import { useExperimentVariant } from '@web/lib/experiment';
import { useAuth } from '@web/auth/AuthProvider';
import { useApplications, useEntitlements, useFreeSwipes } from '@web/lib/queries';
import { supabase } from '@/lib/supabase';
import { freeSwipesPerCycle } from '@/lib/daily-swipes';
import { getPlanDisplayName } from '@/lib/subscription';
import { AF_FREE_APPLICATIONS, type WebPricingRegion } from '@/lib/billing';
import { rc } from '@/lib/remote-config';

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
  const { data: region } = useRegion();
  const { data: apps } = useApplications();
  const { data: variant } = useExperimentVariant();
  // Africa, and the "pay after first application" test group, share the same rule.
  const firstOnly = region === 'AF' || variant === 'paywall';
  const { data: allowance } = useAfricaAllowance(firstOnly);
  const webLeft = webPlanUsable(web) ? web.credits_remaining : 0;
  let base = ent.usesCredits ? ent.creditsRemaining : (free?.remaining ?? freeSwipesPerCycle());
  const paid = ent.usesCredits || webLeft > 0;
  // Africa: free users get the onboarding application plus any credits they earned, then pay.
  if (firstOnly && !paid) base = Math.min(base, Math.max(0, (allowance ?? AF_FREE_APPLICATIONS) - (apps?.length ?? 0)));
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

// A saved partner code (from /?code=…) is sent along so Dodo pre-applies it.
export const startCheckout = (plan: string, period: string) => authedPost('/api/dodo/checkout', { plan, period, promo: getPromoCode() });
export const openBillingPortal = () => authedPost('/api/dodo/portal');

export async function fetchRegion(): Promise<WebPricingRegion> {
  try {
    const res = await fetch('/api/dodo/checkout');
    if (res.ok) { const { region } = await res.json(); if (region === 'IN' || region === 'INTL' || region === 'AF') return region; }
  } catch { /* fall through to the local guess */ }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'IN';
  return tz.startsWith('Africa/') ? 'AF' : 'INTL';
}

export const REGION_QUERY = { queryKey: ['pricing-region'], queryFn: fetchRegion, staleTime: 60 * 60_000 } as const;

/** The visitor's pricing region, decided server-side from their IP (Cloudflare). */
export function useRegion() {
  return useQuery(REGION_QUERY);
}

/**
 * Africa (website only): free applications = the onboarding one + credits earned
 * from referrals and social follows. Read from existing columns; nothing is written.
 */
export async function fetchAfricaAllowance(userId: string): Promise<number> {
  const limits = rc('limits');
  const [{ data: p }, { count }] = await Promise.all([
    supabase.from('profiles').select('referral_swipes_earned, followed_instagram, followed_twitter, followed_linkedin').eq('id', userId).maybeSingle(),
    supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referee_id', userId),
  ]);
  const follows = p ? [p.followed_instagram, p.followed_twitter, p.followed_linkedin].filter(Boolean).length : 0;
  const earned = (p?.referral_swipes_earned ?? 0) + follows * (limits.social_follow_reward ?? 0) + ((count ?? 0) > 0 ? (limits.referral_reward_referee ?? 0) : 0);
  return AF_FREE_APPLICATIONS + Math.max(0, earned);
}

export const africaAllowanceQuery = (userId: string) => ({ queryKey: ['af-allowance', userId], queryFn: () => fetchAfricaAllowance(userId), staleTime: 60_000 });

export function useAfricaAllowance(enabled: boolean) {
  const { userId } = useAuth();
  return useQuery({ ...africaAllowanceQuery(userId ?? ''), enabled: enabled && !!userId });
}
