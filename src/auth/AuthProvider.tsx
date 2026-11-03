/**
 * Web auth — the same Supabase project, profiles table and row shapes as the
 * mobile app (row mapping is shared via lib/profile-mapping), so one account
 * works on both. Native-only providers are replaced by their OAuth redirect
 * flows: Google and LinkedIn today, Apple once its Services ID is configured.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, getStorageUrl } from '@/lib/supabase';
import { mapDbToUserProfile, profileUpdateToDb, onboardingProfileRow, upsertOnboardingProfileWithVerify, welcomeEmailRow, stripNullBytes } from '@/lib/profile-mapping';
import { getOrCreateProxyEmail } from '@/lib/resend';
import { sanitizeError } from '@/utils/sanitizeError';
import type { UserProfile } from '@/types';
import { defaultOnboardingData, type OnboardingData } from '@/types/onboarding';

export type OAuthProvider = 'google' | 'linkedin_oidc' | 'apple';

/** Apple web sign-in needs a Services ID + secret in Supabase; flip on once set. */
export const APPLE_WEB_ENABLED = false;

const SWIPED_KEY = 'iris_web_swiped_jobs';
export const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://irisjobs.live';

type Result = { success: boolean; error?: string };

interface AuthValue {
  isLoading: boolean;
  session: Session | null;
  userId: string | null;
  email: string;
  profile: UserProfile | null;
  /** Raw profiles row, for fields UserProfile does not carry (credits, plan…). */
  profileRow: Record<string, any> | null;
  isOnboardingComplete: boolean;
  onboardingData: OnboardingData;
  swipedJobIds: string[];
  signInWithEmail(email: string, password: string): Promise<Result>;
  signUpWithEmail(email: string, password: string, name: string): Promise<Result>;
  signInWithOAuth(provider: OAuthProvider, next?: string): Promise<Result>;
  resetPassword(email: string): Promise<Result>;
  updatePassword(password: string): Promise<Result>;
  saveProfile(partial: Partial<UserProfile>): Promise<boolean>;
  uploadAvatar(file: File): Promise<string | null>;
  uploadResume(file: File): Promise<string | null>;
  addSwipedJobId(jobId: string): void;
  saveOnboardingProgress(partial: Partial<OnboardingData>): void;
  completeOnboarding(data: OnboardingData, files: { avatar?: File | null; resume?: File | null }): Promise<void>;
  refetchProfile(): Promise<void>;
  logout(): Promise<void>;
  deleteAccount(): Promise<Result>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

function readLocalSwiped(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${SWIPED_KEY}:${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeLocalSwiped(userId: string, ids: string[]) {
  try { localStorage.setItem(`${SWIPED_KEY}:${userId}`, JSON.stringify(ids.slice(-500))); } catch { /* quota */ }
}

const safeExt = (name: string, fallback: string) => (name.split('.').pop() || fallback).toLowerCase().replace(/[^a-z0-9]/g, '') || fallback;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profileRow, setProfileRow] = useState<Record<string, any> | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [swipedJobIds, setSwipedJobIds] = useState<string[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(defaultOnboardingData);
  const userIdRef = useRef<string | null>(null);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = session?.user.id ?? null;

  const applyRow = useCallback((row: Record<string, any> | null, uid: string) => {
    setProfileRow(row);
    setProfile(row ? mapDbToUserProfile(row, uid) : null);
    if (row?.onboarding_data && typeof row.onboarding_data === 'object') {
      setOnboardingData({ ...defaultOnboardingData, ...row.onboarding_data });
    }
    const server = Array.isArray(row?.swiped_job_ids) ? (row!.swiped_job_ids as string[]) : [];
    const local = readLocalSwiped(uid);
    setSwipedJobIds(Array.from(new Set([...server, ...local])));
  }, []);

  /** Load (or, for a brand-new account, create) the profiles row. */
  const loadProfile = useCallback(async (s: Session) => {
    const uid = s.user.id;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (userIdRef.current !== uid) return;
    if (data) { applyRow(data, uid); return; }
    if (error && error.code !== 'PGRST116') {
      // Transient failure: keep whatever we had rather than treating the user as new.
      return;
    }
    const name: string = s.user.user_metadata?.full_name || s.user.user_metadata?.name || '';
    const parts = name.split(' ');
    const newRow = {
      id: uid,
      email: s.user.email || '',
      full_name: name,
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || '',
      is_onboarding_complete: false,
      applications_remaining: 10,
      applications_limit: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error: insertErr } = await supabase.from('profiles').insert(newRow);
    if (insertErr && !insertErr.message.toLowerCase().includes('duplicate')) {
      if (insertErr.message.includes('foreign key constraint')) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        return;
      }
    }
    const { data: created } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (userIdRef.current === uid) applyRow(created ?? newRow, uid);
  }, [applyRow]);

  useEffect(() => {
    let cancelled = false;
    const handle = async (s: Session | null) => {
      if (cancelled) return;
      setSession(s);
      if (!s) {
        userIdRef.current = null;
        setProfile(null);
        setProfileRow(null);
        setSwipedJobIds([]);
        setOnboardingData(defaultOnboardingData);
        setIsLoading(false);
        return;
      }
      const isNewUser = userIdRef.current !== s.user.id;
      userIdRef.current = s.user.id;
      if (isNewUser) {
        setIsLoading(true);
        await loadProfile(s).catch(() => {});
      }
      if (!cancelled) setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => handle(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Deferred: supabase-js holds its auth lock while listeners run.
      setTimeout(() => { void handle(s); }, 0);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const refetchProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) await loadProfile(data.session);
  }, [loadProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<Result> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { success: false, error: sanitizeError(error.message) };
    return { success: true };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string): Promise<Result> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    if (error) return { success: false, error: sanitizeError(error.message) };
    if (!data.user) return { success: false, error: 'Sign up failed. Please try again.' };
    if (!data.session) return { success: false, error: 'Check your inbox to verify your email, then sign in.' };
    return { success: true };
  }, []);

  const signInWithOAuth = useCallback(async (provider: OAuthProvider, next = '/app/jobs'): Promise<Result> => {
    const redirectTo = `${APP_ORIGIN}/app/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) return { success: false, error: sanitizeError(error.message) };
    return { success: true };
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<Result> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${APP_ORIGIN}/app/reset-password`,
    });
    if (error) return { success: false, error: sanitizeError(error.message) };
    return { success: true };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<Result> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: sanitizeError(error.message) };
    return { success: true };
  }, []);

  const saveProfile = useCallback(async (partial: Partial<UserProfile>): Promise<boolean> => {
    if (!userId) return false;
    const dbData = profileUpdateToDb(partial);
    let { error } = await supabase.from('profiles').upsert({ id: userId, ...dbData });
    if (error) {
      const { experience_level: _a, desired_role_categories: _b, ...safe } = dbData;
      ({ error } = await supabase.from('profiles').upsert({ id: userId, ...safe }));
      if (error) return false;
    }
    setProfile(prev => (prev ? { ...prev, ...partial } : prev));
    setProfileRow(prev => (prev ? { ...prev, ...dbData } : prev));
    return true;
  }, [userId]);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!userId) return null;
    const ext = safeExt(file.name, 'jpg');
    const path = `${userId}/avatar_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('profile-pictures').upload(path, file, { contentType: file.type || `image/${ext}`, upsert: true });
    if (error) return null;
    await supabase.from('profiles').upsert({ id: userId, avatar_url: path, updated_at: new Date().toISOString() });
    await refetchProfile();
    return path;
  }, [userId, refetchProfile]);

  const uploadResume = useCallback(async (file: File): Promise<string | null> => {
    if (!userId) return null;
    const base = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${base}_${Date.now()}`;
    const { error } = await supabase.storage.from('resumes').upload(path, file, {
      contentType: file.type || (base.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
      upsert: true,
    });
    if (error) return null;
    const { data } = supabase.storage.from('resumes').getPublicUrl(path);
    await supabase.from('profiles').upsert({ id: userId, resume_url: data.publicUrl, updated_at: new Date().toISOString() });
    setProfile(prev => (prev ? { ...prev, resumeUrl: data.publicUrl } : prev));
    return data.publicUrl;
  }, [userId]);

  const addSwipedJobId = useCallback((jobId: string) => {
    if (!userId) return;
    setSwipedJobIds(prev => {
      if (prev.includes(jobId)) return prev;
      const next = [...prev, jobId];
      writeLocalSwiped(userId, next);
      supabase.rpc('append_swiped_job_id', { user_id: userId, job_id: jobId }).then(({ error }) => {
        if (error) {
          supabase.from('profiles').upsert({ id: userId, swiped_job_ids: next, updated_at: new Date().toISOString() }).then(() => {});
        }
      });
      return next;
    });
  }, [userId]);

  const saveOnboardingProgress = useCallback((partial: Partial<OnboardingData>) => {
    setOnboardingData(prev => {
      const next = { ...prev, ...partial };
      if (userId) {
        if (progressTimer.current) clearTimeout(progressTimer.current);
        progressTimer.current = setTimeout(() => {
          supabase.from('profiles').upsert(stripNullBytes({ id: userId, onboarding_data: next, updated_at: new Date().toISOString() })).then(() => {});
        }, 1500);
      }
      return next;
    });
  }, [userId]);

  const completeOnboarding = useCallback(async (data: OnboardingData, files: { avatar?: File | null; resume?: File | null }) => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) throw new Error('Your session expired. Please sign in again to finish setup.');

    let avatarUrl: string | null = profileRow?.avatar_url ?? null;
    if (files.avatar) {
      const ext = safeExt(files.avatar.name, 'jpg');
      const path = `${uid}/avatar_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('profile-pictures').upload(path, files.avatar, { contentType: files.avatar.type || `image/${ext}`, upsert: true });
      if (!error) avatarUrl = path;
    }

    let resumeUrl: string | null = data.resumeUri && data.resumeUri.startsWith('http') ? data.resumeUri : null;
    if (files.resume) {
      const name = files.resume.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${uid}/${name}`;
      const { error } = await supabase.storage.from('resumes').upload(path, files.resume, {
        contentType: files.resume.type || (name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        upsert: true,
      });
      if (!error) resumeUrl = getStorageUrl('resumes', path);
    }

    const fullName = `${data.firstName} ${data.lastName}`.trim();
    let email = profileRow?.email || sess.session?.user.email || '';
    if (fullName) {
      const proxy = await getOrCreateProxyEmail(uid, fullName).catch(() => null);
      if (proxy) email = proxy;
    }

    const row = onboardingProfileRow(uid, { ...data, resumeUri: resumeUrl }, { email, avatarUrl, resumeUrl });
    const saved = await upsertOnboardingProfileWithVerify(uid, row);

    supabase.functions.invoke('prefetch-jobs', { body: { user_id: uid } }).catch(() => {});
    if (email.endsWith('@nextquark.in')) {
      await supabase.from('inbound_emails').insert(welcomeEmailRow(uid, email, data.firstName, data.lastName)).then(() => {}, () => {});
    }

    const { data: fresh } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    applyRow(fresh ?? saved, uid);
  }, [profileRow, applyRow]);

  const clearLocal = useCallback(() => {
    queryClient.clear();
    setProfile(null);
    setProfileRow(null);
    setSwipedJobIds([]);
    setOnboardingData(defaultOnboardingData);
  }, [queryClient]);

  const logout = useCallback(async () => {
    const timeout = new Promise(r => setTimeout(r, 4000));
    await Promise.race([supabase.auth.signOut(), timeout]).catch(() => {});
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    clearLocal();
  }, [clearLocal]);

  const deleteAccount = useCallback(async (): Promise<Result> => {
    let serverError: string | undefined;
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error) serverError = error.message;
      else if (data?.error || data?.success === false) serverError = data.error || 'Account deletion did not complete';
    } catch (e: any) {
      serverError = e?.message || 'Could not reach the server';
    }
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    clearLocal();
    return serverError ? { success: false, error: serverError } : { success: true };
  }, [clearLocal]);

  const value = useMemo<AuthValue>(() => ({
    isLoading,
    session,
    userId,
    email: session?.user.email ?? '',
    profile,
    profileRow,
    isOnboardingComplete: profileRow?.is_onboarding_complete === true,
    onboardingData,
    swipedJobIds,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    saveProfile,
    uploadAvatar,
    uploadResume,
    addSwipedJobId,
    saveOnboardingProgress,
    completeOnboarding,
    refetchProfile,
    logout,
    deleteAccount,
  }), [isLoading, session, userId, profile, profileRow, onboardingData, swipedJobIds, signInWithEmail, signUpWithEmail, signInWithOAuth, resetPassword, updatePassword, saveProfile, uploadAvatar, uploadResume, addSwipedJobId, saveOnboardingProgress, completeOnboarding, refetchProfile, logout, deleteAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
