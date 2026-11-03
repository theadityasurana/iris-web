import { supabase } from './supabase';
import { Job, UserProfile } from '@/types';

const GPT_RANK_TIMEOUT = 15000; // 15 seconds max (free models are slower)

/**
 * Circuit breaker: tracks consecutive failures and skips calls when the service
 * is clearly down. Resets after a cooldown period. This prevents spamming
 * retries when both AI providers are unavailable.
 */
let circuitFailures = 0;
let circuitOpenUntil = 0;
const CIRCUIT_THRESHOLD = 2; // open circuit after 2 consecutive failures
const CIRCUIT_COOLDOWN_MS = 120_000; // try again after 2 minutes

function isCircuitOpen(): boolean {
  if (circuitFailures < CIRCUIT_THRESHOLD) return false;
  if (Date.now() > circuitOpenUntil) {
    // Cooldown elapsed, allow one attempt (half-open)
    circuitFailures = CIRCUIT_THRESHOLD - 1;
    return false;
  }
  return true;
}

function recordSuccess(): void {
  circuitFailures = 0;
  circuitOpenUntil = 0;
}

function recordFailure(): void {
  circuitFailures++;
  if (circuitFailures >= CIRCUIT_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    console.log(`[AI-CIRCUIT] Circuit opened — skipping AI calls for ${CIRCUIT_COOLDOWN_MS / 1000}s`);
  }
}

/**
 * Helper: invoke ai-assist edge function with single retry on failure.
 * First call: OpenRouter free models → OpenRouter GPT-4o-mini → Gemini → Groq
 * Retry (freeOnly): OpenRouter free models → Gemini → Groq (skips paid GPT-4o-mini)
 * Includes a circuit breaker to avoid flooding when all providers are down.
 */
/**
 * `timeoutMs` is enforced by functions-js itself (plain AbortController +
 * setTimeout under the hood, so it works on Hermes — React Native does not
 * polyfill the static AbortSignal.timeout helper).
 */
