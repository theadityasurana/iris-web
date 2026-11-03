import { supabase } from './supabase';
import { computeMatchBreakdown, MatchBreakdown } from './match-scoring';
import { computeATSScore, computeATSScoreWithAI, ATSScoreResult } from './ats-scoring';
import type { Job, UserProfile } from '@/types';
import type { STARAnswer } from './interview-prep';

export interface IrisReportRow {
  id: string;
  application_id: string;
  job_id: string;
  fit_overall: number;
  fit_score: number;
  fit_label: string;
  fit_skills: number;
  fit_experience: number;
  fit_keywords: number;
  fit_role_alignment: number;
  fit_location: number;
  ats_score: number;
  ats_matched_count: number;
  ats_total_count: number;
  ats_keywords: { keyword: string; matched: boolean }[];
  interview_prep: STARAnswer[];
  prep_generated_at: string | null;
}

/**
 * Load all cached report data for a user's iris applications.
 * Returns a map of application_id -> report data.
 */
export async function loadCachedReportData(userId: string): Promise<Map<string, IrisReportRow>> {
  const map = new Map<string, IrisReportRow>();
  try {
    const { data } = await supabase
      .from('iris_report_data')
      .select('*')
      .eq('user_id', userId);

    if (data) {
      for (const row of data) {
        map.set(row.application_id, row as IrisReportRow);
      }
    }
  } catch {}
  return map;
}

/**
 * Save fit breakdown and ATS score for an application.
 * Uses upsert to handle both new and existing records.
 */
export async function saveReportData(
  userId: string,
  applicationId: string,
  jobId: string,
  breakdown: MatchBreakdown,
  ats: ATSScoreResult
): Promise<void> {
  try {
    await supabase
      .from('iris_report_data')
      .upsert({
        user_id: userId,
        application_id: applicationId,
        job_id: jobId,
        fit_overall: breakdown.overall,
        fit_score: breakdown.fitScore,
        fit_label: breakdown.fitLabel,
        fit_skills: breakdown.skills,
        fit_experience: breakdown.experience,
        fit_keywords: breakdown.keywords,
        fit_role_alignment: breakdown.roleAlignment,
        fit_location: breakdown.location,
        ats_score: ats.score,
        ats_matched_count: ats.matchedCount,
        ats_total_count: ats.totalCount,
        ats_keywords: ats.keywords,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,application_id' });
  } catch (e) {
    console.log('[IRIS-REPORT-DATA] Failed to save:', e);
  }
}

/**
 * Generate and persist report data for an application.
 * If cached data exists, returns it immediately.
 * Otherwise computes scores via AI, saves, and returns.
 */
export async function getOrGenerateReportData(
  userId: string,
  applicationId: string,
  profile: UserProfile,
  job: Job,
  cachedRow?: IrisReportRow | null
): Promise<{ breakdown: MatchBreakdown; ats: ATSScoreResult }> {
  // Return cached if available
  if (cachedRow && cachedRow.ats_score > 0) {
    return {
      breakdown: {
        overall: cachedRow.fit_overall,
        fitScore: cachedRow.fit_score,
        fitLabel: cachedRow.fit_label as MatchBreakdown['fitLabel'],
        skills: cachedRow.fit_skills,
        experience: cachedRow.fit_experience,
        keywords: cachedRow.fit_keywords,
        roleAlignment: cachedRow.fit_role_alignment,
        location: cachedRow.fit_location,
      },
      ats: {
        score: cachedRow.ats_score,
        matchedCount: cachedRow.ats_matched_count,
        totalCount: cachedRow.ats_total_count,
        keywords: cachedRow.ats_keywords || [],
      },
    };
  }

  // Compute fresh
  const breakdown = computeMatchBreakdown(profile, job);
  const ats = await computeATSScoreWithAI(profile, job);

  // Save to Supabase (fire and forget)
  saveReportData(userId, applicationId, job.id, breakdown, ats);

  return { breakdown, ats };
}

/**
 * Pre-generate report data for all iris applications in background.
 * Called when user opens the Iris page so data is ready when they click View Report.
 * Skips applications that already have cached data (report only generates once).
 * Uses GPT (OpenRouter) with Gemini fallback via ai-assist edge function.
 */
export async function preGenerateReportInBackground(userId: string): Promise<void> {
  try {
    // Load existing cached data
    const cachedMap = await loadCachedReportData(userId);

    // Load iris applications
    const { data: apps } = await supabase
      .from('live_application_queue')
      .select('id, job_id, company_name, job_title, applied_at')
      .eq('user_id', userId)
      .eq('applied_by', 'iris')
      .order('applied_at', { ascending: false })
      .limit(10);

    if (!apps || apps.length === 0) return;

    // Filter to only apps without existing report data
    const uncachedApps = apps.filter(app => {
      const cached = cachedMap.get(app.id);
      return !cached || cached.ats_score === 0;
    });

    if (uncachedApps.length === 0) return; // All reports already generated

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profileData) return;

    const profile: UserProfile = {
      id: profileData.id,
      name: profileData.full_name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      headline: profileData.headline || '',
      location: profileData.location || '',
      avatar: profileData.avatar_url || '',
      bio: profileData.bio || '',
      profileCompletion: 0,
      totalApplications: 0,
      interviewsScheduled: 0,
      matchRate: 0,
      profileViews: 0,
      skills: profileData.skills || [],
      topSkills: [],
      experience: profileData.experience || [],
      education: profileData.education || [],
      certifications: [],
      achievements: [],
      jobPreferences: [],
      workModePreferences: profileData.work_mode_preferences || [],
      salaryCurrency: 'USD',
      salaryMinPref: 0,
      salaryMaxPref: 0,
      experienceLevel: profileData.experience_level || '',
      desiredRoles: profileData.desired_roles || [],
      preferredCities: profileData.preferred_cities || [],
    };

    // Process each uncached app
    for (const app of uncachedApps) {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', app.job_id)
        .single();

      if (!jobData) continue;

      const job: Job = {
        id: jobData.id,
        companyName: jobData.company_name || '',
        companyLogo: jobData.company_logo || '',
        jobTitle: jobData.job_title || '',
        location: jobData.location || '',
        locationType: jobData.location_type || 'onsite',
        postedDate: jobData.posted_date || '',
        matchScore: 0,
        salaryMin: jobData.salary_min || 0,
        salaryMax: jobData.salary_max || 0,
        salaryCurrency: jobData.salary_currency || 'USD',
        salaryPeriod: jobData.salary_period || 'year',
        employmentType: jobData.employment_type || '',
        experienceLevel: jobData.experience_level || '',
        description: jobData.description || '',
        companyDescription: jobData.company_description || '',
        detailedRequirements: jobData.detailed_requirements || '',
        culturePhotos: [],
        requirements: jobData.requirements || [],
        skills: jobData.skills || [],
        benefits: jobData.benefits || [],
        applicantsCount: jobData.applicants_count || 0,
        deadline: null,
        industry: jobData.industry || '',
      };

      // Generate and save (uses GPT via OpenRouter + Gemini fallback)
      const breakdown = computeMatchBreakdown(profile, job);
      const ats = await computeATSScoreWithAI(profile, job);
      await saveReportData(userId, app.id, job.id, breakdown, ats);
    }

    console.log('[IRIS-REPORT] Background pre-generation complete');
  } catch (e) {
    console.log('[IRIS-REPORT] Background pre-generation error:', e);
  }
}
