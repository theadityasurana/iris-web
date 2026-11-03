import { supabase } from './supabase';
import { fetchJobsBatch, addToLiveApplicationQueue, incrementRightSwipe } from './jobs';
import { computeMatchScore } from './match-scoring';
import { validateIrisJobsWithGPT } from './gpt-ranking';
import { Job, UserProfile } from '@/types';

const sanitizeLog = (val: unknown): string => String(val).replace(/[\r\n]/g, ' ');

const IRIS_MAX_APPLICATIONS = 10;
const IRIS_START_HOUR = 0; // 12am
const IRIS_END_HOUR = 8; // 8am

// Set to true to bypass time window for testing
const IRIS_TEST_MODE = false;

export type SalaryCurrency = 'USD' | 'INR' | 'EUR' | 'GBP' | 'AED' | 'SGD';

export interface IrisPreferences {
  watchlist: string[];       // companies to prioritize
  blocked: string[];         // companies to never apply to
  minMatchScore: number;     // 50–100
  salaryFloor: number;       // 0 = any
  salaryCurrency: SalaryCurrency;
  companySize: 'Any' | 'Startup' | 'Mid-size' | 'Enterprise';
  outreachTone: 'Professional' | 'Conversational' | 'Bold' | 'Friendly' | 'Assertive' | 'Witty';
  dailyLimit: number;        // 1–10
  pauseWeekends: boolean;
  jobLocations: ('unified' | 'remote' | 'discover' | 'india' | 'usa')[]; // job location preference for iris
}

export const DEFAULT_IRIS_PREFS: IrisPreferences = {
  watchlist: [],
  blocked: [],
  minMatchScore: 75,
  salaryFloor: 0,
  salaryCurrency: 'USD',
  companySize: 'Any',
  outreachTone: 'Professional',
  dailyLimit: 5,
  pauseWeekends: false,
  jobLocations: ['unified'],
};

export async function getIrisPreferences(userId: string): Promise<IrisPreferences> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('iris_preferences')
      .eq('id', userId)
      .single();
    if (!data?.iris_preferences) return DEFAULT_IRIS_PREFS;
    return { ...DEFAULT_IRIS_PREFS, ...data.iris_preferences };
  } catch {
    return DEFAULT_IRIS_PREFS;
  }
}

export async function saveIrisPreferences(userId: string, prefs: Partial<IrisPreferences>): Promise<boolean> {
  try {
    // Merge with existing to avoid overwriting unrelated keys
    const existing = await getIrisPreferences(userId);
    const merged = { ...existing, ...prefs };
    const { error } = await supabase
      .from('profiles')
      .update({ iris_preferences: merged })
      .eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

export async function getIrisEnabled(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('iris_enabled')
      .eq('id', userId)
      .single();
    return data?.iris_enabled === true;
  } catch {
    return false;
  }
}

export async function setIrisEnabled(userId: string, enabled: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ iris_enabled: enabled })
      .eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

export function isIrisActiveWindow(): boolean {
  if (IRIS_TEST_MODE) return true;
  // Server-side cron runs at 2am, 4am, 6am UTC automatically.
  // Client-side also runs when user opens app during the window as a supplement.
  const hour = new Date().getHours();
  return hour >= IRIS_START_HOUR && hour < IRIS_END_HOUR;
}

export async function getIrisAppliedToday(userId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  try {
    const { count } = await supabase
      .from('live_application_queue')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('applied_by', 'iris')
      .gte('applied_at', todayStart.toISOString());
    return count || 0;
  } catch {
    return 0;
  }
}

export interface IrisApplication {
  id: string;
  company_name: string;
  job_title: string;
  applied_at: string;
  job_id: string;
}

export async function getIrisApplications(userId: string): Promise<IrisApplication[]> {
  try {
    const { data, error } = await supabase
      .from('live_application_queue')
      .select('id, company_name, job_title, applied_at, job_id')
      .eq('user_id', userId)
      .eq('applied_by', 'iris')
      .order('applied_at', { ascending: false })
      .limit(10);
    if (error || !data) return [];
    return data as IrisApplication[];
  } catch {
    return [];
  }
}

