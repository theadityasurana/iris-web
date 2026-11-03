/**
 * Apply / skip / save — the same order of operations as the app's swipe
 * handler: charge first (paid credit or free swipe), and only a charged swipe
 * becomes a live_application_queue row.
 */
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@web/auth/AuthProvider';
import { useEntitlements, useFreeSwipes } from '@web/lib/queries';
import { canApply } from '@/lib/entitlements';
import { decrementApplicationCount } from '@/lib/subscription';
import { useDailySwipe as consumeFreeSwipe } from '@/lib/daily-swipes';
import { addToLiveApplicationQueue, incrementRightSwipe, saveJob } from '@/lib/jobs';
import type { Job } from '@/types';

export type ApplyOutcome = 'applied' | 'no-credits' | 'failed';

export function useJobActions() {
  const { userId, profile, addSwipedJobId } = useAuth();
  const entitlements = useEntitlements();
  const { data: free } = useFreeSwipes();
  const qc = useQueryClient();
  const [outOfCredits, setOutOfCredits] = useState(false);

  const freeLeft = free?.remaining ?? 0;

  const apply = useCallback(async (job: Job): Promise<ApplyOutcome> => {
    if (!userId || !profile) return 'failed';
    if (!canApply(entitlements, freeLeft)) { setOutOfCredits(true); return 'no-credits'; }

    const charged = entitlements.usesCredits
      ? await decrementApplicationCount(userId)
      : await consumeFreeSwipe(userId);
    qc.invalidateQueries({ queryKey: ['subscription-status', userId] });
    qc.invalidateQueries({ queryKey: ['daily-swipes', userId] });
    if (!charged) { setOutOfCredits(true); return 'no-credits'; }

    addSwipedJobId(job.id);
    incrementRightSwipe(job.id).catch(() => {});
    const ok = await addToLiveApplicationQueue(userId, job, profile);
    qc.invalidateQueries({ queryKey: ['user-applications', userId] });
    return ok ? 'applied' : 'failed';
  }, [userId, profile, entitlements, freeLeft, addSwipedJobId, qc]);

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
