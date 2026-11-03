import { supabase } from './supabase';
import { rc } from './remote-config';

/** Built-in allowance; the live value comes from remote config (limits.free_swipes_per_cycle). */
const FREE_MONTHLY_SWIPES = 10;

// Keep old export name for backward compat
const DAILY_SWIPES_LIMIT = FREE_MONTHLY_SWIPES;

/** Free swipes per cycle, as configured by the admin. */
export function freeSwipesPerCycle(): number {
  return rc('limits').free_swipes_per_cycle;
}

function cycleMs(): number {
  return Math.max(1, rc('limits').free_cycle_days) * 24 * 60 * 60 * 1000;
}

interface SwipeData {
  remaining: number;
  resetAt: string | null; // ISO timestamp when swipes reset (30 days from first use)
}

let cachedData: SwipeData | null = null;
let cachedUserId: string | null = null;

function isResetDue(resetAt: string | null): boolean {
  if (!resetAt) return false;
  return Date.now() >= new Date(resetAt).getTime();
}

async function fetchFromSupabase(userId: string): Promise<SwipeData> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('daily_swipes_remaining, daily_swipes_reset_at, applications_remaining')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { remaining: freeSwipesPerCycle(), resetAt: null };
    }

    let remaining = data.daily_swipes_remaining ?? data.applications_remaining ?? freeSwipesPerCycle();
    let resetAt = data.daily_swipes_reset_at ?? null;

    // If reset time has passed, grant fresh monthly swipes
    if (isResetDue(resetAt)) {
      remaining = freeSwipesPerCycle();
      resetAt = null;
      await supabase
        .from('profiles')
        .update({ daily_swipes_remaining: freeSwipesPerCycle(), daily_swipes_reset_at: null })
        .eq('id', userId);
    }

    const result = { remaining, resetAt };
    cachedData = result;
    cachedUserId = userId;
    return result;
  } catch {
    return cachedData || { remaining: freeSwipesPerCycle(), resetAt: null };
  }
}

export async function getDailySwipes(userId: string): Promise<{ remaining: number; resetAt: number }> {
  if (cachedData && cachedUserId === userId) {
    if (cachedData.resetAt && isResetDue(cachedData.resetAt)) {
      cachedData = null;
    } else {
      return {
        remaining: cachedData.remaining,
        resetAt: cachedData.resetAt ? new Date(cachedData.resetAt).getTime() : 0,
      };
    }
  }

  const data = await fetchFromSupabase(userId);
  return {
    remaining: data.remaining,
    resetAt: data.resetAt ? new Date(data.resetAt).getTime() : 0,
  };
}

/** Force refresh from Supabase (call after earning swipes) */
export async function refreshDailySwipesFromServer(userId: string): Promise<{ remaining: number; resetAt: number }> {
  cachedData = null;
  return getDailySwipes(userId);
}

/** Decrement a free swipe. Returns true if a free swipe was available. */
export async function useDailySwipe(userId: string): Promise<boolean> {
  // Server-side, row-locked decrement + cycle reset: race-free across fast swipes.
  const { data: rows, error } = await supabase.rpc('consume_free_swipe');
  if (!error) {
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row || row.remaining < 0) {
      cachedData = { remaining: 0, resetAt: row?.reset_at ?? cachedData?.resetAt ?? null };
      cachedUserId = userId;
      return false;
    }
    cachedData = { remaining: row.remaining, resetAt: row.reset_at };
    cachedUserId = userId;
    return true;
  }
  // PGRST202 / 42883: RPC not deployed yet — legacy client-side path below.
  if (error.code !== 'PGRST202' && error.code !== '42883') return false;

  const data = await fetchFromSupabase(userId);
  if (data.remaining <= 0) return false;

  const newRemaining = data.remaining - 1;
  // Start 30-day timer on first swipe use (when resetAt is null)
  const newResetAt = data.resetAt || new Date(Date.now() + cycleMs()).toISOString();

  await supabase
    .from('profiles')
    .update({
      daily_swipes_remaining: newRemaining,
      daily_swipes_reset_at: newResetAt,
      applications_remaining: newRemaining,
    })
    .eq('id', userId);

  cachedData = { remaining: newRemaining, resetAt: newResetAt };
  cachedUserId = userId;
  return true;
}

/** Add bonus swipes (called when referral/social swipes are earned) */
export async function addBonusDailySwipes(userId: string, count: number): Promise<void> {
  const data = await fetchFromSupabase(userId);
  const newRemaining = data.remaining + count;

  await supabase
    .from('profiles')
    .update({ daily_swipes_remaining: newRemaining, applications_remaining: newRemaining })
    .eq('id', userId);

  cachedData = { remaining: newRemaining, resetAt: data.resetAt };
  cachedUserId = userId;
}

/**
 * Remaining free applications for the UI (home + premium Free box): exactly
 * the counter consume_free_swipe() spends, so the number shown is the number
 * of right swipes the jobs page will allow.
 *
 * It used to be min(counter, 10 − applications queued this cycle, …): Iris
 * and pre-cycle applications pushed the display to "0 of 10" while the swipe
 * gate (the counter alone) still allowed swipes, and earned referral swipes
 * above 10 never showed. `limit` grows with earned bonus swipes so
 * "remaining / limit" stays meaningful.
 */
export async function getFreeApplicationsLeft(userId: string): Promise<{ remaining: number; limit: number }> {
  const base = freeSwipesPerCycle();
  const { remaining } = await refreshDailySwipesFromServer(userId);
  const left = Math.max(0, remaining);
  return { remaining: left, limit: Math.max(base, left) };
}

export { DAILY_SWIPES_LIMIT, FREE_MONTHLY_SWIPES };