export function generateMatchReason(jobTitle: string, companyName: string, userSkills: string[], userRoles: string[]): string {
  const roleLower = jobTitle.toLowerCase();
  const matchedRole = userRoles.find(r => roleLower.includes(r.toLowerCase()) || r.toLowerCase().includes(roleLower.split(' ')[0]));
  const relevantSkills = userSkills.slice(0, 3).join(', ');

  if (matchedRole && relevantSkills) {
    return `Strong fit  - aligns with your target role as ${matchedRole} and leverages your skills in ${relevantSkills}.`;
  } else if (matchedRole) {
    return `Matches your target role as ${matchedRole}. ${companyName} is actively hiring for this position.`;
  } else if (relevantSkills) {
    return `Your skills in ${relevantSkills} are a direct match for this role at ${companyName}.`;
  }
  return `${companyName} is hiring for ${jobTitle}  - matches your profile preferences and experience level.`;
}

/** Call Gemini via ai-assist edge function for a personalized match reason. Falls back to template. */
export async function generateGeminiMatchReason(
  jobTitle: string,
  companyName: string,
  description: string,
  userSkills: string[],
  userRoles: string[]
): Promise<string> {
  try {
    console.log('[IRIS-GEMINI] Calling ai-assist for match-reason:', sanitizeLog(jobTitle), '@', sanitizeLog(companyName));
    const { data, error } = await supabase.functions.invoke('ai-assist', {
      body: {
        action: 'match-reason',
        profile: { skills: userSkills, desiredRoles: userRoles },
        job: { jobTitle, companyName, description },
      },
    });
    console.log('[IRIS-GEMINI] Response:', JSON.stringify({ data, error: sanitizeLog(error?.message) }));
    if (!error && data?.success && data.reason) {
      console.log('[IRIS-GEMINI] ✅ Gemini response received for:', sanitizeLog(jobTitle));
      return data.reason;
    }
    console.log('[IRIS-GEMINI] ❌ Gemini failed:', sanitizeLog(error?.message || 'no reason returned'));
  } catch (e) {
    console.log('[IRIS-GEMINI] ❌ Exception:', sanitizeLog(e));
  }
  // Fallback to template
  console.log('[IRIS-GEMINI] Using template fallback for:', sanitizeLog(jobTitle));
  return generateMatchReason(jobTitle, companyName, userSkills, userRoles);
}

export async function runIrisAutoApply(userId: string, profile: UserProfile): Promise<number> {
  if (!isIrisActiveWindow()) return 0;

  const alreadyApplied = await getIrisAppliedToday(userId);
  if (alreadyApplied >= IRIS_MAX_APPLICATIONS) return 0;

  const remaining = IRIS_MAX_APPLICATIONS - alreadyApplied;

  // Fetch user's swiped job IDs to exclude
  const { data: existingApps } = await supabase
    .from('live_application_queue')
    .select('job_id')
    .eq('user_id', userId);
  const excludeIds = (existingApps || []).map((a: any) => a.job_id).filter(Boolean);

  // Fetch user's desired roles and iris preferences
  const { data: profileData } = await supabase
    .from('profiles')
    .select('desired_roles, desired_role_categories, iris_preferences')
    .eq('id', userId)
    .single();

  const desiredRoles = profileData?.desired_roles || profileData?.desired_role_categories || [];
  const prefs: IrisPreferences = { ...DEFAULT_IRIS_PREFS, ...(profileData?.iris_preferences || {}) };

  // Always use unified tab — india/usa tabs are deprecated
  const result = await fetchJobsBatch({ tab: 'unified', limit: remaining * 3, offset: 0, excludeIds, desiredRoles });
  const allJobs = result.jobs || [];

  // Deduplicate by id
  const seen = new Set<string>();
  const jobs = allJobs.filter(j => { if (seen.has(j.id)) return false; seen.add(j.id); return true; });

  if (jobs.length === 0) return 0;

  // Sanity check: score each job against user profile, only apply if score >= 60
  const MIN_MATCH_SCORE = 60;
  let qualifiedJobs = jobs.filter(job => {
    const score = computeMatchScore(profile, job);
    return score >= MIN_MATCH_SCORE;
  }).slice(0, remaining);

  if (qualifiedJobs.length === 0) return 0;

  // GPT sanity check: validate qualified jobs before auto-applying
  qualifiedJobs = await validateIrisJobsWithGPT(profile, qualifiedJobs);
  if (qualifiedJobs.length === 0) return 0;

  let applied = 0;
  for (const job of qualifiedJobs) {
    try {
      await incrementRightSwipe(job.id);
      const success = await addToLiveApplicationQueue(userId, job, profile, 'iris');
      if (success) applied++;
    } catch {
      continue;
    }
  }

  return applied;
}