async function invokeAIWithFallback(
  body: Record<string, any>,
  opts: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<{ data: any; error: any }> {
  const { signal, timeoutMs } = opts;
  const action = body.action || 'unknown';

  // Circuit breaker: skip if service is known to be down
  if (isCircuitOpen()) {
    console.log(`[AI:${action}] ⚡ Circuit breaker OPEN — skipping AI call entirely (failures=${circuitFailures}, reopens at ${new Date(circuitOpenUntil).toISOString()})`);
    return { data: { success: false }, error: { message: 'Circuit breaker open' } };
  }

  if (signal?.aborted) {
    return { data: { success: false }, error: { message: 'Aborted before start' } };
  }

  console.log(`[AI:${action}] → Attempt 1 (full chain: free OpenRouter → GPT-4o-mini → Gemini → Groq)...`);
  const t1 = Date.now();
  const { data, error } = await supabase.functions.invoke('ai-assist', { body, signal, timeout: timeoutMs });
  console.log(`[AI:${action}] ← Attempt 1 returned in ${Date.now() - t1}ms | success=${data?.success} | error=${error?.message || 'none'}`);
  if (data && !data.success) console.log(`[AI:${action}]   Response data:`, JSON.stringify(data).slice(0, 200));

  if (!error && data?.success) {
    recordSuccess();
    return { data, error: null };
  }

  // The deadline covers BOTH attempts. Without this check a timed-out first
  // attempt was immediately followed by a second full provider chain, so the
  // caller's "10s timeout" could still burn several minutes.
  if (signal?.aborted) {
    console.log(`[AI:${action}] ⏱️ Deadline passed — not starting attempt 2`);
    return { data, error: error ?? { message: 'Aborted' } };
  }

  console.log(`[AI:${action}] → Attempt 2 (freeOnly: free OpenRouter → Gemini → Groq, skipping paid GPT-4o-mini)...`);
  const t2 = Date.now();
  const { data: data2, error: error2 } = await supabase.functions.invoke('ai-assist', {
    body: { ...body, freeOnly: true },
    signal,
    timeout: timeoutMs,
  });
  console.log(`[AI:${action}] ← Attempt 2 returned in ${Date.now() - t2}ms | success=${data2?.success} | error=${error2?.message || 'none'}`);
  if (data2 && !data2.success) console.log(`[AI:${action}]   Response data2:`, JSON.stringify(data2).slice(0, 200));

  if (!error2 && data2?.success) {
    recordSuccess();
    return { data: data2, error: null };
  }

  recordFailure();
  console.log(`[AI:${action}] ❌ Both attempts failed. circuitFailures=${circuitFailures}`);
  return { data: data2, error: error2 };
}

interface RankResult {
  rankedIds: string[];
  success: boolean;
}

/**
 * Sends a batch of jobs + user profile to the ai-assist edge function for ranking.
 * Model chain: free OpenRouter models → GPT-4o-mini → Gemini → Groq
 * Returns a ranked list of job IDs (best match first).
 * Falls back gracefully if it fails or times out.
 */
export async function rankJobsWithGPT(profile: UserProfile | null, jobs: Job[]): Promise<RankResult> {
  if (!profile || jobs.length === 0) {
    return { rankedIds: jobs.map(j => j.id), success: false };
  }

  const rankStart = Date.now();
  try {
    console.log(`\n[AI-RANK] ===== rankJobsWithGPT START (${jobs.length} jobs) =====`);
    console.log(`[AI-RANK] Profile: skills=${profile.skills?.length || 0}, desiredRoles=${JSON.stringify(profile.desiredRoles || [])}, expLevel=${profile.experienceLevel}`);
    console.log(`[AI-RANK] Jobs to rank:`, jobs.map(j => `${j.jobTitle} @ ${j.companyName}`));

    const profileSummary = {
      skills: (profile.skills || []).slice(0, 15).join(', '),
      desiredRoles: (profile.desiredRoles || []).join(', '),
      experienceLevel: profile.experienceLevel || '',
      location: profile.location || '',
      headline: profile.headline || '',
    };

    const jobSummaries = jobs.map(j => ({
      id: j.id,
      title: j.jobTitle,
      company: j.companyName,
      location: j.location,
      type: j.employmentType,
      level: j.experienceLevel,
      skills: (j.skills || []).slice(0, 10).join(', '),
      desc: (j.description || '').slice(0, 300),
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log(`[AI-RANK] ⏱️ AbortController fired after ${GPT_RANK_TIMEOUT}ms`);
      controller.abort();
    }, GPT_RANK_TIMEOUT);

    const { data, error } = await invokeAIWithFallback({
      action: 'rank-jobs',
      profile: profileSummary,
      jobs: jobSummaries,
    }, { signal: controller.signal });

    clearTimeout(timeout);

    if (!error && data?.success && Array.isArray(data.rankedIds)) {
      console.log(`[AI-RANK] ✅ Ranking received in ${Date.now() - rankStart}ms — order:`, data.rankedIds);
      return { rankedIds: data.rankedIds, success: true };
    }

    console.log(`[AI-RANK] ❌ Failed after ${Date.now() - rankStart}ms — using original order. error=${error?.message} data=${JSON.stringify(data).slice(0, 200)}`);
    return { rankedIds: jobs.map(j => j.id), success: false };
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.log(`[AI-RANK] ⏱️ Timed out after ${GPT_RANK_TIMEOUT}ms, using fallback`);
    } else {
      console.log(`[AI-RANK] ❌ Exception after ${Date.now() - rankStart}ms:`, e);
    }
    return { rankedIds: jobs.map(j => j.id), success: false };
  }
}

/**
 * Validates jobs against the user's desired roles using free AI models only.
 * Only called for the active tab — background tabs skip this entirely.
 * Falls back to returning all jobs if AI fails, times out, or hits 429.
 * Never uses paid models (freeOnly: true).
 */
export async function validateJobsByDesiredRoles(
  jobs: Job[],
  desiredRoles: string[]
): Promise<Job[]> {
  if (jobs.length === 0 || desiredRoles.length === 0) return jobs;

  const start = Date.now();
  try {
    console.log(`[AI-ROLE-FILTER] ===== validateJobsByDesiredRoles START =====`);
    console.log(`[AI-ROLE-FILTER] Desired roles: ${JSON.stringify(desiredRoles)}`);
    console.log(`[AI-ROLE-FILTER] Jobs to validate (${jobs.length}):`, jobs.map(j => `"${j.jobTitle}" @ ${j.companyName}`));

    const jobSummaries = jobs.map(j => ({
      id: j.id,
      title: j.jobTitle,
      company: j.companyName,
    }));

    const controller = new AbortController();
    // 10s timeout — increased from 5s since free models need more time
    const timeout = setTimeout(() => {
      console.log(`[AI-ROLE-FILTER] ⏱️ Timed out after 10000ms — using fallback (all ${jobs.length} jobs)`);
      console.log(`[AI-ROLE-FILTER] ⚠️ User will see ALL jobs including irrelevant ones because AI was too slow`);
      controller.abort();
    }, 10000);

    const { data, error } = await invokeAIWithFallback({
      action: 'validate-desired-roles',
      jobs: jobSummaries,
      desiredRoles,
      freeOnly: true,
    }, { signal: controller.signal });

    clearTimeout(timeout);

    console.log(`[AI-ROLE-FILTER] Raw AI response — success=${data?.success} | validIds=${JSON.stringify(data?.validIds)} | error=${error?.message || 'none'}`);

    if (!error && data?.success && Array.isArray(data.validIds)) {
      const validSet = new Set(data.validIds as string[]);
      const filtered = jobs.filter(j => validSet.has(j.id));
      const removed = jobs.filter(j => !validSet.has(j.id));
      console.log(`[AI-ROLE-FILTER] ✅ ${filtered.length}/${jobs.length} passed in ${Date.now() - start}ms`);
      console.log(`[AI-ROLE-FILTER] KEPT:`, filtered.map(j => `"${j.jobTitle}"`) );
      if (removed.length) console.log(`[AI-ROLE-FILTER] REMOVED as irrelevant:`, removed.map(j => `"${j.jobTitle}"`) );
      if (filtered.length === 0) {
        console.log(`[AI-ROLE-FILTER] ⚠️ AI removed ALL jobs — falling back to original batch to avoid empty feed`);
      }
      return filtered.length > 0 ? filtered : jobs;
    }

    console.log(`[AI-ROLE-FILTER] ❌ Failed in ${Date.now() - start}ms — using client-side title fallback. error=${error?.message}`);
    // Client-side fallback: filter by checking if job title contains any word from desired roles
    const roleWords = desiredRoles.flatMap(r => r.toLowerCase().split(/[\s/()]+/).filter(w => w.length >= 4));
    const clientFiltered = jobs.filter(j => {
      const title = j.jobTitle.toLowerCase();
      return roleWords.some(w => title.includes(w));
    });
    if (clientFiltered.length > 0) {
      console.log(`[AI-ROLE-FILTER] Client fallback kept ${clientFiltered.length}/${jobs.length} jobs`);
      return clientFiltered;
    }
    console.log(`[AI-ROLE-FILTER] Client fallback removed all jobs — returning original batch`);
    return jobs;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.log(`[AI-ROLE-FILTER] ⏱️ AbortError — falling back to all ${jobs.length} jobs`);
    } else {
      console.log(`[AI-ROLE-FILTER] ❌ Exception — falling back to all ${jobs.length} jobs:`, e);
    }
    return jobs;
  }
}

