import type { TextItem, FeatureSet, ParsedEducation } from './types';
import type { SectionMap } from './types';
import { getSectionLines, divideIntoSubsections, getBulletPoints } from './extract-text';
import { getTextWithHighestScore, hasComma, hasLetter, hasNumber, DATE_FEATURE_SETS } from './scoring';

const SCHOOLS = ['College', 'University', 'Institute', 'School', 'Academy', 'Polytechnic', 'IIT', 'NIT', 'BITS', 'MIT', 'Stanford', 'Harvard', 'Berkeley', 'Varanasi', 'Delhi', 'Bombay', 'Madras', 'Kharagpur', 'Kanpur', 'Roorkee', 'Guwahati', 'Hyderabad'];
const DEGREES = ['Associate', 'Bachelor', 'Master', 'PhD', 'Ph.D', 'Doctorate', 'Diploma', 'B.Tech', 'M.Tech', 'B.E.', 'M.E.', 'B.Sc', 'M.Sc', 'B.A.', 'M.A.', 'BBA', 'MBA', 'B.Com', 'M.Com', 'B.S.', 'M.S.', 'BTech', 'MTech', 'Integrated'];
const FIELDS = ['Computer Science', 'Engineering', 'Business', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Finance', 'Marketing', 'Management', 'Information Technology', 'Data Science', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Aerospace', 'Biomedical', 'Environmental', 'Industrial', 'Software', 'Electronics', 'Communication', 'Arts', 'Design', 'Architecture', 'Law', 'Medicine', 'Psychology', 'Sociology', 'Political Science', 'History', 'Philosophy', 'English', 'Accounting', 'Engineering Physics'];

const hasSchool = (item: TextItem) =>
  SCHOOLS.some(s => item.text.includes(s));
const hasDegree = (item: TextItem) =>
  DEGREES.some(d => item.text.includes(d)) || /[ABM][A-Z.]/.test(item.text);
const matchGPA = (item: TextItem) => item.text.match(/[0-9]\.\d{1,2}\s*\/\s*(?:10|4)/) || item.text.match(/GPA[:\s]*[0-4]\.\d{1,2}/i);

const SCHOOL_FEATURES: FeatureSet[] = [
  [hasSchool, 4],
  [hasDegree, -4],
  [hasNumber, -4],
];

const DEGREE_FEATURES: FeatureSet[] = [
  [hasDegree, 4],
  [hasSchool, -4],
  [hasNumber, -3],
];

const GPA_FEATURES: FeatureSet[] = [
  [matchGPA, 4, true],
  [hasComma, -3],
  [hasLetter, -4],
];

function extractField(textItems: TextItem[]): string {
  const allText = textItems.map(i => i.text).join(' ');
  for (const field of FIELDS) {
    if (allText.toLowerCase().includes(field.toLowerCase())) return field;
  }
  const inMatch = allText.match(/\bin\s+([A-Z][a-zA-Z\s&]+?)(?:\s*[,|•\-]|\s*$)/);
  if (inMatch) return inMatch[1].trim();
  return '';
}

/**
 * Check if a subsection actually contains education content.
 * This prevents work experience or project lines from being misclassified.
 */
function isEducationContent(textItems: TextItem[]): boolean {
  const allText = textItems.map(i => i.text).join(' ');
  const hasSchoolKeyword = SCHOOLS.some(s => allText.includes(s));
  const hasDegreeKeyword = DEGREES.some(d => allText.includes(d));
  const hasGPA = /GPA|CGPA|[0-9]\.\d{1,2}\s*\/\s*(?:10|4)/i.test(allText);
  return hasSchoolKeyword || hasDegreeKeyword || hasGPA;
}

export function extractEducation(sections: SectionMap): ParsedEducation[] {
  const lines = getSectionLines(sections, 'education');
  if (lines.length === 0) return [];

  const subsections = divideIntoSubsections(lines);
  const educations: ParsedEducation[] = [];

  for (const sub of subsections) {
    const textItems = sub.flat();

    // Strict check: only process if it actually looks like education
    if (!isEducationContent(textItems)) continue;

    const school = getTextWithHighestScore(textItems, SCHOOL_FEATURES);
    const degree = getTextWithHighestScore(textItems, DEGREE_FEATURES);
    const gpa = getTextWithHighestScore(textItems, GPA_FEATURES);
    const date = getTextWithHighestScore(textItems, DATE_FEATURE_SETS);
    const field = extractField(textItems);

    const descStartIdx = Math.min(2, sub.length);
    const descriptions = getBulletPoints(sub.slice(descStartIdx));

    if (school || degree) {
      educations.push({ school, degree, field, date, gpa, descriptions });
    }
  }

  return educations;
}
