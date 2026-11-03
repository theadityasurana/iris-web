import type { Job, UserProfile } from '@/types';
import { generateGPTFitWriteup } from './gpt-ranking';

export interface MatchBreakdown {
  overall: number; // 0-100
  fitLabel: 'Strong Fit' | 'Good Fit' | 'Stretch';
  fitScore: number; // 0-5 scale
  skills: number; // 0-100
  experience: number; // 0-100
  keywords: number; // 0-100
  roleAlignment: number; // 0-100
  location: number; // 0-100
}

/**
 * Compute a detailed match breakdown with per-category percentages.
 * Returns scores for skills, experience, keywords, role alignment, and location.
 */
export function computeMatchBreakdown(profile: UserProfile | null, job: Job): MatchBreakdown {
  if (!profile) return { overall: 50, fitLabel: 'Stretch', fitScore: 2.5, skills: 50, experience: 50, keywords: 50, roleAlignment: 50, location: 50 };

  const skillsRaw = scoreSkills(profile.skills || [], job.skills || [], job.requirements || [], job.description || '');
  const expRaw = scoreExperienceLevel(profile.experienceLevel || '', job.experienceLevel || '');
  const locRaw = scoreLocation(profile.location || '', profile.preferredCities || [], job.location || '', job.locationType);
  const roleRaw = scoreRoleMatch(profile.desiredRoles || [], job.jobTitle || '');

  // Keywords: how many job skills appear in user's skills + description
  const jobKeywords = [...(job.skills || []), ...(job.requirements || [])].map(s => s.toLowerCase().trim()).filter(Boolean);
  const userSkillsLower = (profile.skills || []).map(s => s.toLowerCase().trim());
  const userExpText = (profile.experience || []).map(e => `${e.title} ${e.description || ''} ${(e.skills || []).join(' ')}`).join(' ').toLowerCase();
  let kwMatched = 0;
  for (const kw of jobKeywords) {
    if (userSkillsLower.some(s => s.includes(kw) || kw.includes(s)) || userExpText.includes(kw)) kwMatched++;
  }
  const keywordsPercent = jobKeywords.length > 0 ? Math.round((kwMatched / jobKeywords.length) * 100) : 70;

  // Normalize each to 0-100
  const skills = Math.round((skillsRaw / 40) * 100);
  const experience = Math.round((expRaw / 20) * 100);
  const location = Math.round((locRaw / 15) * 100);
  const roleAlignment = Math.round((roleRaw / 15) * 100);

  const overall = computeMatchScore(profile, job);
  const fitScore = Math.round((overall / 20) * 10) / 10; // 0-5 scale
  const fitLabel: MatchBreakdown['fitLabel'] = overall >= 75 ? 'Strong Fit' : overall >= 55 ? 'Good Fit' : 'Stretch';

  return { overall, fitLabel, fitScore, skills, experience, keywords: keywordsPercent, roleAlignment, location };
}

/**
 * Compute a real match score (0-100) between a user profile and a job.
 * Runs entirely client-side  - no API call needed.
 *
 * Scoring breakdown:
 *   Skills overlap:      40 points max
 *   Experience level:    20 points max
 *   Location match:      15 points max
 *   Job type match:      10 points max
 *   Role title match:    15 points max
 */
export function computeMatchScore(profile: UserProfile | null, job: Job): number {
  if (!profile) return 50; // Default if no profile

  let score = 0;

  // 1. Skills overlap (40 points)
  score += scoreSkills(profile.skills || [], job.skills || [], job.requirements || [], job.description || '');

  // 2. Experience level match (20 points)
  score += scoreExperienceLevel(profile.experienceLevel || '', job.experienceLevel || '');

  // 3. Location match (15 points)
  score += scoreLocation(profile.location || '', profile.preferredCities || [], job.location || '', job.locationType);

  // 4. Job type preferences (10 points)
  score += scoreJobType(profile.jobPreferences || [], profile.workModePreferences || [], job.employmentType || '', job.locationType);

  // 5. Desired role title match (15 points)
  score += scoreRoleMatch(profile.desiredRoles || [], job.jobTitle || '');

  return Math.min(100, Math.max(10, Math.round(score)));
}