/**
 * Sends filtered jobs + active filters to AI for a sanity check.
 * Model chain: free OpenRouter models → GPT-4o-mini → Gemini → Groq
 * Returns only the job IDs that AI confirms match the filters.
 * Falls back gracefully (returns all jobs) on failure or timeout.
 */
export async function validateFilteredJobsWithGPT(
  jobs: Job[],
  filters: { roles?: string[]; companies?: string[]; locations?: string[]; jobTypes?: string[]; jobLevels?: string[]; remoteOnly?: boolean }
): Promise<Job[]> {
  if (jobs.length === 0) return jobs;

  const filterStart = Date.now();
  try {
    console.log(`\n[AI-FILTER-CHECK] ===== validateFilteredJobsWithGPT START =====`);
    console.log(`[AI-FILTER-CHECK] Jobs (${jobs.length}):`, jobs.map(j => `${j.jobTitle} @ ${j.companyName} (${j.location})`));
    console.log(`[AI-FILTER-CHECK] Filters:`, JSON.stringify(filters));

    const jobSummaries = jobs.map(j => ({
      id: j.id,
      title: j.jobTitle,
      company: j.companyName,
      location: j.location,
      type: j.employmentType,
    }));

    const filterPayload: Record<string, any> = {};
    if (filters.roles?.length) filterPayload.roles = filters.roles;
    if (filters.companies?.length) filterPayload.companies = filters.companies;
    if (filters.locations?.length) filterPayload.locations = filters.locations;
    if (filters.jobTypes?.length) filterPayload.jobTypes = filters.jobTypes;
    if (filters.jobLevels?.length) filterPayload.jobLevels = filters.jobLevels;
    if (filters.remoteOnly) filterPayload.remoteOnly = 'yes';

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log(`[AI-FILTER-CHECK] ⏱️ AbortController fired after 15000ms`);
      controller.abort();
    }, 15000);

    const { data, error } = await invokeAIWithFallback({
      action: 'validate-filters',
      jobs: jobSummaries,
      filters: filterPayload,
    }, { signal: controller.signal });

    clearTimeout(timeout);

    if (!error && data?.success && Array.isArray(data.validIds)) {
      const validSet = new Set(data.validIds as string[]);
      const filtered = jobs.filter(j => validSet.has(j.id));
      const removed = jobs.filter(j => !validSet.has(j.id));
      console.log(`[AI-FILTER-CHECK] ✅ ${filtered.length}/${jobs.length} passed in ${Date.now() - filterStart}ms`);
      if (removed.length) console.log(`[AI-FILTER-CHECK] Removed jobs:`, removed.map(j => `${j.jobTitle} @ ${j.companyName}`));
      return filtered.length > 0 ? filtered : jobs;
    }

    console.log(`[AI-FILTER-CHECK] ❌ Failed after ${Date.now() - filterStart}ms, using fallback. error=${error?.message} data=${JSON.stringify(data).slice(0, 200)}`);
    return jobs;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.log(`[AI-FILTER-CHECK] ⏱️ Timed out after ${Date.now() - filterStart}ms, using fallback`);
    } else {
      console.log(`[AI-FILTER-CHECK] ❌ Exception after ${Date.now() - filterStart}ms:`, e);
    }
    return jobs;
  }
}

