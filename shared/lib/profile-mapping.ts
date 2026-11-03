/**
 * profiles row <-> UserProfile mapping, shared by the app (contexts/AuthContext)
 * and the website (website/src/auth). Keeping one copy guarantees a profile
 * saved on the web is exactly what the app would have written.
 */
import { supabase, getProfilePictureUrl } from '@/lib/supabase';
import type { UserProfile } from '@/types';
import type { OnboardingData } from '@/types/onboarding';

export function stripNullBytes<T>(value: T): T {
  return JSON.parse(JSON.stringify(value).replace(/\\u0000/g, ''));
}

/** Persist onboarding to Supabase with fallbacks; throws if completion cannot be verified. */
export async function upsertOnboardingProfileWithVerify(
  userId: string,
  profileData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const full = stripNullBytes(profileData) as Record<string, unknown>;
  const {
    experience_level: _el,
    desired_role_categories: _drc,
    user_type: _ut,
    heard_about_us: _hau,
    ...withoutOptionalCols
  } = full as Record<string, unknown> & {
    experience_level?: unknown;
    desired_role_categories?: unknown;
    user_type?: unknown;
    heard_about_us?: unknown;
  };
  const minimal: Record<string, unknown> = {
    id: userId,
    email: full.email,
    full_name: full.full_name,
    first_name: full.first_name,
    last_name: full.last_name,
    resume_url: full.resume_url,
    avatar_url: full.avatar_url,
    skills: full.skills,
    desired_roles: full.desired_roles,
    experience: full.experience,
    education: full.education,
    onboarding_data: full.onboarding_data,
    is_onboarding_complete: true,
    updated_at: full.updated_at ?? new Date().toISOString(),
  };

  const attempts = [full, withoutOptionalCols, minimal];
  let lastError = 'Could not save your profile. Please check your connection and try again.';

  for (const payload of attempts) {
    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) {
      lastError = error.message;
      continue;
    }
    const { data, error: verifyErr } = await supabase
      .from('profiles')
      .select('is_onboarding_complete')
      .eq('id', userId)
      .single();
    if (!verifyErr && data?.is_onboarding_complete === true) {
      return payload;
    }
    lastError = verifyErr?.message ?? 'Profile could not be verified after save';
  }

  throw new Error(lastError);
}