function scoreSkills(userSkills: string[], jobSkills: string[], jobRequirements: string[], description: string): number {
  if (userSkills.length === 0) return 15; // Neutral if no skills listed

  // Combine job skills + requirements + description keywords
  const jobKeywords = new Set<string>();
  for (const s of jobSkills) jobKeywords.add(s.toLowerCase().trim());
  for (const r of jobRequirements) {
    // Extract individual words/phrases from requirements
    r.toLowerCase().split(/[,;|]/).forEach(part => {
      const trimmed = part.trim();
      if (trimmed.length > 1 && trimmed.length < 40) jobKeywords.add(trimmed);
    });
  }

  // Also scan description for user's skills
  const descLower = description.toLowerCase();

  if (jobKeywords.size === 0 && !description) return 20; // No job skills listed

  let matches = 0;
  const userSkillsLower = userSkills.map(s => s.toLowerCase().trim());

  for (const skill of userSkillsLower) {
    // Direct match in job skills
    if (jobKeywords.has(skill)) {
      matches++;
      continue;
    }
    // Partial match (e.g., "React" matches "React.js" or "ReactJS")
    for (const jk of jobKeywords) {
      if (jk.includes(skill) || skill.includes(jk)) {
        matches += 0.7;
        break;
      }
    }
    // Found in description
    if (descLower.includes(skill)) {
      matches += 0.5;
    }
  }

  const targetSkills = Math.max(jobKeywords.size, 3);
  const ratio = Math.min(matches / targetSkills, 1);
  return Math.round(ratio * 40);
}

function scoreExperienceLevel(userLevel: string, jobLevel: string): number {
  if (!userLevel || !jobLevel) return 10; // Neutral

  const LEVEL_MAP: Record<string, number> = {
    'internship': 0, 'entry_level': 1, 'entry': 1, 'junior': 2,
    'mid': 3, 'mid-level': 3, 'mid level': 3,
    'senior': 4, 'lead': 5, 'expert': 5, 'principal': 5, 'staff': 5,
    'director': 6, 'vp': 7, 'executive': 8,
  };

  const userNum = LEVEL_MAP[userLevel.toLowerCase()] ?? 2;
  const jobLevelLower = jobLevel.toLowerCase();
  let jobNum = 2; // default mid
  for (const [key, val] of Object.entries(LEVEL_MAP)) {
    if (jobLevelLower.includes(key)) {
      jobNum = val;
      break;
    }
  }

  const diff = Math.abs(userNum - jobNum);
  if (diff === 0) return 20;
  if (diff === 1) return 15;
  if (diff === 2) return 8;
  return 3;
}

function scoreLocation(userLocation: string, preferredCities: string[], jobLocation: string, locationType: string): number {
  // Remote jobs match everyone
  if (locationType === 'remote') return 15;

  if (!userLocation && preferredCities.length === 0) return 8;

  const jobLocLower = jobLocation.toLowerCase();

  // Check preferred cities
  for (const city of preferredCities) {
    if (jobLocLower.includes(city.toLowerCase().split(',')[0])) return 15;
  }

  // Check user's current location
  if (userLocation) {
    const userCity = userLocation.toLowerCase().split(',')[0].trim();
    if (jobLocLower.includes(userCity)) return 15;
    // Same country
    const userCountry = userLocation.toLowerCase().split(',').pop()?.trim() || '';
    const jobCountry = jobLocation.toLowerCase().split(',').pop()?.trim() || '';
    if (userCountry && jobCountry && userCountry === jobCountry) return 10;
  }

  // Hybrid gets partial credit
  if (locationType === 'hybrid') return 8;

  return 4;
}

