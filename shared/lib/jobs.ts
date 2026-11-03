import { supabase } from '@/lib/supabase';
import { Job, UserProfile } from '@/types';
import COMPANY_LOGOS from '@/constants/company-logos';
import { runFeedBatch, withTimeout, JobsTimeoutError, companyNameFilter, type BatchFetchParams, type JobsFetchFailure, type RawBatchResult, type FeedCompany } from '@/lib/feed-engine';
import { rc } from '@/lib/remote-config';
import { isNetworkError } from '@/lib/offline';
export { MAX_ROLE_BREADTH, type RoleBreadth } from '@/lib/feed-policy';

export interface SupabaseJob {
  id: string;
  company_name: string;
  company_logo?: string;
  company_linkedin?: string;
  job_title?: string;
  title?: string;
  location: string;
  location_type?: string;
  posted_date?: string;
  match_score?: number;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  employment_type?: string;
  experience_level?: string;
  experience?: string;
  description?: string;
  company_description?: string;
  detailed_requirements?: string;
  culture_photos?: string[];
  requirements?: string[];
  skills?: string[];
  benefits?: string[];
  applicants_count?: number;
  right_swipe?: number;
  deadline?: string;
  portal?: string;
  portal_url?: string;
  job_url?: string;
  company_website?: string;
  type?: string;
  salary_range?: string;
  created_at?: string;
  education_level?: string;
  work_authorization?: string;
  loc_cities?: string[] | null;
  loc_countries?: string[] | null;
}

export interface SupabaseCompany {
  id: string;
  name: string;
  logo?: string;
  logo_url?: string;
  linkedin?: string;
  website?: string;
  description?: string;
  size?: string;
  industry?: string;
  founded?: string;
  headquarters?: string;
  one_liner?: string;
  culture_photos?: string[];
}

function parseSalaryRange(salaryRange?: string): { min: number; max: number; raw: string } {
  if (!salaryRange) return { min: 0, max: 0, raw: '' };

  const parts = salaryRange.split(/\s*-\s*/);
  const parseNum = (s: string): number => {
    const cleaned = s.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  if (parts.length >= 2) {
    const min = parseNum(parts[0]);
    const max = parseNum(parts[1]);
    return { min: Math.min(min, max), max: Math.max(min, max), raw: salaryRange.trim() };
  }
  if (parts.length === 1) {
    const val = parseNum(parts[0]);
    return { min: val, max: val, raw: salaryRange.trim() };
  }
  return { min: 0, max: 0, raw: salaryRange.trim() };
}

function getRelativeDate(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  } catch {
    return 'Recently';
  }
}

function normalizeLocationType(type?: string): 'remote' | 'onsite' | 'hybrid' {
  if (!type) return 'onsite';
  const lower = type.toLowerCase();
  if (lower.includes('remote')) return 'remote';
  if (lower.includes('hybrid')) return 'hybrid';
  return 'onsite';
}

const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';

/** Default ceiling on one search_jobs RPC; the live value is remote_config.feed.rpc_timeout_ms. */
export const JOBS_RPC_TIMEOUT_MS = 12000;

export { JobsTimeoutError, withTimeout };
export type { BatchFetchParams, JobsFetchFailure };

// Returns a React Native image source — either a local require() asset or { uri: string }
// ─── Company logos ───────────────────────────────────────────────────────────
//
// Logos come from the internet by the company's real domain — no Supabase
// storage. Order: logo bundled in the app → an external logo_url → Google's
// favicon service at its largest size (by domain) → (in <CompanyLogo>, on
// error) DuckDuckGo's icon service → an initial-letter badge.