export function mapDbToUserProfile(profile: Record<string, any>, userId: string): UserProfile {
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const topSkills = Array.isArray(profile.top_skills) ? profile.top_skills : [];
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const education = Array.isArray(profile.education) ? profile.education : [];
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
  const achievements = Array.isArray(profile.achievements) ? profile.achievements : [];
  const favoriteCompanies = Array.isArray(profile.favorite_companies) ? profile.favorite_companies : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const documents = Array.isArray(profile.documents) ? profile.documents : [];

  let completionScore = 0;
  const total = 10;
  if (profile.full_name) completionScore++;
  if (profile.headline) completionScore++;
  if (profile.bio) completionScore++;
  if (profile.phone) completionScore++;
  if (profile.location) completionScore++;
  if (profile.avatar_url) completionScore++;
  if (skills.length > 0) completionScore++;
  if (experience.length > 0) completionScore++;
  if (education.length > 0) completionScore++;
  if (profile.linkedin_url || profile.github_url || profile.resume_url) completionScore++;

  return {
    id: userId,
    name: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    headline: profile.headline || '',
    location: profile.location || '',
    avatar: profile.avatar_url && !profile.avatar_url.includes('images.unsplash.com')
      ? getProfilePictureUrl(profile.avatar_url)
      : `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(profile.full_name || profile.first_name || profile.email || 'user')}&size=200`,
    bio: profile.bio || '',
    profileCompletion: Math.round((completionScore / total) * 100),
    totalApplications: 0,
    interviewsScheduled: 0,
    matchRate: 0,
    profileViews: 0,
    skills,
    topSkills,
    experience,
    education,
    certifications,
    achievements,
    jobPreferences: Array.isArray(profile.job_preferences) ? profile.job_preferences : [],
    workModePreferences: Array.isArray(profile.work_mode_preferences) ? profile.work_mode_preferences : [],
    salaryCurrency: profile.salary_currency || 'USD',
    salaryMinPref: profile.salary_min || 0,
    salaryMaxPref: profile.salary_max || 0,
    linkedinUrl: profile.linkedin_url || undefined,
    githubUrl: profile.github_url || undefined,
    isProfileVerified: false,
    veteranStatus: profile.veteran_status || undefined,
    disabilityStatus: profile.disability_status || undefined,
    ethnicity: profile.ethnicity || undefined,
    gender: profile.gender || undefined,
    coverLetter: profile.cover_letter || undefined,
    workAuthorizationStatus: profile.work_authorization_status || undefined,
    jobRequirements: Array.isArray(profile.job_requirements) ? profile.job_requirements : undefined,
    resumeUrl: profile.resume_url || undefined,
    openToRelocation: profile.open_to_relocation ?? null,
    authorizedToWork: profile.authorized_to_work ?? null,
    needsSponsorship: profile.needs_sponsorship ?? null,
    openToInPerson: profile.open_to_in_person ?? null,
    willingToRelocate: profile.willing_to_relocate ?? null,
    canStartImmediately: profile.can_start_immediately ?? null,
    hasReliableTransport: profile.has_reliable_transport ?? null,
    needsAccommodations: profile.needs_accommodations ?? null,
    additionalInfo: profile.additional_info || undefined,
    resumeOptimizationLevel: profile.resume_optimization_level || 'honest',
    experienceLevel: profile.experience_level || undefined,
    desiredRoleCategories: Array.isArray(profile.desired_role_categories) ? profile.desired_role_categories : undefined,
    desiredRoles: Array.isArray(profile.desired_roles) ? profile.desired_roles : undefined,
    preferredCities: Array.isArray(profile.preferred_cities) ? profile.preferred_cities : undefined,
    nearCities: Array.isArray(profile.near_cities) ? profile.near_cities : undefined,
    nearCountries: Array.isArray(profile.near_countries) ? profile.near_countries : undefined,
    favoriteCompanies,
    workdayEmail: profile.workday_email || undefined,
    workdayPassword: profile.workday_password || undefined,
    jobleverEmail: profile.joblever_email || undefined,
    jobleverPassword: profile.joblever_password || undefined,
    greenhouseEmail: profile.greenhouse_email || undefined,
    greenhousePassword: profile.greenhouse_password || undefined,
    taleoEmail: profile.taleo_email || undefined,
    taleoPassword: profile.taleo_password || undefined,
    projects,
    documents,
  };
}

