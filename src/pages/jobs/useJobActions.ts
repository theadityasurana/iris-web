/**
 * Apply / skip / save — the same order of operations as the app's swipe
 * handler: charge first (paid credit or free swipe), and only a charged swipe
 * becomes a live_application_queue row.
 */
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@web/auth/AuthProvider';
import { useEntitlements, useFreeSwipes } from '@web/lib/queries';
import { useWebPlan, webPlanUsable } from '@web/lib/webBilling';
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
  const [outOfCredits, setOutOfCredits] = useState(false);

  const freeLeft = free?.remaining ?? 0;
  const { data: webPlan } = useWebPlan();
  const webCredits = webPlanUsable(webPlan) ? webPlan.credits_remaining : 0;

  const apply = useCallback(async (job: Job): Promise<ApplyOutcome> => {
    if (!userId || !profile) return 'failed';
    if (webCredits <= 0 && !canApply(entitlements, freeLeft)) { setOutOfCredits(true); return 'no-credits'; }

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
    if (!charged) { setOutOfCredits(true); return 'no-credits'; }

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
  }, [userId, profile, entitlements, freeLeft, webCredits, addSwipedJobId, qc]);

  const skip = useCallback((job: Job) => { addSwipedJobId(job.id); }, [addSwipedJobId]);

  const save = useCallback(async (job: Job) => {
    addSwipedJobId(job.id);
    if (!userId) return false;
    const ok = await saveJob(userId, job.id);
    qc.invalidateQueries({ queryKey: ['saved-jobs', userId] });
    return ok;
  }, [userId, addSwipedJobId, qc]);

  return { apply, skip, save, outOfCredits, setOutOfCredits, entitlements, freeLeft, freeResetAt: free?.resetAt ?? 0 };
}
