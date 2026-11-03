import type { ParsedResume } from './types';
import { textToLines, groupLinesIntoSections } from './extract-text';
import { extractProfile } from './extract-profile';
import { extractWorkExperience } from './extract-experience';
import { extractEducation } from './extract-education';
import { extractProjects } from './extract-projects';
import { extractSkills } from './extract-skills';
import { extractCertifications, extractAchievements } from './extract-extras';

const LOG = '[RESUME-PARSER]';

/**
 * Parse raw text extracted from a PDF resume into structured data.
 */
export function parseResumeFromText(rawText: string): ParsedResume {
  console.log(LOG, '🧠 Starting text → sections grouping...');
  const lines = textToLines(rawText);
  console.log(LOG, '🧠 Lines detected:', lines.length);
  const sections = groupLinesIntoSections(lines);
  const sectionNames = Object.keys(sections);
  console.log(LOG, '🧠 Sections found:', sectionNames);
  for (const name of sectionNames) {
    console.log(LOG, `  📂 "${name}":`, sections[name].length, 'lines');
  }

  const profile = extractProfile(sections);
  const workExperiences = extractWorkExperience(sections);
  const educations = extractEducation(sections);
  const projects = extractProjects(sections);
  const skills = extractSkills(sections, rawText);
  const certifications = extractCertifications(sections);
  const achievements = extractAchievements(sections);

  return { profile, workExperiences, educations, projects, skills, certifications, achievements };
}

/**
 * Map ParsedResume to the app's onboarding/profile data shape.
 * This is what gets sent back to the client.
 */
export function mapToOnboardingData(parsed: ParsedResume) {
  const { profile, workExperiences, educations, projects, skills, certifications, achievements } = parsed;

  // Split name into first/last
  const nameParts = profile.name.split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Parse phone  - strip country code prefix for the phone field
  const phone = profile.phone.replace(/^\+\d{1,3}\s*/, '').trim();

  // Map work experiences
  const mappedExperience = workExperiences.map((exp, i) => {
    const { startMonth, startYear, endMonth, endYear, isCurrent } = parseDateRange(exp.date);
    return {
      id: String(i + 1),
      title: exp.jobTitle,
      company: exp.company,
      employmentType: 'Full-time',
      location: '',
      isRemote: false,
      startMonth,
      startYear,
      endMonth,
      endYear,
      // The profile reads startDate/endDate; without these the fallback
      // parser's job dates were silently dropped.
      startDate: [startMonth.slice(0, 3), startYear].filter(Boolean).join(' '),
      endDate: isCurrent ? null : [endMonth.slice(0, 3), endYear].filter(Boolean).join(' '),
      isCurrent,
      description: exp.descriptions.join('\n• '),
    };
  });

  // Map education
  const mappedEducation = educations.map((edu, i) => {
    const { startYear, endYear } = parseDateRange(edu.date);
    return {
      id: String(i + 1),
      institution: edu.school,
      degree: edu.degree,
      field: edu.field,
      startYear,
      endYear,
    };
  });

  // Map skills
  const mappedSkills = skills.map(name => ({
    name,
    level: 'intermediate' as const,
    yearsOfExperience: 2,
  }));

  // Map projects
  const mappedProjects = projects.map((proj, i) => ({
    id: `proj${i + 1}`,
    title: proj.title,
    organization: '',
    date: proj.date,
    exposure: [] as string[],
    bullets: proj.descriptions,
    link: '',
  }));

  // Map certifications
  const mappedCertifications = certifications.map((cert, i) => ({
    id: `cert${i + 1}`,
    name: cert.name,
    issuingOrganization: cert.issuer,
    credentialUrl: '',
    skills: [] as string[],
  }));

  // Map achievements
  const mappedAchievements = achievements.map((ach, i) => ({
    id: `ach${i + 1}`,
    title: ach.title,
    issuer: ach.issuer,
    date: ach.date,
    description: '',
  }));

  // Infer experience level from work experience
  const experienceLevel = inferExperienceLevel(workExperiences);

  return {
    firstName,
    lastName,
    phone,
    location: profile.location,
    headline: buildHeadline(workExperiences, educations, profile.summary),
    linkedInUrl: profile.linkedInUrl,
    githubUrl: profile.githubUrl,
    workExperience: mappedExperience,
    education: mappedEducation,
    skills: mappedSkills,
    projects: mappedProjects,
    certifications: mappedCertifications,
    achievements: mappedAchievements,
    experienceLevel,
  };
}

function buildHeadline(
  experiences: { jobTitle: string; company: string }[],
  educations: { degree: string; school: string }[],
  summary: string
): string {
  if (experiences.length > 0 && experiences[0].jobTitle) {
    const e = experiences[0];
    return e.company ? `${e.jobTitle} at ${e.company}` : e.jobTitle;
  }
  if (educations.length > 0 && educations[0].degree) {
    const ed = educations[0];
    return ed.school ? `${ed.degree} at ${ed.school}` : ed.degree;
  }
  return summary ? summary.slice(0, 100) : '';
}

function parseDateRange(dateStr: string): {
  startMonth: string; startYear: string;
  endMonth: string; endYear: string;
  isCurrent: boolean;
} {
  const result = { startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false };
  if (!dateStr) return result;

  result.isCurrent = /present|current|now/i.test(dateStr);

  const MONTHS: Record<string, string> = {
    jan: 'January', feb: 'February', mar: 'March', apr: 'April',
    may: 'May', jun: 'June', jul: 'July', aug: 'August',
    sep: 'September', oct: 'October', nov: 'November', dec: 'December',
  };

  // Find all month-year pairs
  const monthYearPattern = /(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*)?(\d{4})/gi;
  const matches = Array.from(dateStr.matchAll(monthYearPattern));

  if (matches.length >= 1) {
    const startMatch = matches[0];
    if (startMatch[1]) {
      const key = startMatch[1].slice(0, 3).toLowerCase();
      result.startMonth = MONTHS[key] || startMatch[1];
    }
    result.startYear = startMatch[2];
  }

  if (matches.length >= 2) {
    const endMatch = matches[1];
    if (endMatch[1]) {
      const key = endMatch[1].slice(0, 3).toLowerCase();
      result.endMonth = MONTHS[key] || endMatch[1];
    }
    result.endYear = endMatch[2];
  }

  return result;
}

function inferExperienceLevel(experiences: { date: string }[]): string {
  if (experiences.length === 0) return 'entry_level';

  let totalYears = 0;
  for (const exp of experiences) {
    const years = Array.from(exp.date.matchAll(/(\d{4})/g)).map(m => parseInt(m[1]));
    if (years.length >= 2) {
      totalYears += Math.abs(years[1] - years[0]);
    } else if (years.length === 1) {
      const currentYear = new Date().getFullYear();
      if (/present|current/i.test(exp.date)) {
        totalYears += currentYear - years[0];
      }
    }
  }

  if (totalYears === 0) return 'internship';
  if (totalYears <= 1) return 'entry_level';
  if (totalYears <= 2) return 'junior';
  if (totalYears <= 5) return 'mid';
  if (totalYears <= 9) return 'senior';
  return 'expert';
}

export type { ParsedResume };
