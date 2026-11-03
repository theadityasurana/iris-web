/**
 * What each plan unlocks — one table for every screen, the sandbox plan test
 * (scripts/plan-tests/plan-sandbox.ts) and, by mirror, the server
 * (has_paid_access() / consume_application_credit() in SQL, iris-auto-apply,
 * livekit-token).
 *
 *            Swipes                     Iris auto-apply   AI interviews   Resumes
 *   free     10 free per 30-day cycle   —                 —               1
 *   starter  75 credits / month         ✓                 —               3
 *   pro      200 credits / month        ✓                 10 / month      5
 *   ultra    500 credits / month        ✓                 10 / month      5
 *
 * Quarterly plans get the same monthly credits every month. A plan only counts
 * while hasPaidAccess() holds (active / grace / cancelled-in-term); a lapsed
 * one is free — `lapsedPlan` remembers what it was so the UI can say so.
 */
import type { PlanId } from '@/lib/billing';
import type { SubscriptionData } from '@/lib/subscription';

export const PLAN_FEATURES: Record<PlanId, { creditsPerMonth: number; iris: boolean; interviewsPerMonth: number; resumes: number }> = {
  free: { creditsPerMonth: 0, iris: false, interviewsPerMonth: 0, resumes: 1 },
  starter: { creditsPerMonth: 75, iris: true, interviewsPerMonth: 0, resumes: 3 },
  pro: { creditsPerMonth: 200, iris: true, interviewsPerMonth: 10, resumes: 5 },
  ultra: { creditsPerMonth: 500, iris: true, interviewsPerMonth: 10, resumes: 5 },
};

export interface Entitlements {
  plan: PlanId;
  paid: boolean;
  /** Right swipes come out of paid credits (else the free cycle). */
  usesCredits: boolean;
  creditsRemaining: number;
  iris: boolean;
  interviewsPerMonth: number;
  resumes: number;
  /** A paid plan that has run out (end date passed / payment failed). */
  lapsedPlan: PlanId | null;
  lapsedOn: string | null;
}

export function entitlementsFor(sub: SubscriptionData | null | undefined): Entitlements {
  const paid = sub?.subscription_type === 'premium';
  const plan: PlanId = paid ? (sub!.subscription_plan || 'pro') : 'free';
  const f = PLAN_FEATURES[plan] ?? PLAN_FEATURES.free;
  return {
    plan,
    paid,
    usesCredits: paid,
    creditsRemaining: paid ? Math.max(0, sub?.credits_remaining ?? 0) : 0,
    iris: paid && f.iris,
    interviewsPerMonth: paid ? f.interviewsPerMonth : 0,
    resumes: f.resumes,
    lapsedPlan: sub?.lapsed_plan ?? null,
    lapsedOn: sub?.lapsed_plan ? sub?.subscription_end_date ?? null : null,
  };
}

/** Can the user right-swipe (apply) now? Free users pass their free-cycle count. */
export function canApply(e: Entitlements, freeSwipesLeft: number): boolean {
  return e.usesCredits ? e.creditsRemaining > 0 : freeSwipesLeft > 0;
}