/** The profiles columns for a partial UserProfile update (what saveProfile writes). */
export function profileUpdateToDb(profileData: Partial<UserProfile>): Record<string, unknown> {
  const dbData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (profileData.name !== undefined) dbData.full_name = profileData.name;
  if (profileData.email !== undefined) dbData.email = profileData.email;
  if (profileData.phone !== undefined) dbData.phone = profileData.phone;
  if (profileData.headline !== undefined) dbData.headline = profileData.headline;
  if (profileData.location !== undefined) dbData.location = profileData.location;
  if (profileData.bio !== undefined) dbData.bio = profileData.bio;
  if (profileData.avatar !== undefined) dbData.avatar_url = profileData.avatar;
  if (profileData.linkedinUrl !== undefined) dbData.linkedin_url = profileData.linkedinUrl || null;
  if (profileData.githubUrl !== undefined) dbData.github_url = profileData.githubUrl || null;
  if (profileData.skills !== undefined) dbData.skills = profileData.skills;
  if (profileData.topSkills !== undefined) dbData.top_skills = profileData.topSkills;
  if (profileData.experience !== undefined) dbData.experience = profileData.experience;
  if (profileData.education !== undefined) dbData.education = profileData.education;
  if (profileData.certifications !== undefined) dbData.certifications = profileData.certifications;
  if (profileData.achievements !== undefined) dbData.achievements = profileData.achievements;
  if (profileData.jobPreferences !== undefined) dbData.job_preferences = profileData.jobPreferences;
  if (profileData.workModePreferences !== undefined) dbData.work_mode_preferences = profileData.workModePreferences;
  if (profileData.salaryCurrency !== undefined) dbData.salary_currency = profileData.salaryCurrency;
  if (profileData.salaryMinPref !== undefined) dbData.salary_min = profileData.salaryMinPref;
  if (profileData.salaryMaxPref !== undefined) dbData.salary_max = profileData.salaryMaxPref;
  if (profileData.veteranStatus !== undefined) dbData.veteran_status = profileData.veteranStatus || null;
  if (profileData.disabilityStatus !== undefined) dbData.disability_status = profileData.disabilityStatus || null;
  if (profileData.ethnicity !== undefined) dbData.ethnicity = profileData.ethnicity || null;
  if (profileData.gender !== undefined) dbData.gender = profileData.gender || null;
  if (profileData.coverLetter !== undefined) dbData.cover_letter = profileData.coverLetter || null;
  if (profileData.workAuthorizationStatus !== undefined) dbData.work_authorization_status = profileData.workAuthorizationStatus || null;
  if (profileData.jobRequirements !== undefined) dbData.job_requirements = profileData.jobRequirements || null;
  if (profileData.resumeUrl !== undefined) dbData.resume_url = profileData.resumeUrl || null;
  if (profileData.openToRelocation !== undefined) dbData.open_to_relocation = profileData.openToRelocation ?? null;
  if (profileData.authorizedToWork !== undefined) dbData.authorized_to_work = profileData.authorizedToWork ?? null;
  if (profileData.needsSponsorship !== undefined) dbData.needs_sponsorship = profileData.needsSponsorship ?? null;
  if (profileData.openToInPerson !== undefined) dbData.open_to_in_person = profileData.openToInPerson ?? null;
  if (profileData.willingToRelocate !== undefined) dbData.willing_to_relocate = profileData.willingToRelocate ?? null;
  if (profileData.canStartImmediately !== undefined) dbData.can_start_immediately = profileData.canStartImmediately ?? null;
  if (profileData.hasReliableTransport !== undefined) dbData.has_reliable_transport = profileData.hasReliableTransport ?? null;
  if (profileData.needsAccommodations !== undefined) dbData.needs_accommodations = profileData.needsAccommodations ?? null;
  if (profileData.additionalInfo !== undefined) dbData.additional_info = profileData.additionalInfo || null;
  if (profileData.resumeOptimizationLevel !== undefined) dbData.resume_optimization_level = profileData.resumeOptimizationLevel || 'honest';
  if (profileData.favoriteCompanies !== undefined) dbData.favorite_companies = profileData.favoriteCompanies;
  if (profileData.experienceLevel !== undefined) dbData.experience_level = profileData.experienceLevel || null;
  if (profileData.desiredRoleCategories !== undefined) dbData.desired_role_categories = profileData.desiredRoleCategories;
  if (profileData.desiredRoles !== undefined) dbData.desired_roles = profileData.desiredRoles;
  if (profileData.preferredCities !== undefined) dbData.preferred_cities = profileData.preferredCities;
  if (profileData.workdayEmail !== undefined) dbData.workday_email = profileData.workdayEmail || null;
  if (profileData.workdayPassword !== undefined) dbData.workday_password = profileData.workdayPassword || null;
  if (profileData.jobleverEmail !== undefined) dbData.joblever_email = profileData.jobleverEmail || null;
  if (profileData.jobleverPassword !== undefined) dbData.joblever_password = profileData.jobleverPassword || null;
  if (profileData.greenhouseEmail !== undefined) dbData.greenhouse_email = profileData.greenhouseEmail || null;
  if (profileData.greenhousePassword !== undefined) dbData.greenhouse_password = profileData.greenhousePassword || null;
  if (profileData.taleoEmail !== undefined) dbData.taleo_email = profileData.taleoEmail || null;
  if (profileData.taleoPassword !== undefined) dbData.taleo_password = profileData.taleoPassword || null;
  if (profileData.projects !== undefined) dbData.projects = profileData.projects;
  if (profileData.documents !== undefined) dbData.documents = profileData.documents;

  return dbData;
}

