import type { TextItem, FeatureSet } from './types';
import type { SectionMap } from './types';
import type { ParsedProfile } from './types';
import { getSectionLines } from './extract-text';
import {
  getTextWithHighestScore,
  isBold, hasNumber, hasComma, hasLetter, hasAt,
  hasSlash, hasParenthesis, has4OrMoreWords,
  hasLetterAndIsAllUpperCase, matchOnlyLetterSpaceOrPeriod,
} from './scoring';

const matchEmail = (item: TextItem) => item.text.match(/\S+@\S+\.\S+/);
const matchPhone = (item: TextItem) =>
  item.text.match(/\+?[\d\s\-().]{7,}/) || item.text.match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
const matchCityAndState = (item: TextItem) =>
  item.text.match(/[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}/) || item.text.match(/[A-Z][a-zA-Z\s]+,\s*[A-Za-z]+/);
const matchUrl = (item: TextItem) => item.text.match(/\S+\.[a-z]+\/\S+/);
const matchUrlHttp = (item: TextItem) => item.text.match(/https?:\/\/\S+\.\S+/);
const matchLinkedIn = (item: TextItem) => item.text.match(/linkedin\.com\/in\/\S+/i);
const matchGitHub = (item: TextItem) => item.text.match(/github\.com\/\S+/i);

const NAME_FEATURES: FeatureSet[] = [
  [matchOnlyLetterSpaceOrPeriod, 3, true],
  [isBold, 2],
  [hasLetterAndIsAllUpperCase, 2],
  [hasAt, -4],
  [hasNumber, -4],
  [hasParenthesis, -4],
  [hasComma, -4],
  [hasSlash, -4],
  [has4OrMoreWords, -2],
];

const EMAIL_FEATURES: FeatureSet[] = [
  [matchEmail, 4, true],
  [isBold, -1],
  [hasParenthesis, -4],
  [hasComma, -4],
  [hasSlash, -4],
];

const PHONE_FEATURES: FeatureSet[] = [
  [matchPhone, 4, true],
  [hasLetter, -4],
];

const LOCATION_FEATURES: FeatureSet[] = [
  [matchCityAndState, 4, true],
  [isBold, -1],
  [hasAt, -4],
  [hasParenthesis, -3],
  [hasSlash, -4],
];

const URL_FEATURES: FeatureSet[] = [
  [matchUrl, 4, true],
  [matchUrlHttp, 3, true],
  [isBold, -1],
  [hasAt, -4],
  [hasParenthesis, -3],
  [hasComma, -4],
];

export function extractProfile(sections: SectionMap): ParsedProfile {
  const profileLines = sections['profile'] || [];
  const textItems = profileLines.flat();

  // Also check all lines for URLs (LinkedIn/GitHub often appear in header)
  const allTextItems = Object.values(sections).flat().flat();

  const name = getTextWithHighestScore(textItems, NAME_FEATURES);
  const email = getTextWithHighestScore(textItems, EMAIL_FEATURES);
  const phone = getTextWithHighestScore(textItems, PHONE_FEATURES);
  const location = getTextWithHighestScore(textItems, LOCATION_FEATURES);
  const url = getTextWithHighestScore(textItems, URL_FEATURES);

  // Extract LinkedIn and GitHub from all text
  let linkedInUrl = '';
  let githubUrl = '';
  for (const item of [...textItems, ...allTextItems]) {
    if (!linkedInUrl) {
      const linkedInMatch = matchLinkedIn(item);
      if (linkedInMatch) linkedInUrl = linkedInMatch[0];
    }
    if (!githubUrl) {
      const githubMatch = matchGitHub(item);
      if (githubMatch) githubUrl = githubMatch[0];
    }
  }

  // Ensure URLs have protocol
  if (linkedInUrl && !linkedInUrl.startsWith('http')) linkedInUrl = 'https://' + linkedInUrl;
  if (githubUrl && !githubUrl.startsWith('http')) githubUrl = 'https://' + githubUrl;

  // Extract summary from dedicated section or profile
  const summaryLines = getSectionLines(sections, 'summary');
  const summary = summaryLines.length > 0
    ? summaryLines.flat().map(item => item.text).join(' ')
    : getTextWithHighestScore(textItems, [[has4OrMoreWords, 4], [isBold, -1], [hasAt, -4], [hasParenthesis, -3]], true, true);

  return { name, email, phone, location, url, linkedInUrl, githubUrl, summary };
}
