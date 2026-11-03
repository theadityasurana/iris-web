import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';

export const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';
export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHVqeHBhaHpscGVnempqcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTI2NjIsImV4cCI6MjA4NzMyODY2Mn0.OyjX0Qg4UlDPfTmCwhdK3JuE30698f6A-a01LunhDtM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    lock: Platform.OS === 'web'
      ? async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => await fn()
      : undefined,
  },
});

/** Supabase RN: refresh tokens only while the app is in the foreground. */
if (Platform.OS !== 'web') {
  supabase.auth.startAutoRefresh();
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export function isFatalAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = String((error as { message?: string }).message || '').toLowerCase();
  const status = (error as { status?: number }).status;
  if (status === 401) return true;
  return (
    msg.includes('refresh token not found') ||
    msg.includes('invalid refresh token') ||
    msg.includes('session not found') ||
    msg.includes('user not found')
  );
}

export async function tryRecoverSupabaseSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (session?.user) return session;
  if (error && !isFatalAuthError(error)) return null;
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshed.session?.user) return refreshed.session;
  if (refreshError && isFatalAuthError(refreshError)) return null;
  return null;
}

/**
 * Handle stale / invalid refresh tokens gracefully.
 *
 * Only signs out when the refresh token is definitively invalid — not on
 * transient network errors or while AsyncStorage is still hydrating on iOS.
 */
export async function handleStaleSession(): Promise<void> {
  try {
    const session = await tryRecoverSupabaseSession();
    if (session?.user) return;

    const { error } = await supabase.auth.getSession();
    if (!error) return;

    if (!isFatalAuthError(error)) {
      if (__DEV__) console.log('[SUPABASE] Session check skipped (non-fatal):', error.message);
      return;
    }

    if (__DEV__) console.log('[SUPABASE] Stale session detected, signing out. Error:', error.message);
    await supabase.auth.signOut({ scope: 'local' });
  } catch (e: unknown) {
    if (isFatalAuthError(e)) {
      if (__DEV__) console.log('[SUPABASE] Invalid refresh token caught, forcing sign-out');
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (_) {}
    }
  }
}

export function getStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function getStorageUploadUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
}

export function getProfilePictureUrl(avatarPath: string): string {
  if (avatarPath.startsWith('http')) return avatarPath;
  return getStorageUrl('profile-pictures', avatarPath);
}

export function getCompanyLogoStorageUrl(logoPath: string): string {
  if (logoPath.startsWith('http')) return logoPath;
  return getStorageUrl('company-logos', logoPath);
}