function scoreJobType(jobPrefs: string[], workModePrefs: string[], employmentType: string, locationType: string): number {
  let score = 5; // Base

  // Job type match (Full-time, Part-time, etc.)
  if (jobPrefs.length > 0 && employmentType) {
    if (jobPrefs.some(p => p.toLowerCase() === employmentType.toLowerCase())) {
      score += 5;
    }
  } else {
    score += 3; // Neutral
  }

  // Work mode match (Remote, Onsite, Hybrid)
  if (workModePrefs.length > 0 && locationType) {
    const modeMap: Record<string, string> = { 'remote': 'Remote', 'onsite': 'Onsite', 'hybrid': 'Hybrid' };
    const jobMode = modeMap[locationType] || '';
    if (jobMode && workModePrefs.includes(jobMode)) {
      score = Math.min(score + 3, 10);
    }
  }

  return Math.min(score, 10);
}

function scoreRoleMatch(desiredRoles: string[], jobTitle: string): number {
  if (desiredRoles.length === 0) return 8; // Neutral

  const titleLower = jobTitle.toLowerCase();
  const titleWords = titleLower.split(/[\s,/\-|]+/).filter(w => w.length > 2);

  let bestMatch = 0;
  for (const role of desiredRoles) {
    const roleLower = role.toLowerCase();
    // Exact match
    if (titleLower.includes(roleLower) || roleLower.includes(titleLower)) {
      return 15;
    }
    // Word overlap
    const roleWords = roleLower.split(/[\s,/\-|]+/).filter(w => w.length > 2);
    let wordMatches = 0;
    for (const rw of roleWords) {
      if (titleWords.some(tw => tw.includes(rw) || rw.includes(tw))) {
        wordMatches++;
      }
    }
    const overlap = roleWords.length > 0 ? wordMatches / roleWords.length : 0;
    bestMatch = Math.max(bestMatch, overlap);
  }

  return Math.round(bestMatch * 15);
}

// Skill synonym groups for fuzzy matching
const SKILL_SYNONYMS: string[][] = [
  ['javascript', 'js', 'es6', 'ecmascript'],
  ['typescript', 'ts'],
  ['react', 'reactjs', 'react.js'],
  ['react native', 'react-native', 'rn'],
  ['node', 'nodejs', 'node.js'],
  ['python', 'py'],
  ['machine learning', 'ml'],
  ['artificial intelligence', 'ai'],
  ['deep learning', 'dl'],
  ['natural language processing', 'nlp'],
  ['computer vision', 'cv'],
  ['amazon web services', 'aws'],
  ['google cloud platform', 'gcp', 'google cloud'],
  ['microsoft azure', 'azure'],
  ['postgresql', 'postgres', 'psql'],
  ['mongodb', 'mongo'],
  ['kubernetes', 'k8s'],
  ['docker', 'containerization'],
  ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment'],
  ['html', 'html5'],
  ['css', 'css3', 'scss', 'sass', 'less'],
  ['sql', 'mysql', 'mssql'],
  ['restful', 'rest api', 'rest apis', 'restful api'],
  ['graphql', 'gql'],
  ['vue', 'vuejs', 'vue.js'],
  ['angular', 'angularjs', 'angular.js'],
  ['next', 'nextjs', 'next.js'],
  ['express', 'expressjs', 'express.js'],
  ['tensorflow', 'tf'],
  ['pytorch', 'torch'],
  ['data science', 'data analytics', 'data analysis'],
  ['ui/ux', 'ui ux', 'ux/ui', 'ux design', 'ui design'],
  ['figma', 'sketch', 'adobe xd'],
  ['java', 'j2ee', 'jee'],
  ['c#', 'csharp', 'c sharp', '.net', 'dotnet'],
  ['c++', 'cpp'],
  ['golang', 'go'],
  ['rust', 'rs'],
  ['swift', 'swiftui'],
  ['kotlin', 'kt'],
  ['devops', 'dev ops', 'sre', 'site reliability'],
  ['agile', 'scrum', 'kanban'],
  ['project management', 'program management', 'pm'],
  ['product management', 'product owner', 'po'],
];

function buildSynonymMap(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const group of SKILL_SYNONYMS) {
    const groupSet = new Set(group);
    for (const term of group) {
      map.set(term, groupSet);
    }
  }
  return map;
}

const SYNONYM_MAP = buildSynonymMap();

