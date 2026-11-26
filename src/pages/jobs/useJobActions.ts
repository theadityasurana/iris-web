/**
 * Apply / skip / save — the same order of operations as the app's swipe
 * handler: charge first (paid credit or free swipe), and only a charged swipe
 * becomes a live_application_queue row.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@web/auth/AuthProvider';
import { useApplications, useEntitlements, useFreeSwipes } from '@web/lib/queries';
import { REGION_QUERY, africaAllowanceQuery, useAfricaAllowance, useRegion, useWebPlan, webPlanUsable } from '@web/lib/webBilling';
import { AF_FREE_APPLICATIONS } from '@/lib/billing';
import { supabase } from '@/lib/supabase';
import { canApply } from '@/lib/entitlements';
import { decrementApplicationCount } from '@/lib/subscription';
import { useDailySwipe as consumeFreeSwipe } from '@/lib/daily-swipes';
import { addToLiveApplicationQueue, fetchUserApplications, incrementRightSwipe, saveJob } from '@/lib/jobs';
import { FIRST_APPLY_EVENT, type FirstApplyDetail } from '@web/pages/jobs/FirstApplyShow';
import type { Job } from '@/types';

export type ApplyOutcome = 'applied' | 'no-credits' | 'failed';

const firstApplyKey = (userId: string) => `iris_first_apply_seen_${userId}`;

/** True only for someone with no earlier applications, once per device. */
async function isFirstApplication(userId: string, cached: unknown[] | undefined) {
  try {
    if (localStorage.getItem(firstApplyKey(userId))) return false;
    const earlier = cached ?? await fetchUserApplications(userId);
    localStorage.setItem(firstApplyKey(userId), '1');
    return earlier.length === 0;
  } catch { return false; }
}

export function useJobActions() {
  const { userId, profile, addSwipedJobId } = useAuth();
  const entitlements = useEntitlements();
  const { data: free } = useFreeSwipes();
  const qc = useQueryClient();
  const navigate = useNavigate();
  // Out of swipes/credits: the outcome page first; its buttons lead to /app/plans.
  const goToPlans = () => navigate('/app/upgrade');

  const freeLeft = free?.remaining ?? 0;
  const { data: webPlan } = useWebPlan();
  const webCredits = webPlanUsable(webPlan) ? webPlan.credits_remaining : 0;
  const { data: region } = useRegion();
  const paying = webCredits > 0 || entitlements.usesCredits;
  const { data: cachedApps } = useApplications();
  // Africa (website only): a free user gets the onboarding application plus earned credits, then must pay.
  const { data: allowance = AF_FREE_APPLICATIONS } = useAfricaAllowance(region === 'AF');
  const africaLocked = region === 'AF' && !paying && (cachedApps?.length ?? 0) >= allowance;

  const apply = useCallback(async (job: Job): Promise<ApplyOutcome> => {
    if (!userId || !profile) return 'failed';
    if (webCredits <= 0 && !canApply(entitlements, freeLeft)) { goToPlans(); return 'no-credits'; }
    if (!paying) {
      const r = region ?? await qc.fetchQuery(REGION_QUERY).catch(() => 'INTL');
      if (r === 'AF') {
        // Always read fresh: the cached list can lag right after the onboarding application.
        const earlier = await fetchUserApplications(userId).catch(() => cachedApps ?? []);
        const limit = await qc.fetchQuery(africaAllowanceQuery(userId)).catch(() => AF_FREE_APPLICATIONS);
        if (earlier.length >= limit) { goToPlans(); return 'no-credits'; }
      }
    }

    // Website credits are spent first and live in their own table.
    let charged = false;
    if (webCredits > 0) {
      const { data, error } = await supabase.rpc('consume_web_credit');
      charged = !error && data === true;
      qc.invalidateQueries({ queryKey: ['web-plan', userId] });
    }
    if (!charged && canApply(entitlements, freeLeft)) {
      charged = entitlements.usesCredits ? await decrementApplicationCount(userId) : await consumeFreeSwipe(userId);
    }
    qc.invalidateQueries({ queryKey: ['subscription-status', userId] });
    qc.invalidateQueries({ queryKey: ['daily-swipes', userId] });
    if (!charged) { goToPlans(); return 'no-credits'; }

    const first = await isFirstApplication(userId, qc.getQueryData<unknown[]>(['user-applications', userId]));
    addSwipedJobId(job.id);
    incrementRightSwipe(job.id).catch(() => {});
    const ok = await addToLiveApplicationQueue(userId, job, profile);
    qc.invalidateQueries({ queryKey: ['user-applications', userId] });
    if (ok && first) {
      const detail: FirstApplyDetail = { title: job.jobTitle, company: job.companyName, logo: job.companyLogo, website: job.companyWebsite, portalUrl: job.portalUrl };
      window.dispatchEvent(new CustomEvent(FIRST_APPLY_EVENT, { detail }));
    }
    return ok ? 'applied' : 'failed';
  }, [userId, profile, entitlements, freeLeft, webCredits, paying, region, cachedApps, addSwipedJobId, qc]);

  const skip = useCallback((job: Job) => { addSwipedJobId(job.id); }, [addSwipedJobId]);

  const save = useCallback(async (job: Job) => {
    addSwipedJobId(job.id);
    if (!userId) return false;
    const ok = await saveJob(userId, job.id);
    qc.invalidateQueries({ queryKey: ['saved-jobs', userId] });
    return ok;
  }, [userId, addSwipedJobId, qc]);

  /** Same pre-check apply() runs first; lets the UI skip the applying animation when it would just open the paywall. */
  const hasCredits = (webCredits > 0 || canApply(entitlements, freeLeft)) && !africaLocked;

  return { apply, hasCredits, skip, save, entitlements, freeLeft, freeResetAt: free?.resetAt ?? 0 };
}
