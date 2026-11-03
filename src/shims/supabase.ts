/**
 * Browser build of lib/supabase.ts — same project, same anon key, so a user
 * signs into the exact account they use in the app. Sessions persist in
 * localStorage and OAuth / password-recovery redirects are picked up from the URL.
 */
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';
export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHVqeHBhaHpscGVnempqcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTI2NjIsImV4cCI6MjA4NzMyODY2Mn0.OyjX0Qg4UlDPfTmCwhdK3JuE30698f6A-a01LunhDtM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'iris-web-auth',
  },
});

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
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session;
  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed.session?.user ? refreshed.session : null;
}

export async function handleStaleSession(): Promise<void> {
  const session = await tryRecoverSupabaseSession().catch(() => null);
  if (!session) await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
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