const companyDomains = new Map<string, string>();
const companyKey = (name: string) => (name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

/** "https://hightouch.com/careers" / "Clipboard.com" → "hightouch.com" / "clipboard.com". */
function domainFromWebsite(website?: string | null): string | null {
  if (!website) return null;
  const host = website.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').split(/[/?#]/)[0].replace(/^www\./, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

/** Remember a company's real domain (called wherever company rows are loaded). */
export function rememberCompanyWebsite(companyName: string, website?: string | null) {
  const domain = domainFromWebsite(website);
  if (domain) companyDomains.set(companyKey(companyName), domain);
}

/** Best-known domain for a company: its website if loaded, else a "<name>.com" guess. */
export function companyDomain(companyName: string, website?: string | null): string {
  return domainFromWebsite(website) ?? companyDomains.get(companyKey(companyName)) ?? `${companyKey(companyName)}.com`;
}

const isStorageUrl = (u: string) => u.includes('/storage/v1/object/');

export function companyLogoCandidates(companyName: string, logoUrl?: string | null, website?: string | null): string[] {
  const domain = companyDomain(companyName, website);
  // Optional HD logos: logo.dev's publishable token (free tier).
  const logoDevToken = process.env.EXPO_PUBLIC_LOGO_DEV_TOKEN;
  const sources: Record<string, string[]> = {
    // companies.logo_url when it points to the internet (admins can set it per company).
    company: logoUrl && logoUrl.startsWith('http') && !isStorageUrl(logoUrl) ? [logoUrl] : [],
    logo_dev: logoDevToken ? [`https://img.logo.dev/${domain}?token=${logoDevToken}&size=256&format=png`] : [],
    google: [`https://www.google.com/s2/favicons?domain=${domain}&sz=256`],
    duckduckgo: [`https://icons.duckduckgo.com/ip3/${domain}.ico`],
  };
  // Order from remote config (logos.providers); unknown names are skipped.
  const order = rc('logos').providers.filter(p => p in sources);
  const out = (order.length ? order : ['company', 'logo_dev', 'google', 'duckduckgo']).flatMap(p => sources[p]);
  return out.length ? out : sources.google;
}

export function getCompanyLogoSource(
  companyName: string,
  logo?: string,
  logoUrl?: string,
  website?: string | null,
): number | { uri: string } {
  const bundled = COMPANY_LOGOS[companyKey(companyName)];
  if (bundled) return bundled;
  return { uri: companyLogoCandidates(companyName, logoUrl || logo, website)[0] };
}

/** URI-string form, for callers that need one. */
export function getCompanyLogoUrl(companyName: string, logo?: string, logoUrl?: string, website?: string | null): string {
  return companyLogoCandidates(companyName, logoUrl || logo, website)[0];
}

export function mapSupabaseJobToJob(raw: SupabaseJob): Job {
  const salaryFromRange = parseSalaryRange(raw.salary_range);
  const jobTitle = raw.title || raw.job_title || 'Untitled Position';

  const hasRequirements = Array.isArray(raw.requirements) && raw.requirements.length > 0;
  const hasBenefits = Array.isArray(raw.benefits) && raw.benefits.length > 0;

  return {
    id: raw.id,
    companyName: raw.company_name || 'Unknown Company',
    companyLogo: getCompanyLogoUrl(raw.company_name || '', undefined, undefined),
    companyLinkedIn: raw.company_linkedin || undefined,
    jobTitle,
    location: raw.location || 'Not specified',
    locCities: raw.loc_cities ?? undefined,
    locCountries: raw.loc_countries ?? undefined,
    locationType: normalizeLocationType(raw.location_type || raw.type),
    postedDate: getRelativeDate(raw.posted_date || raw.created_at),
    // 0 means "not scored yet" — computeMatchScores() fills this in for feed
    // results. Never fabricate a score; a random number shown as a match
    // percentage is a lie to the user and changes on every render.
    matchScore: raw.match_score ?? 0,
    salaryMin: raw.salary_min ?? salaryFromRange.min,
    salaryMax: raw.salary_max ?? salaryFromRange.max,
    salaryCurrency: raw.salary_currency || 'USD',
    salaryPeriod: raw.salary_period || 'year',
    employmentType: raw.employment_type || raw.type || 'Full-time',
    experienceLevel: raw.experience_level || raw.experience || 'Not specified',
    description: raw.description || 'No description available.',
    companyDescription: raw.company_description || `${raw.company_name || 'This company'} is an innovative organization looking for talented individuals to join their team.`,
    detailedRequirements: raw.detailed_requirements || raw.description || 'Please refer to the job description for detailed requirements.',
    culturePhotos: Array.isArray(raw.culture_photos) ? raw.culture_photos : [],
    requirements: hasRequirements ? raw.requirements! : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    benefits: hasBenefits ? raw.benefits! : [],
    applicantsCount: raw.applicants_count ?? raw.right_swipe ?? 0,
    deadline: raw.deadline || null,
    portal: raw.portal,
    portalUrl: raw.portal_url,
    companyWebsite: raw.company_website,
    salaryRangeRaw: salaryFromRange.raw || undefined,
    industry: undefined,
    educationLevel: raw.education_level,
    workAuthorization: raw.work_authorization,
  };
}

function enrichWithCompanyData(rows: SupabaseJob[], companyDataMap: Map<string, { industry?: string; size?: string; company_type?: string; description?: string; website?: string; logo_url?: string }>): Job[] {
  return rows.map((row) => {
    const job = mapSupabaseJobToJob(row);
    const companyData = companyDataMap.get(row.company_name?.toLowerCase() || '');
    if (companyData) {
      if (companyData.logo_url || companyData.website) job.companyLogo = getCompanyLogoUrl(row.company_name || '', undefined, companyData.logo_url, companyData.website);
      if (companyData.industry) job.industry = companyData.industry;
      if (companyData.size) job.companySize = companyData.size;
      if (companyData.company_type) job.companyType = companyData.company_type;
      if (companyData.description) job.companyDescription = companyData.description;
      if (companyData.website) job.companyWebsite = companyData.website;
    }
    return job;
  });
}

type CompanyData = { industry?: string; size?: string; company_type?: string; description?: string; website?: string; logo_url?: string };

async function fetchCompanies(companyNames: string[]): Promise<FeedCompany[]> {
  if (companyNames.length === 0) return [];
  // Case-insensitive: `.in('name', ...)` missed rows whose casing differed ("OpenAI" vs "Openai").
  const { data } = await supabase
    .from('companies')
    .select('name, industry, size, company_type, description, website, logo_url')
    .or(companyNameFilter(companyNames));
  return (data as FeedCompany[] | null) ?? [];
}

function companyDataMapFrom(companies: FeedCompany[]): Map<string, CompanyData> {
  const map = new Map<string, CompanyData>();
  for (const company of companies) {
    if (!company?.name) continue;
    rememberCompanyWebsite(company.name, company.website);
    map.set(company.name.toLowerCase(), {
      industry: company.industry,
      size: company.size,
      company_type: company.company_type,
      description: company.description,
      website: company.website,
      logo_url: company.logo_url,
    });
  }
  return map;
}

export interface BatchFetchResult {
  jobs: Job[];
  serverHadMore: boolean;
  serverRowCount: number;
  titleKeywords?: string[];
  /**
   * Set when the batch came back empty *because something broke*, as opposed
   * to the feed genuinely being exhausted. The UI needs this to tell "we're
   * broken, retry" apart from "you've seen everything".
   */
  failure?: JobsFetchFailure;
  /**
   * True when role keywords were requested but every keyword query failed, so
   * these jobs came from the keyword-less rescue query (generic recent jobs).
   * Fine to show once; never to cache as the user's feed.
   */
  degraded?: boolean;
}

/** Ask the get-feed edge function to build the batch (features.feed_source = 'server'). */
async function fetchRawFromServer(params: BatchFetchParams): Promise<RawBatchResult | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('get-feed', { body: params }),
      rc('feed').rpc_timeout_ms * 2 + 2000,
    );
    if (error || !data || !Array.isArray((data as RawBatchResult).rows)) return null;
    return data as RawBatchResult;
  } catch {
    return null;
  }
}