/** The profiles row written when onboarding completes. */
export function onboardingProfileRow(
  userId: string,
  data: OnboardingData,
  media: { email: string; avatarUrl: string | null; resumeUrl: string | null },
): Record<string, unknown> {
  return {
    id: userId,
    email: media.email,
    first_name: data.firstName,
    last_name: data.lastName,
    full_name: `${data.firstName} ${data.lastName}`.trim(),
    gender: data.gender || null,
    phone: data.phone || null,
    country_code: data.countryCode || null,
    location: data.location || null,
    headline: data.headline || null,
    linkedin_url: data.linkedInUrl || null,
    github_url: data.githubUrl || null,
    avatar_url: media.avatarUrl || null,
    resume_url: media.resumeUrl || null,
    skills: data.skills.map(s => s.name),
    work_preferences: data.workPreferences,
    experience_level: data.experienceLevel || null,
    desired_role_categories: data.desiredRoleCategories || [],
    desired_roles: data.desiredRoles,
    salary_currency: data.salaryCurrency,
    salary_min: data.salaryMin,
    salary_max: data.salaryMax,
    preferred_cities: data.preferredCities,
    open_to_relocation: data.openToRelocation ?? null,
    veteran_status: data.veteranStatus || null,
    disability_status: data.disabilityStatus || null,
    ethnicity: data.ethnicity || null,
    experience: data.workExperience,
    education: data.education,
    projects: data.projects || [],
    certifications: data.certifications || [],
    achievements: data.achievements || [],
    work_authorization_status: data.workAuthorizationStatus || null,
    authorized_to_work: data.authorizedToWork ?? null,
    needs_sponsorship: data.needsSponsorship ?? null,
    open_to_in_person: data.openToInPerson ?? null,
    willing_to_relocate: data.willingToRelocate ?? null,
    can_start_immediately: data.canStartImmediately ?? null,
    has_reliable_transport: data.hasReliableTransport ?? null,
    needs_accommodations: data.needsAccommodations ?? null,
    additional_info: data.additionalInfo || null,
    application_password: data.applicationPassword || null,
    resume_optimization_level: data.resumeOptimizationLevel || 'honest',
    heard_about_us: data.heardAboutUs || null,
    user_type: data.userType || null,
    onboarding_data: { ...data, onboardingStep: 16 },
    is_onboarding_complete: true,
    updated_at: new Date().toISOString(),
  };
}

/** Text of the welcome email the app drops into a new user's Iris inbox. */
export function welcomeEmailRow(userId: string, proxyAddr: string, firstNameRaw: string, lastName: string) {
  const userName = `${firstNameRaw} ${lastName}`.trim();
  const firstName = (firstNameRaw || '').trim() || 'there';
  return {
    user_id: userId,
    proxy_address: proxyAddr,
    from_email: 'founders.nextquark@gmail.com',
    from_name: 'Iris',
    to_email: proxyAddr,
    subject: `Welcome to Iris, ${firstName}!`,
    body_text: `Hi ${userName},\n\nWelcome to Iris! You're in, and your first 10 job applications are free — no card needed.\n\nHere's how it works: swipe right on a job, and AI applies for you. It fills every field, tailors your resume to the job description, and submits. You can do this from anywhere — the gym, a café, between classes, wherever.\n\nAfter your 10 free applications, you can keep going for as low as ₹3 per application.\n\nStart swiping.\n\n— The Iris Team`,
    thread_id: 'welcome-to-iris',
    is_read: false,
  };
}
