import type { TextItem, FeatureSet, TextScore } from './types';

/**
 * Feature scoring system ported from OpenResume.
 * Runs each text item through feature sets and returns the one with highest score.
 */
export function getTextWithHighestScore(
  textItems: TextItem[],
  featureSets: FeatureSet[],
  returnEmptyIfNotPositive = true,
  concatenateSameScore = false
): string {
  const scores: TextScore[] = textItems.map(item => ({
    text: item.text,
    score: 0,
    match: false,
  }));

  for (let i = 0; i < textItems.length; i++) {
    const item = textItems[i];
    for (const featureSet of featureSets) {
      const [hasFeature, score, returnMatchingText] = featureSet;
      const result = hasFeature(item);
      if (result) {
        let text = item.text;
        if (returnMatchingText && typeof result === 'object') {
          text = result[0];
        }
        if (item.text === text) {
          scores[i].score += score;
          if (returnMatchingText) scores[i].match = true;
        } else {
          scores.push({ text, score, match: true });
        }
      }
    }
  }

  let bestTexts: string[] = [];
  let highestScore = -Infinity;
  for (const { text, score } of scores) {
    if (score >= highestScore) {
      if (score > highestScore) bestTexts = [];
      bestTexts.push(text);
      highestScore = score;
    }
  }

  if (returnEmptyIfNotPositive && highestScore <= 0) return '';

  return concatenateSameScore
    ? bestTexts.map(s => s.trim()).join(' ')
    : (bestTexts[0] ?? '');
}

// Common feature functions
export const isBold = (item: TextItem) => item.bold;
export const hasLetter = (item: TextItem) => /[a-zA-Z]/.test(item.text);
export const hasNumber = (item: TextItem) => /[0-9]/.test(item.text);
export const hasComma = (item: TextItem) => item.text.includes(',');
export const hasAt = (item: TextItem) => item.text.includes('@');
export const hasSlash = (item: TextItem) => item.text.includes('/');
export const hasParenthesis = (item: TextItem) => /\([0-9]+\)/.test(item.text);
export const has4OrMoreWords = (item: TextItem) => item.text.split(' ').length >= 4;
export const hasLetterAndIsAllUpperCase = (item: TextItem) =>
  hasLetter(item) && item.text.toUpperCase() === item.text;
export const matchOnlyLetterSpaceOrPeriod = (item: TextItem) =>
  item.text.match(/^[a-zA-Z\s.]+$/);
export const getHasText = (text: string) => (item: TextItem) =>
  text ? item.text.includes(text) : false;

// Date features
const hasYear = (item: TextItem) => /(?:19|20)\d{2}/.test(item.text);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const hasMonth = (item: TextItem) =>
  MONTHS.some(m => item.text.includes(m) || item.text.includes(m.slice(0, 3)));
const hasPresent = (item: TextItem) => /present|current/i.test(item.text);

export const DATE_FEATURE_SETS: FeatureSet[] = [
  [hasYear, 1],
  [hasMonth, 1],
  [hasPresent, 1],
  [hasComma, -1],
];