/**
 * One page of the feed. Built on the phone by default; with
 * features.feed_source = 'server' the get-feed function builds it instead,
 * falling back to the phone if the function fails, so switching is safe.
 */
export async function fetchJobsBatch(params: BatchFetchParams): Promise<BatchFetchResult> {
  const local = () => runFeedBatch(params, {
    searchJobs: (p) => supabase.rpc('search_jobs', p),
    fetchCompanies,
    log: (...a) => console.log(...a),
  });
  const raw = (rc('features').feed_source === 'server' ? await fetchRawFromServer(params) : null) ?? await local();

  const companyDataMap = companyDataMapFrom(raw.companies);
  const coreJobs = enrichWithCompanyData(raw.rows as unknown as SupabaseJob[], companyDataMap);
  const adjacentJobs = enrichWithCompanyData(raw.adjacentRows as unknown as SupabaseJob[], companyDataMap)
    .map(j => ({ ...j, relevanceTier: 'adjacent' as const }));
  return {
    jobs: [...coreJobs, ...adjacentJobs],
    serverHadMore: raw.serverHadMore,
    serverRowCount: raw.serverRowCount,
    titleKeywords: raw.titleKeywords,
    failure: raw.failure,
    degraded: raw.degraded,
  };
}

// Legacy functions kept for any other callers
export async function fetchJobsFromSupabase(): Promise<Job[]> {
  const result = await fetchJobsBatch({ tab: 'discover', limit: 10, offset: 0 });
  return result.jobs;
}

