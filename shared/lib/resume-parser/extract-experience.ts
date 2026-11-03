import type { TextItem, FeatureSet, ParsedWorkExperience } from './types';
import type { SectionMap } from './types';
import { getSectionLines, divideIntoSubsections, getBulletPoints } from './extract-text';
import {
  getTextWithHighestScore, isBold, hasNumber, getHasText, DATE_FEATURE_SETS,
} from './scoring';

const JOB_TITLES = [
  'Accountant', 'Administrator', 'Advisor', 'Agent', 'Analyst', 'Apprentice',
  'Architect', 'Assistant', 'Associate', 'Auditor', 'Consultant', 'Coordinator',
  'Developer', 'Designer', 'Director', 'Editor', 'Engineer', 'Extern', 'Founder',
  'Co-Founder', 'Freelancer', 'Head', 'Intern', 'Lead', 'Manager', 'Member',
  'Officer', 'Operator', 'President', 'Producer', 'Recruiter', 'Representative',
  'Researcher', 'Sales', 'Scientist', 'Specialist', 'Supervisor', 'Teacher',
  'Technician', 'Trainee', 'Treasurer', 'Tutor', 'Vice', 'VP', 'Volunteer',
  'Worker', 'CEO', 'CTO', 'CFO', 'COO', 'CIO',
];

const hasJobTitle = (item: TextItem) =>
  JOB_TITLES.some(t => item.text.split(/[\s,|]+/).some(w => w === t));
const hasMoreThan5Words = (item: TextItem) => item.text.split(/\s/).length > 5;

const JOB_TITLE_FEATURES: FeatureSet[] = [
  [hasJobTitle, 4],
  [hasNumber, -4],
  [hasMoreThan5Words, -2],
];

/**
 * Try to parse "Company | Role" or "Company  -  Role" format from a single line
 */
function parsePipeLine(text: string): { company: string; jobTitle: string } | null {
  // Match "Company | Role Location" or "Company  |  Role"
  const pipeMatch = text.match(/^(.+?)\s*\|\s*(.+?)(?:\s{2,}.*)?$/);
  if (pipeMatch) {
    return { company: pipeMatch[1].trim(), jobTitle: pipeMatch[2].trim() };
  }
  return null;
}

export function extractWorkExperience(sections: SectionMap): ParsedWorkExperience[] {
  const lines = getSectionLines(sections, 'experience');
  if (lines.length === 0) return [];

  const subsections = divideIntoSubsections(lines);
  const experiences: ParsedWorkExperience[] = [];

  for (const sub of subsections) {
    const allText = sub.map(l => l[0]?.text || '').join(' ');

    // Skip "Exposure:" only lines
    if (sub.length === 1 && /^Exposure:/i.test(sub[0][0]?.text || '')) continue;

    // Try pipe-separated format first (e.g., "S&P Global | AI Engineering Intern")
    const firstLineText = sub[0]?.[0]?.text || '';
    const pipeResult = parsePipeLine(firstLineText);

    let company = '';
    let jobTitle = '';
    let date = '';
    let descStartIdx = 1;

    if (pipeResult) {
      company = pipeResult.company;
      jobTitle = pipeResult.jobTitle;
      // Look for date in the first few lines
      for (let i = 0; i < Math.min(3, sub.length); i++) {
        const lineText = sub[i]?.[0]?.text || '';
        const dateMatch = lineText.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*['']?\d{0,2}\s*[\-]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*['']?\d{0,2}|(?:19|20)\d{2}\s*[\-]\s*(?:(?:19|20)\d{2}|[Pp]resent|[Cc]urrent))/i);
        if (dateMatch) {
          date = dateMatch[0];
          descStartIdx = i + 1;
          break;
        }
      }
      // If no date found in separate line, check the Exposure line
      if (!date) {
        for (let i = 0; i < Math.min(3, sub.length); i++) {
          const lineText = sub[i]?.[0]?.text || '';
          if (/Exposure:/i.test(lineText)) {
            const dateInExposure = lineText.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*['']?\d{0,2}\s*[\-]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*['']?\d{0,2})/i);
            if (dateInExposure) date = dateInExposure[0];
            descStartIdx = Math.max(descStartIdx, i + 1);
            break;
          }
        }
      }
    } else {
      // Fallback: use feature scoring
      const infoLineCount = Math.min(3, sub.length);
      const infoItems = sub.slice(0, infoLineCount).flat();
      descStartIdx = infoLineCount;

      date = getTextWithHighestScore(infoItems, DATE_FEATURE_SETS);
      jobTitle = getTextWithHighestScore(infoItems, JOB_TITLE_FEATURES);

      const COMPANY_FEATURES: FeatureSet[] = [
        [isBold, 2],
        [getHasText(date), -4],
        [getHasText(jobTitle), -4],
      ];
      company = getTextWithHighestScore(infoItems, COMPANY_FEATURES, false);
    }

    // Collect descriptions (bullet points)
    const descLines = sub.slice(descStartIdx);
    const descriptions = getBulletPoints(descLines);

    if (company || jobTitle) {
      experiences.push({ company, jobTitle, date, descriptions });
    }
  }

  return experiences;
}
