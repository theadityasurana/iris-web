import type { TextItem, Line, Lines, SectionMap } from './types';

const BULLET_POINTS = ['⋅', '∙', '🞄', '•', '⦁', '⚫︎', '●', '⬤', '⚬', '○', '►', '▪', '■', '◆', '✦', '✧', '★', '☆'];

// Map of normalized section name → internal key
// Order matters  - first match wins
const SECTION_PATTERNS: [string, RegExp][] = [
  ['experience', /^(?:work\s*)?experience|employment|work\s*history|professional\s*experience|internship/],
  ['education', /^education|academic|qualification/],
  ['skills', /^skills?(?:\s+and\s+interests?)?|technical\s*skills?|core\s*competenc|proficienc|expertise|technologies/],
  ['projects', /^projects?|personal\s*projects?|academic\s*projects?|key\s*projects?/],
  ['certifications', /^certifications?|certificates?|licen[sc]es?|accreditations?|credentials?/],
  ['achievements', /^achievements?|awards?(?:\s+and\s+achievements?)?|honors?|accomplishments?|recognition/],
  ['summary', /^summary|objective|about\s*me|professional\s*summary|career\s*objective|profile\s*summary/],
];

/**
 * Normalize text for section matching:
 * - Collapse multiple spaces (handles "S  KILLS" → "SKILLS")
 * - Remove non-letter chars except spaces
 * - Lowercase
 */
function normalizeForSectionMatch(text: string): string {
  return text
    .replace(/\s+/g, '') // Remove ALL spaces first to handle "S  K  I  L  L  S"
    .replace(/[^a-zA-Z]/g, '') // Remove non-letters
    .toLowerCase();
}

/**
 * Also try a "collapse multi-space" approach that preserves word boundaries
 */
function collapseSpaces(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z\s&]/g, '')
    .trim()
    .toLowerCase();
}

export function textToLines(rawText: string): Lines {
  const rawLines = rawText.split('\n').filter(l => l.trim().length > 0);
  const lines: Lines = [];

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const isAllCaps = /[A-Z]/.test(trimmed) && trimmed.replace(/[^a-zA-Z]/g, '') === trimmed.replace(/[^a-zA-Z]/g, '').toUpperCase() && /[A-Za-z]{2,}/.test(trimmed);

    const item: TextItem = {
      text: trimmed,
      bold: isAllCaps,
      isEOL: true,
    };
    lines.push([item]);
  }

  return lines;
}

export function groupLinesIntoSections(lines: Lines): SectionMap {
  const sections: SectionMap = {};
  let currentSection = 'profile';
  let sectionLines: Lines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const detectedSection = detectSectionTitle(line, i);

    if (detectedSection) {
      console.log(`[RESUME-PARSER] 📌 Section "${detectedSection}" detected at line ${i}: "${line[0].text.slice(0, 60)}"`);
      if (sectionLines.length > 0 || currentSection === 'profile') {
        sections[currentSection] = [...sectionLines];
      }
      currentSection = detectedSection;
      sectionLines = [];
    } else {
      sectionLines.push(line);
    }
  }

  if (sectionLines.length > 0) {
    sections[currentSection] = sectionLines;
  }

  return sections;
}

function detectSectionTitle(line: Line, lineNumber: number): string | null {
  if (line.length === 0) return null;
  if (lineNumber < 2) return null;

  const text = line[0].text.trim();

  // Skip lines that are clearly content (bullet points, very long lines)
  if (text.length > 80) return null;
  if (BULLET_POINTS.some(b => text.startsWith(b))) return null;
  if (text.startsWith('●') || text.startsWith('•') || text.startsWith('-')) return null;

  // Normalize the text two ways for matching
  const collapsed = normalizeForSectionMatch(text); // "SKILLS AND INTERESTS" → "skillsandinterests"
  const spaced = collapseSpaces(text); // "S  KILLS  AND  I  NTERESTS" → "skills and interests"

  // Check word count on the spaced version (real words after collapsing)
  const realWordCount = spaced.split(/\s+/).filter(w => w.length > 0 && w !== 'and' && w !== 'of').length;
  if (realWordCount > 5) return null;

  for (const [section, pattern] of SECTION_PATTERNS) {
    if (pattern.test(collapsed) || pattern.test(spaced)) {
      return section;
    }
  }

  // Fallback: check if the line is ALL CAPS and short  - might be a section header we don't recognize
  // but at least don't lump it with the previous section
  if (line[0].bold && text.length < 40 && realWordCount <= 4) {
    // Check partial keyword matches
    if (/experience|intern/i.test(collapsed)) return 'experience';
    if (/project/i.test(collapsed)) return 'projects';
    if (/skill|tech/i.test(collapsed)) return 'skills';
    if (/award|achiev|honor/i.test(collapsed)) return 'achievements';
    if (/certif|licen/i.test(collapsed)) return 'certifications';
    if (/educat/i.test(collapsed)) return 'education';
  }

  return null;
}

export function getSectionLines(sections: SectionMap, sectionKey: string): Lines {
  if (sections[sectionKey]) return sections[sectionKey];

  // Fuzzy match section names
  const pattern = SECTION_PATTERNS.find(([key]) => key === sectionKey)?.[1];
  if (pattern) {
    for (const name of Object.keys(sections)) {
      const normalized = normalizeForSectionMatch(name);
      const spaced = collapseSpaces(name);
      if (pattern.test(normalized) || pattern.test(spaced)) {
        return sections[name];
      }
    }
  }

  return [];
}

export function divideIntoSubsections(lines: Lines): Lines[] {
  if (lines.length === 0) return [];

  const subsections: Lines[] = [];
  let current: Lines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line[0]?.text || '';

    if (i > 0 && isNewSubsection(text, lines, i)) {
      if (current.length > 0) {
        subsections.push(current);
        current = [];
      }
    }
    current.push(line);
  }

  if (current.length > 0) {
    subsections.push(current);
  }

  return subsections;
}

function isNewSubsection(text: string, lines: Lines, index: number): boolean {
  const line = lines[index];
  const prevLine = lines[index - 1];
  if (!line[0] || !prevLine?.[0]) return false;

  const prevText = prevLine[0].text;

  // Bold line after a bullet-point line suggests new subsection
  if (line[0].bold && !prevLine[0].bold) return true;

  // Previous line is a bullet point, current line is short and has no bullet → new subsection header
  const prevIsBullet = BULLET_POINTS.some(b => prevText.trimStart().startsWith(b)) || prevText.trimStart().startsWith('●');
  if (prevIsBullet && text.length < 80 && !BULLET_POINTS.some(b => text.trimStart().startsWith(b)) && !text.trimStart().startsWith('●')) {
    // Extra check: current line should look like a title (has a company name, date, or pipe separator)
    if (/\|/.test(text) || hasDatePattern(text) || (text.length < 60 && /[A-Z]/.test(text[0]))) {
      return true;
    }
  }

  return false;
}

function hasDatePattern(text: string): boolean {
  return /(?:19|20)\d{2}/.test(text) || /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(text) || /present/i.test(text);
}

export function getBulletPoints(lines: Lines): string[] {
  const results: string[] = [];
  for (const line of lines) {
    const text = line.map(item => item.text).join(' ').trim();
    if (!text) continue;

    let cleaned = text;
    for (const bullet of [...BULLET_POINTS, '●']) {
      if (cleaned.startsWith(bullet)) {
        cleaned = cleaned.slice(bullet.length).trim();
        break;
      }
    }
    if (cleaned) results.push(cleaned);
  }
  return results;
}

export { BULLET_POINTS };