export async function fetchRemainingJobs(): Promise<Job[]> {
  return [];
}

export async function fetchCompanyFromSupabase(companyName: string): Promise<SupabaseCompany | null> {
  try {
    console.log('Fetching company from Supabase:', companyName);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .ilike('name', companyName)
      .single();

    if (error) {
      console.log('Error fetching company:', error.message);
      return null;
    }

    console.log('Company data fetched:', data?.name);
    return data as SupabaseCompany;
  } catch (e) {
    console.log('Exception fetching company:', e);
    return null;
  }
}

export async function fetchJobsByCompany(companyName: string): Promise<Job[]> {
  try {
    console.log('Fetching jobs for company:', companyName);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .ilike('company_name', companyName)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching company jobs:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No jobs found for company:', companyName);
      return [];
    }

    console.log(`Fetched ${data.length} jobs for ${companyName}`);
    return data.map((row: SupabaseJob) => mapSupabaseJobToJob(row));
  } catch (e) {
    console.log('Exception fetching company jobs:', e);
    return [];
  }
}

/**
 * Atomically bump a job's right-swipe counter.
 *
 * Was a read-then-write pair, which lost counts whenever two swipes landed
 * concurrently (both read N, both wrote N+1). The increment now happens in a
 * single statement inside the DB — see migration 20250139.
 */
export async function incrementRightSwipe(jobId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_right_swipe', { p_job_id: jobId });
    if (error) console.log('Error incrementing right_swipe:', error.message);
  } catch (e) {
    console.log('Exception incrementing right_swipe:', e);
  }
}