function skillsMatch(userSkill: string, jobTerm: string): boolean {
  if (userSkill === jobTerm) return true;
  if (userSkill.includes(jobTerm) || jobTerm.includes(userSkill)) return true;
  // Check synonyms
  const synonyms = SYNONYM_MAP.get(userSkill);
  if (synonyms && synonyms.has(jobTerm)) return true;
  // Reverse check
  const reverseSynonyms = SYNONYM_MAP.get(jobTerm);
  if (reverseSynonyms && reverseSynonyms.has(userSkill)) return true;
  return false;
}

interface FitSignal {
  category: 'skills' | 'experience' | 'role' | 'level' | 'location' | 'education' | 'industry';
  strength: number; // 0-1
  detail: string;
}

/**
 * Generate a ~50 word personalized writeup explaining why this job fits the user.
 * 
 * Algorithm:
 * 1. Extract all signals (skills, experience, role, level, location, education, industry)
 * 2. Score each signal by strength (0-1) using synonym-aware matching, years calc, etc.
 * 3. Rank signals by strength
 * 4. Compose a writeup from the top 2-3 strongest signals
 * 5. Ensure output is specific to THIS job + THIS user (names skills, titles, companies)
 */
export function generateFitWriteup(profile: UserProfile | null, job: Job): string {
  if (!profile) return 'Complete your profile to get personalized fit insights for this role.';

  const signals: FitSignal[] = [];

  // --- SIGNAL 1: Skills (synonym-aware, scans skills + requirements + description) ---
  const userSkillsLower = (profile.skills || []).map(s => s.toLowerCase().trim());
  const jobSkillsLower = (job.skills || []).map(s => s.toLowerCase().trim());
  const reqsTokens = (job.requirements || []).join(' ').toLowerCase().split(/[\s,;|()]+/).filter(t => t.length > 2);
  const descTokens = (job.description || '').toLowerCase().split(/[\s,;|()]+/).filter(t => t.length > 2);
  const allJobTerms = new Set([...jobSkillsLower, ...reqsTokens, ...descTokens]);

  const directMatches: string[] = [];
  const synonymMatches: string[] = [];
  const contextMatches: string[] = [];

  for (const skill of userSkillsLower) {
    // Check against listed job skills first (strongest signal)
    if (jobSkillsLower.some(js => skillsMatch(skill, js))) {
      directMatches.push(skill);
    } else if ([...(job.requirements || [])].some(r => r.toLowerCase().includes(skill) || skillsMatch(skill, r.toLowerCase()))) {
      synonymMatches.push(skill);
    } else if ((job.description || '').toLowerCase().includes(skill)) {
      contextMatches.push(skill);
    }
  }

  const totalSkillMatches = directMatches.length + synonymMatches.length * 0.7 + contextMatches.length * 0.4;
  const skillDenominator = Math.max(jobSkillsLower.length, userSkillsLower.length, 3);
  const skillStrength = Math.min(totalSkillMatches / skillDenominator, 1);

  if (directMatches.length >= 3) {
    signals.push({ category: 'skills', strength: skillStrength, detail: `${directMatches.length} of your skills are listed in this job's requirements: ${directMatches.slice(0, 4).join(', ')}` });
  } else if (directMatches.length >= 1) {
    const all = [...directMatches, ...synonymMatches].slice(0, 3);
    signals.push({ category: 'skills', strength: skillStrength, detail: `Your ${all.join(', ')} ${all.length > 1 ? 'skills are' : 'skill is'} specifically required for this position` });
  } else if (synonymMatches.length + contextMatches.length > 0) {
    const all = [...synonymMatches, ...contextMatches].slice(0, 3);
    signals.push({ category: 'skills', strength: skillStrength * 0.6, detail: `Your background in ${all.join(', ')} is relevant to the technical requirements here` });
  }

  // --- SIGNAL 2: Work experience relevance ---
  const titleLower = job.jobTitle.toLowerCase();
  const titleCoreWords = titleLower.split(/[\s,/\-|()]+/).filter(w => w.length > 2 && !['the', 'and', 'for', 'with'].includes(w));

  let bestExp: { title: string; company: string; years: number; overlap: number } | null = null;
  for (const exp of (profile.experience || [])) {
    const expTitleLower = exp.title.toLowerCase();
    const expWords = expTitleLower.split(/[\s,/\-|()]+/).filter(w => w.length > 2);
    const overlap = titleCoreWords.filter(tw => expWords.some(ew => ew.includes(tw) || tw.includes(ew))).length;
    const overlapRatio = titleCoreWords.length > 0 ? overlap / titleCoreWords.length : 0;

    // Also check if exp skills overlap with job skills
    const expSkills = (exp.skills || []).map(s => s.toLowerCase());
    const expSkillOverlap = expSkills.filter(es => jobSkillsLower.some(js => skillsMatch(es, js))).length;

    const combinedOverlap = overlapRatio + (expSkillOverlap > 0 ? 0.3 : 0);

    const start = new Date(exp.startDate);
    const end = exp.isCurrent ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
    const years = Math.max(0, (end.getTime() - start.getTime()) / (365.25 * 24 * 3600 * 1000));

    if (!bestExp || combinedOverlap > bestExp.overlap) {
      bestExp = { title: exp.title, company: exp.company, years: Math.round(years * 10) / 10, overlap: combinedOverlap };
    }
  }

  if (bestExp && bestExp.overlap >= 0.4) {
    const yearsStr = bestExp.years >= 1 ? `${Math.round(bestExp.years)} year${Math.round(bestExp.years) > 1 ? 's' : ''} as` : 'your time as';
    signals.push({ category: 'experience', strength: Math.min(bestExp.overlap, 1), detail: `Your ${yearsStr} ${bestExp.title} at ${bestExp.company} maps directly to what this role requires` });
  } else if (bestExp && bestExp.overlap >= 0.2) {
    signals.push({ category: 'experience', strength: bestExp.overlap * 0.8, detail: `Your role as ${bestExp.title} at ${bestExp.company} shares transferable responsibilities with this position` });
  }

  // --- SIGNAL 3: Desired role alignment ---
  const roleMatch = (profile.desiredRoles || []).find(r => {
    const rl = r.toLowerCase();
    if (titleLower.includes(rl) || rl.includes(titleLower)) return true;
    const roleWords = rl.split(/[\s/\-]+/).filter(w => w.length > 3);
    const matchCount = roleWords.filter(rw => titleCoreWords.some(tw => tw.includes(rw) || rw.includes(tw))).length;
    return roleWords.length > 0 && matchCount / roleWords.length >= 0.5;
  });

  if (roleMatch) {
    const exactMatch = titleLower.includes(roleMatch.toLowerCase());
    signals.push({ category: 'role', strength: exactMatch ? 0.95 : 0.7, detail: `This is ${exactMatch ? 'exactly' : 'closely aligned with'} the ${roleMatch} role you are targeting` });
  }

  // --- SIGNAL 4: Experience level fit ---
  const LEVELS: Record<string, number> = { 'internship': 0, 'entry_level': 1, 'entry': 1, 'junior': 2, 'mid': 3, 'mid-level': 3, 'senior': 4, 'lead': 5, 'expert': 5, 'principal': 5, 'staff': 5 };
  const userLvl = LEVELS[(profile.experienceLevel || '').toLowerCase()] ?? -1;
  const jobLvlLower = (job.experienceLevel || '').toLowerCase();
  let jobLvl = -1;
  for (const [k, v] of Object.entries(LEVELS)) { if (jobLvlLower.includes(k)) { jobLvl = v; break; } }

  if (userLvl >= 0 && jobLvl >= 0) {
    const diff = Math.abs(userLvl - jobLvl);
    if (diff === 0) {
      signals.push({ category: 'level', strength: 0.85, detail: `The seniority level is exactly where you are in your career right now` });
    } else if (diff === 1) {
      signals.push({ category: 'level', strength: 0.6, detail: `The seniority level closely matches your current career stage` });
    }
  }

  // --- SIGNAL 5: Location/remote ---
  const isRemote = job.locationType === 'remote';
  const prefersRemote = (profile.workModePreferences || []).some(p => p.toLowerCase() === 'remote');
  const userCity = (profile.location || '').toLowerCase().split(',')[0].trim();
  const preferredCities = (profile.preferredCities || []).map(c => c.toLowerCase().split(',')[0].trim());
  const jobLoc = (job.location || '').toLowerCase();

  if (isRemote && prefersRemote) {
    signals.push({ category: 'location', strength: 0.75, detail: `Fully remote position, matching your preferred work setup` });
  } else if (userCity && jobLoc.includes(userCity)) {
    signals.push({ category: 'location', strength: 0.7, detail: `Based in ${job.location}, your current city` });
  } else if (preferredCities.some(c => jobLoc.includes(c))) {
    const matchedCity = preferredCities.find(c => jobLoc.includes(c)) || '';
    signals.push({ category: 'location', strength: 0.65, detail: `Located in ${matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1)}, one of your preferred cities` });
  }

  // --- SIGNAL 6: Education match ---
  if (job.educationLevel && (profile.education || []).length > 0) {
    const jobEd = job.educationLevel.toLowerCase();
    const userDegrees = (profile.education || []).map(e => `${e.degree} ${e.field}`.toLowerCase());
    const hasRelevantDegree = userDegrees.some(d => {
      if (jobEd.includes('bachelor') && (d.includes('bachelor') || d.includes('b.s') || d.includes('b.a') || d.includes('btech') || d.includes('b.tech'))) return true;
      if (jobEd.includes('master') && (d.includes('master') || d.includes('m.s') || d.includes('m.a') || d.includes('mtech') || d.includes('mba'))) return true;
      if (jobEd.includes('phd') || jobEd.includes('doctorate')) return d.includes('phd') || d.includes('doctorate');
      return false;
    });
    if (hasRelevantDegree) {
      const topEd = profile.education![0];
      signals.push({ category: 'education', strength: 0.5, detail: `Your ${topEd.degree} in ${topEd.field} meets the education requirement` });
    }
  }

  // --- SIGNAL 7: Industry alignment ---
  if (job.industry) {
    const industryLower = job.industry.toLowerCase();
    const expIndustryMatch = (profile.experience || []).some(e => {
      const combined = `${e.title} ${e.description || ''} ${e.company}`.toLowerCase();
      return combined.includes(industryLower.split(' ')[0]) || industryLower.includes(e.company.toLowerCase());
    });
    if (expIndustryMatch) {
      signals.push({ category: 'industry', strength: 0.55, detail: `You have prior experience in the ${job.industry} space` });
    }
  }

  // --- COMPOSE WRITEUP from ranked signals ---
  signals.sort((a, b) => b.strength - a.strength);

  if (signals.length >= 2) {
    return signals[0].detail + '. ' + signals[1].detail + '.';
  }
  if (signals.length === 1) {
    return signals[0].detail + '.';
  }

  // Absolute fallback: use whatever data we can
  const score = computeMatchScore(profile, job);
  if (score >= 70) {
    return `This ${job.employmentType || ''} role at ${job.companyName} aligns well with your overall profile. The combination of requirements and your background makes this a realistic opportunity to pursue.`;
  }
  if (score >= 50 && userSkillsLower.length > 0) {
    return `This ${job.companyName} position shares common ground with your background in ${userSkillsLower.slice(0, 2).join(' and ')}. It could be a natural next step to broaden your experience.`;
  }
  return `This role at ${job.companyName} could expand your experience into ${job.industry || 'a new domain'}. While not a direct overlap with your current profile, it builds on transferable skills.`;
}

/**
 * Batch compute match scores and fit writeups for an array of jobs.
 * Uses local heuristics first, then enhances top jobs with GPT writeups.
 */
export function computeMatchScores(profile: UserProfile | null, jobs: Job[]): Job[] {
  const scored = jobs.map(job => ({
    ...job,
    matchScore: computeMatchScore(profile, job),
    fitWriteup: generateFitWriteup(profile, job),
  }));

  // Async GPT enhancement for top 3 jobs (fire-and-forget, updates in background)
  if (profile) {
    const top3 = [...scored].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
    for (const job of top3) {
      generateGPTFitWriteup(profile, job).then(gptWriteup => {
        if (gptWriteup) {
          job.fitWriteup = gptWriteup;
        }
      }).catch(() => {});
    }
  }

  return scored;
}
