import { supabase } from './supabase';
import { Job } from '@/types';

const TAB = 'unified';
const CACHE_MAX = 30;
const TOPUP_THRESHOLD = 10; // refill when cache drops to this many jobs

export async function readServerJobCache(userId: string): Promise<Job[]> {
  try {
    console.log(`[SERVER_CACHE] Reading cache for user=${userId.slice(0, 8)}...`);
    const { data, error } = await supabase
      .from('user_job_cache')
      .select('jobs')
      .eq('user_id', userId)
      .eq('tab', TAB)
      .single();
    if (error || !data || !Array.isArray(data.jobs)) {
      console.log(`[SERVER_CACHE] ❌ No cache found (${error?.message || 'empty'})`);
      return [];
    }
    console.log(`[SERVER_CACHE] ✅ Found ${data.jobs.length} jobs in cache`);
    return data.jobs as Job[];
  } catch (e) {
    console.log(`[SERVER_CACHE] ❌ Exception reading cache:`, e);
    return [];
  }
}

export async function writeServerJobCache(userId: string, jobs: Job[]): Promise<void> {
  try {
    console.log(`[SERVER_CACHE] Writing ${jobs.length} jobs to cache for user=${userId.slice(0, 8)}...`);
    const { error } = await supabase
      .from('user_job_cache')
      .upsert(
        { user_id: userId, tab: TAB, jobs, fetched_at: new Date().toISOString() },
        { onConflict: 'user_id,tab' }
      );
    if (error) {
      console.log(`[SERVER_CACHE] ❌ Write failed: ${error.message}`);
    } else {
      console.log(`[SERVER_CACHE] ✅ Wrote ${jobs.length} jobs to cache`);
    }
  } catch (e) {
    console.log(`[SERVER_CACHE] ❌ Exception writing cache:`, e);
  }
}

// Remove a single job from the cache after it's been swiped
export async function removeJobFromServerCache(userId: string, jobId: string): Promise<void> {
  try {
    const cached = await readServerJobCache(userId);
    if (cached.length === 0) return;
    const updated = cached.filter(j => j.id !== jobId);
    if (updated.length === cached.length) {
      console.log(`[SERVER_CACHE] job ${jobId.slice(0, 8)} not in cache, skipping remove`);
      return;
    }
    console.log(`[SERVER_CACHE] Removed job ${jobId.slice(0, 8)} — cache now has ${updated.length} jobs`);
    await writeServerJobCache(userId, updated);
  } catch (e) {
    console.log(`[SERVER_CACHE] ❌ Exception removing job:`, e);
  }
}

// Returns true if the cache needs a top-up
export function cacheNeedsTopup(jobCount: number): boolean {
  return jobCount <= TOPUP_THRESHOLD;
}

export { CACHE_MAX, TOPUP_THRESHOLD };