export async function addToLiveApplicationQueue(
  userId: string,
  job: Job,
  profile: UserProfile,
  appliedBy: string = 'user'
): Promise<boolean> {
  try {
    console.log('Adding to live_application_queue for job:', job.id, 'user:', userId);

    const { data: jobData } = await supabase
      .from('jobs')
      .select('job_url')
      .eq('id', job.id)
      .single();

    // Split name safely with fallbacks
    const nameParts = (profile.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build entry with safe defaults for all optional fields
    const entry = {
      user_id: userId,
      job_id: job.id,
      first_name: firstName,
      last_name: lastName,
      gender: profile.gender || null,
      phone: profile.phone || null,
      country_code: profile.countryCode || null,
      location: profile.location || null,
      headline: profile.headline || null,
      bio: profile.bio || null,
      resume_url: profile.resumeUrl || null,
      linkedin_url: profile.linkedinUrl || null,
      github_url: profile.githubUrl || null,
      veteran_status: profile.veteranStatus || null,
      disability_status: profile.disabilityStatus || null,
      ethnicity: profile.ethnicity || null,
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      top_skills: Array.isArray(profile.topSkills) ? profile.topSkills : [],
      experience: Array.isArray(profile.experience) ? profile.experience : [],
      education: Array.isArray(profile.education) ? profile.education : [],
      certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
      achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
      job_preferences: Array.isArray(profile.jobPreferences) ? profile.jobPreferences : [],
      work_mode_preferences: Array.isArray(profile.workModePreferences) ? profile.workModePreferences : [],
      salary_currency: profile.salaryCurrency || null,
      salary_min: profile.salaryMinPref || null,
      salary_max: profile.salaryMaxPref || null,
      desired_roles: Array.isArray(profile.desiredRoles) ? profile.desiredRoles : [],
      preferred_cities: Array.isArray(profile.preferredCities) ? profile.preferredCities : [],
      company_name: job.companyName,
      job_title: job.jobTitle,
      job_url: jobData?.job_url || null,
      status: 'pending',
      applied_at: new Date().toISOString(),
      applied_by: appliedBy,
      progress_timestamps: JSON.stringify([new Date().toISOString()]),
    };

    const { error } = await supabase
      .from('live_application_queue')
      .insert(entry);

    if (error) {
      console.log('Error adding to live_application_queue:', error.message, error);
      return false;
    }

    console.log('Successfully added to live_application_queue for job:', job.id);
    return true;
  } catch (e) {
    console.log('Exception adding to live_application_queue:', e);
    return false;
  }
}

export async function updateApplicationProgress(appId: string): Promise<{ step: number; timestamps: string[]; done: boolean }> {
  try {
    const { data, error } = await supabase
      .from('live_application_queue')
      .select('status, progress_timestamps')
      .eq('id', appId)
      .single();

    if (error || !data) return { step: 0, timestamps: [], done: false };

    let timestamps: string[] = [];
    try {
      timestamps = data.progress_timestamps ? JSON.parse(data.progress_timestamps) : [];
    } catch {
      timestamps = [];
    }

    const done = data.status === 'completed' || data.status === 'applied' || data.status === 'submitted';
    const step = done ? 10 : Math.max(0, timestamps.length - 1);

    return { step, timestamps, done };
  } catch (e) {
    console.log('Error fetching application progress:', e);
    return { step: 0, timestamps: [], done: false };
  }
}

export async function fetchJobById(jobId: string): Promise<Job | null> {
  try {
    console.log('Fetching job by ID:', jobId);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.log('Error fetching job by ID:', error.message);
      return null;
    }

    if (!data) return null;
    
    const job = mapSupabaseJobToJob(data as SupabaseJob);
    
    // Enrich with company data
    const { data: company } = await supabase
      .from('companies')
      .select('industry, size, company_type, description, website')
      .ilike('name', job.companyName)
      .single();
    
    if (company) {
      if (company.industry) job.industry = company.industry;
      if (company.size) job.companySize = company.size;
      if (company.company_type) job.companyType = company.company_type;
      if (company.description) job.companyDescription = company.description;
      if (company.website) job.companyWebsite = company.website;
    }
    
    return job;
  } catch (e) {
    console.log('Exception fetching job by ID:', e);
    return null;
  }
}

export async function fetchUserApplications(userId: string): Promise<any[]> {
  try {
    console.log('Fetching applications for user:', userId);
    const { data: applications, error } = await supabase
      .from('live_application_queue')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching applications:', error.message);
      // Offline: throw so React Query keeps the cached list instead of [].
      if (isNetworkError(error)) throw error;
      return [];
    }

    if (!applications || applications.length === 0) {
      console.log('No applications found');
      return [];
    }

    // Fetch company data (logo_url) for enrichment — case-insensitive name match
    const companyNames = [...new Set(applications.map((app: any) => app.company_name).filter(Boolean))];
    const { data: companies } = await supabase
      .from('companies')
      .select('name, logo_url, website')
      .in('name', companyNames);

    // Build map with lowercase keys for case-insensitive lookup
    const companyDataMap = new Map<string, { logo_url?: string; website?: string }>();
    companies?.forEach((company: any) => {
      if (company.name) {
        companyDataMap.set(company.name.toLowerCase(), {
          logo_url: company.logo_url,
          website: company.website,
        });
      }
    });

    // Enrich applications with company logo
    const enrichedApplications = applications.map((app: any) => {
      const companyKey = (app.company_name || '').toLowerCase();
      const companyData = companyDataMap.get(companyKey);
      // Priority: Supabase logo_url → Google favicon from website → Google favicon from guessed domain
      let logoUrl: string | null = companyData?.logo_url || null;
      if (!logoUrl) {
        const domain = companyData?.website
          ? companyData.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
          : (app.company_name || '').toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
        logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }
      return { ...app, company_logo_url: logoUrl };
    });

    console.log(`Fetched ${enrichedApplications.length} applications`);
    return enrichedApplications;
  } catch (e) {
    console.log('Exception fetching applications:', e);
    if (isNetworkError(e)) throw e;
    return [];
  }
}