/**
 * Validates jobs for Iris auto-apply using GPT.
 * Returns only jobs GPT confirms are a strong match for the user's profile.
 * Falls back to all jobs on failure.
 */
export async function validateIrisJobsWithGPT(
  profile: UserProfile,
  jobs: Job[]
): Promise<Job[]> {
  if (jobs.length === 0) return jobs;

  try {
    console.log(`[AI-IRIS] Validating ${jobs.length} jobs for auto-apply...`);

    const profileSummary = {
      skills: (profile.skills || []).slice(0, 15).join(', '),
      desiredRoles: (profile.desiredRoles || []).join(', '),
      experienceLevel: profile.experienceLevel || '',
      location: profile.location || '',
      headline: profile.headline || '',
    };

    const jobSummaries = jobs.map(j => ({
      id: j.id,
      title: j.jobTitle,
      company: j.companyName,
      location: j.location,
      type: j.employmentType,
      level: j.experienceLevel,
      skills: (j.skills || []).slice(0, 8).join(', '),
    }));

    const { data, error } = await invokeAIWithFallback({
      action: 'validate-iris',
      profile: profileSummary,
      jobs: jobSummaries,
    }, { timeoutMs: GPT_RANK_TIMEOUT });

    if (!error && data?.success && Array.isArray(data.validIds)) {
      const validSet = new Set(data.validIds as string[]);
      const filtered = jobs.filter(j => validSet.has(j.id));
      console.log(`[AI-IRIS] ✅ ${filtered.length}/${jobs.length} jobs approved for auto-apply`);
      return filtered;
    }

    console.log(`[AI-IRIS] ❌ Failed, using fallback:`, error?.message);
    return jobs;
  } catch (e) {
    console.log(`[AI-IRIS] ❌ Exception, using fallback:`, e);
    return jobs;
  }
}

/**
 * Validates search tag results with GPT to ensure relevance.
 * Falls back to all jobs on failure.
 */
