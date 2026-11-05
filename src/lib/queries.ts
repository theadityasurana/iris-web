/**
 * React Query hooks over the app's own lib/ functions. Query keys match the
 * app's where one exists, so invalidation reads the same.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@web/auth/AuthProvider';
import { getSubscriptionStatus, getTransactionHistory } from '@/lib/subscription';
import { entitlementsFor } from '@/lib/entitlements';
import { getDailySwipes } from '@/lib/daily-swipes';
import { fetchUserApplications, scanEmailsForInterviews, scanEmailsForOtp } from '@/lib/jobs';
import { subscribeToMailChanges } from '@/lib/resend';
import { refreshRemoteConfig } from '@/lib/remote-config';
import { supabase } from '@/lib/supabase';
import type { Application, ApplicationStatus, DbApplicationRow } from '@/types';

export function useSubscription() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['subscription-status', userId],
    queryFn: () => getSubscriptionStatus(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useEntitlements() {
  const { data } = useSubscription();
  return entitlementsFor(data);
}

export function useFreeSwipes() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['daily-swipes', userId],
    queryFn: () => getDailySwipes(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useTransactions() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => getTransactionHistory(userId!, 30),
    enabled: !!userId,
  });
}

/** Applications as the app renders them (same mapping as the Applications tab). */
export function mapApplication(app: DbApplicationRow & Record<string, any>): Application & { raw: Record<string, any> } {
  return {
    id: app.id,
    appliedDate: app.created_at,
    status: (app.status || 'pending') as ApplicationStatus,
    lastActivity: app.updated_at || app.created_at,
    interviewDate: app.interview_date || null,
    interviewTime: app.interview_time || null,
    meetingLink: app.meeting_link || null,
    meetingPlatform: app.meeting_platform as Application['meetingPlatform'],
    verificationOtp: app.verification_otp || null,
    otpReceivedAt: app.otp_received_at || null,
    appliedByIris: app.applied_by === 'iris',
    job: {
      id: app.job_id,
      jobTitle: app.job_title,
      companyName: app.company_name,
      companyLogo: app.company_logo_url || '',
      location: app.location || '',
    } as unknown as Application['job'],
    raw: app,
  };
}

export function useApplications() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['user-applications', userId],
    staleTime: 3 * 60_000,
    enabled: !!userId,
    queryFn: async () => {
      await Promise.all([scanEmailsForOtp(userId!), scanEmailsForInterviews(userId!)]).catch(() => {});
      const rows = await fetchUserApplications(userId!);
      return rows.map(mapApplication);
    },
  });
}

/** Unread mail count, kept live with the same realtime channel the app uses. */
export function useUnreadMail() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['unread-mail', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from('inbound_emails')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('is_read', false);
      return count ?? 0;
    },
  });
  useEffect(() => {
    if (!userId) return;
    return subscribeToMailChanges(userId, () => {
      qc.invalidateQueries({ queryKey: ['unread-mail', userId] });
      qc.invalidateQueries({ queryKey: ['mail'] });
    });
  }, [userId, qc]);
  return q.data ?? 0;
}

/** Remote config (feed tuning, limits, logo providers) — same table the app reads. */
export function useRemoteConfigBootstrap() {
  useEffect(() => { refreshRemoteConfig(true).catch(() => {}); }, []);
}

export interface FeaturedCompany { name: string; logoUrl: string | null; website: string | null; openJobs: number }

/**
 * Companies to follow. Uses HEAD counts, so no job rows are downloaded, and is
 * cached for a day on the device to keep Supabase egress low.
 */
export function useFeaturedCompanies(limit = 12) {
  return useQuery({
    queryKey: ['featured-companies', limit],
    staleTime: 24 * 60 * 60_000,
    gcTime: 7 * 24 * 60 * 60_000,
    queryFn: async (): Promise<FeaturedCompany[]> => {
      const { data } = await supabase.from('companies').select('name, logo_url, website').not('logo_url', 'is', null).order('name').limit(limit * 4);
      const pool = (data ?? []).slice(0, limit * 2);
      const counted = await Promise.all(pool.map(async (c: any) => {
        const { count } = await supabase.from('jobs').select('id', { count: 'estimated', head: true }).eq('company_name', c.name);
        return { name: c.name as string, logoUrl: c.logo_url as string | null, website: c.website as string | null, openJobs: count ?? 0 };
      }));
      return counted.filter(c => c.openJobs > 0).sort((a, b) => b.openJobs - a.openJobs).slice(0, limit);
    },
  });
}