export interface FeaturedCompany {
  name: string;
  logo_url?: string;
  open_jobs: number;
}

export async function fetchFeaturedCompanies(limit = 20): Promise<FeaturedCompany[]> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('name, logo_url')
      .order('name', { ascending: true })
      .limit(limit);
    if (error || !data) return [];

    const names = data.map((c: any) => c.name).filter(Boolean);
    if (names.length === 0) return [];

    // Count open jobs per company
    const orFilter = names
      .map((n: string) => `company_name.ilike."${n.replace(/["\\]/g, '\\$&')}"`)
      .join(',');
    const { data: jobs } = await supabase
      .from('jobs')
      .select('company_name')
      .or(orFilter);

    const countMap = new Map<string, number>();
    jobs?.forEach((j: any) => {
      const key = (j.company_name || '').toLowerCase();
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    });

    return data
      .map((c: any) => ({
        name: c.name,
        logo_url: c.logo_url,
        open_jobs: countMap.get((c.name || '').toLowerCase()) ?? 0,
      }))
      .filter((c: FeaturedCompany) => c.open_jobs > 0)
      .sort((a: FeaturedCompany, b: FeaturedCompany) => b.open_jobs - a.open_jobs)
      .slice(0, limit);
  } catch (e) {
    console.log('fetchFeaturedCompanies error:', e);
    return [];
  }
}

export async function fetchAllCompanies(): Promise<string[]> {
  try {
    console.log('Fetching all companies from Supabase...');
    // website too: it gives every logo in the app the company's real domain.
    const { data, error } = await supabase
      .from('companies')
      .select('name, website')
      .order('name', { ascending: true });

    if (error) {
      console.log('Error fetching companies:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No companies found');
      return [];
    }

    console.log(`Fetched ${data.length} companies`);
    for (const c of data) rememberCompanyWebsite(c.name, c.website);
    return data.map(c => c.name).filter(Boolean);
  } catch (e) {
    console.log('Exception fetching companies:', e);
    return [];
  }
}

export async function saveJob(userId: string, jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('saved_jobs')
      .insert({ user_id: userId, job_id: jobId });
    return !error;
  } catch {
    return false;
  }
}

export async function unsaveJob(userId: string, jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', jobId);
    return !error;
  } catch {
    return false;
  }
}