export async function validateSearchResultsWithGPT(
  jobs: Job[],
  searchTags: string[]
): Promise<Job[]> {
  if (jobs.length === 0 || searchTags.length === 0) return jobs;

  const searchStart = Date.now();
  try {
    console.log(`\n[AI-SEARCH] ===== validateSearchResultsWithGPT START =====`);
    console.log(`[AI-SEARCH] Tags:`, searchTags);
    console.log(`[AI-SEARCH] Jobs (${jobs.length}):`, jobs.map(j => `${j.jobTitle} @ ${j.companyName}`));

    const jobSummaries = jobs.map(j => ({
      id: j.id,
      title: j.jobTitle,
      company: j.companyName,
      location: j.location,
      type: j.employmentType,
    }));

    // Blocks the feed render, so it gets the tighter deadline.
    const { data, error } = await invokeAIWithFallback({
      action: 'validate-filters',
      jobs: jobSummaries,
      filters: { searchKeywords: searchTags },
    }, { timeoutMs: 10000 });

    if (!error && data?.success && Array.isArray(data.validIds)) {
      const validSet = new Set(data.validIds as string[]);
      const filtered = jobs.filter(j => validSet.has(j.id));
      const removed = jobs.filter(j => !validSet.has(j.id));
      console.log(`[AI-SEARCH] ✅ ${filtered.length}/${jobs.length} passed in ${Date.now() - searchStart}ms`);
      if (removed.length) console.log(`[AI-SEARCH] Removed jobs:`, removed.map(j => `${j.jobTitle} @ ${j.companyName}`));
      return filtered.length > 0 ? filtered : jobs;
    }

    console.log(`[AI-SEARCH] ❌ Failed after ${Date.now() - searchStart}ms, using fallback. error=${error?.message} data=${JSON.stringify(data).slice(0, 200)}`);
    return jobs;
  } catch (e) {
    console.log(`[AI-SEARCH] ❌ Exception after ${Date.now() - searchStart}ms, using fallback:`, e);
    return jobs;
  }
}

/**
 * Generates a personalized fit writeup using GPT.
 * Falls back to empty string on failure (caller should use local writeup).
 */
export async function generateGPTFitWriteup(
  profile: UserProfile,
  job: Job
): Promise<string | null> {
  try {
    const { data, error } = await invokeAIWithFallback({
      action: 'fit-writeup',
      profile: {
        skills: (profile.skills || []).slice(0, 10).join(', '),
        desiredRoles: (profile.desiredRoles || []).join(', '),
        experienceLevel: profile.experienceLevel || '',
        headline: profile.headline || '',
        location: profile.location || '',
      },
      job: {
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        location: job.location,
        description: (job.description || '').slice(0, 500),
        skills: (job.skills || []).slice(0, 10).join(', '),
        employmentType: job.employmentType,
      },
    }, { timeoutMs: GPT_RANK_TIMEOUT });

    if (!error && data?.success && data.writeup) {
      return data.writeup;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Re-ranks saved jobs using GPT for more accurate "Best Match" sorting.
 * Falls back to original order on failure.
 */
export async function reRankSavedJobsWithGPT(
  profile: UserProfile | null,
  jobs: Job[]
): Promise<Job[]> {
  if (!profile || jobs.length <= 1) return jobs;

  try {
    console.log(`[AI-SAVED] Re-ranking ${jobs.length} saved jobs...`);
    const { rankedIds, success } = await rankJobsWithGPT(profile, jobs);
    if (success) {
      return applyGPTRanking(jobs, rankedIds);
    }
    return jobs;
  } catch {
    return jobs;
  }
}

/**
 * Reorders a jobs array based on GPT-ranked IDs.
 * Jobs not in the ranked list are appended at the end.
 */
export function applyGPTRanking(jobs: Job[], rankedIds: string[]): Job[] {
  const jobMap = new Map(jobs.map(j => [j.id, j]));
  const ranked: Job[] = [];
  for (const id of rankedIds) {
    const job = jobMap.get(id);
    if (job) {
      ranked.push(job);
      jobMap.delete(id);
    }
  }
  // Append any remaining jobs not in the ranking
  for (const job of jobMap.values()) {
    ranked.push(job);
  }
  return ranked;
}
