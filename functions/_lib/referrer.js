/** Looks up who owns a referral code. Only ever exposes a first name, as the invite page does. */
const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHVqeHBhaHpscGVnempqcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTI2NjIsImV4cCI6MjA4NzMyODY2Mn0.OyjX0Qg4UlDPfTmCwhdK3JuE30698f6A-a01LunhDtM';

export const INVITE_REWARD = 5;

/** Codes are letters and digits. Anything else is not a code, and never reaches the database. */
export function normalizeCode(raw) {
  const code = decodeURIComponent(String(raw ?? '')).trim().toUpperCase();
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : null;
}

export const firstName = row => String(row?.first_name || row?.full_name || '').trim().split(/\s+/)[0] || '';

export async function findReferrer(code) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?referral_code=eq.${code}&select=first_name,full_name&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, signal: AbortSignal.timeout(4000),
  });
  const [row] = res.ok ? await res.json() : [];
  return row ? { name: firstName(row) } : null;
}