export async function isJobSaved(userId: string, jobId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

// --- OTP Extraction & Matching ---

const OTP_KEYWORDS = [
  'verification code', 'verify your email', 'otp', 'one-time',
  'confirmation code', 'security code', 'passcode', 'pin code',
  'verify your account', 'enter the code', 'enter this code',
  'your code is', 'your code:', 'code is:',
];

export function extractOtp(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const hasKeyword = OTP_KEYWORDS.some((kw) => lower.includes(kw));
  if (!hasKeyword) return null;

  // Match 4-8 digit standalone codes (most common OTP formats)
  const matches = text.match(/\b(\d{4,8})\b/g);
  if (!matches) return null;

  // Filter out likely non-OTP numbers (years, zip codes in context, etc.)
  for (const m of matches) {
    const n = parseInt(m, 10);
    if (m.length >= 4 && m.length <= 8 && n >= 1000 && !(n >= 1900 && n <= 2100)) {
      return m;
    }
  }
  return null;
}

function domainFromEmail(email: string): string {
  return (email.split('@')[1] || '').toLowerCase();
}

function companyMatchesEmail(companyName: string, fromEmail: string, subject: string): boolean {
  const company = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const domain = domainFromEmail(fromEmail).replace(/[^a-z0-9]/g, '');
  const subjectLower = subject.toLowerCase();
  return domain.includes(company) || company.includes(domain.split('.')[0]) || subjectLower.includes(companyName.toLowerCase());
}

// --- Interview Detection ---

const INTERVIEW_KEYWORDS = [
  'interview', 'schedule a call', 'schedule a chat',
  'we\'d like to speak', 'we would like to speak',
  'invite you to interview', 'interview invitation',
  'next round', 'phone screen', 'technical screen',
  'on-site interview', 'virtual interview', 'video interview',
  'meet the team', 'hiring manager', 'interview slot',
  'book a time', 'calendar invite', 'interview scheduled',
  'we are pleased to invite', 'pleased to inform you',
  'move forward with your application', 'moving forward',
  'like to invite you', 'selected for an interview',
  'shortlisted', 'next steps in the process',
];

function emailContainsInterview(subject: string, bodyText: string): boolean {
  const combined = `${subject} ${bodyText}`.toLowerCase();
  return INTERVIEW_KEYWORDS.some((kw) => combined.includes(kw));
}

export async function scanEmailsForInterviews(userId: string): Promise<number> {
  try {
    // Fetch applications that are in submitted/completed/applied status (not already interview_scheduled)
    const { data: apps, error: appsErr } = await supabase
      .from('live_application_queue')
      .select('id, company_name, status, created_at')
      .eq('user_id', userId)
      .in('status', ['completed', 'applied', 'submitted', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (appsErr || !apps || apps.length === 0) return 0;

    // Fetch recent inbound emails (last 30 days for interview emails)
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: emails, error: emailsErr } = await supabase
      .from('inbound_emails')
      .select('id, from_email, subject, body_text')
      .eq('user_id', userId)
      .gte('received_at', monthAgo)
      .order('received_at', { ascending: false })
      .limit(200);

    if (emailsErr || !emails || emails.length === 0) return 0;

    let updated = 0;

    for (const email of emails) {
      const subject = email.subject || '';
      const bodyText = email.body_text || '';

      if (!emailContainsInterview(subject, bodyText)) continue;

      // Find matching application by company
      const matchedApp = apps.find((app) =>
        companyMatchesEmail(app.company_name || '', email.from_email || '', subject)
      );

      if (matchedApp) {
        const { error: updateErr } = await supabase
          .from('live_application_queue')
          .update({ status: 'interview_scheduled' })
          .eq('id', matchedApp.id);

        if (!updateErr) {
          updated++;
          console.log(`Interview detected for application ${matchedApp.id} (${matchedApp.company_name}) from email: "${subject}"`);
          // Remove from apps list so we don't double-match
          const idx = apps.indexOf(matchedApp);
          if (idx !== -1) apps.splice(idx, 1);
        }
      }
    }

    if (updated > 0) {
      console.log(`Updated ${updated} application(s) to interview_scheduled`);
    }
    return updated;
  } catch (e) {
    console.log('scanEmailsForInterviews error:', e);
    return 0;
  }
}

export async function scanEmailsForOtp(userId: string): Promise<number> {
  try {
    // Fetch pending/recent applications
    const { data: apps, error: appsErr } = await supabase
      .from('live_application_queue')
      .select('id, company_name, verification_otp, created_at')
      .eq('user_id', userId)
      .is('verification_otp', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (appsErr || !apps || apps.length === 0) return 0;

    // Fetch recent inbound emails (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: emails, error: emailsErr } = await supabase
      .from('inbound_emails')
      .select('id, from_email, subject, body_text')
      .eq('user_id', userId)
      .gte('received_at', weekAgo)
      .order('received_at', { ascending: false })
      .limit(100);

    if (emailsErr || !emails || emails.length === 0) return 0;

    let updated = 0;

    for (const email of emails) {
      const otp = extractOtp(`${email.subject || ''} ${email.body_text || ''}`);
      if (!otp) continue;

      // Find matching application by company
      const matchedApp = apps.find((app) =>
        companyMatchesEmail(app.company_name || '', email.from_email || '', email.subject || '')
      );

      if (matchedApp) {
        const { error: updateErr } = await supabase
          .from('live_application_queue')
          .update({
            verification_otp: otp,
            otp_received_at: new Date().toISOString(),
          })
          .eq('id', matchedApp.id);

        if (!updateErr) {
          updated++;
          console.log(`OTP "${otp}" linked to application ${matchedApp.id} (${matchedApp.company_name})`);
          // Remove from apps list so we don't double-match
          const idx = apps.indexOf(matchedApp);
          if (idx !== -1) apps.splice(idx, 1);
        }
      }
    }

    return updated;
  } catch (e) {
    console.log('scanEmailsForOtp error:', e);
    return 0;
  }
}
