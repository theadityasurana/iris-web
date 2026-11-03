import type { FeatureSet, ParsedProject } from './types';
import type { SectionMap } from './types';
import { getSectionLines, divideIntoSubsections, getBulletPoints } from './extract-text';
import { getTextWithHighestScore, isBold, getHasText, DATE_FEATURE_SETS } from './scoring';

export function extractProjects(sections: SectionMap): ParsedProject[] {
  const lines = getSectionLines(sections, 'projects');
  if (lines.length === 0) return [];

  const subsections = divideIntoSubsections(lines);
  const projects: ParsedProject[] = [];

  for (const sub of subsections) {
    if (sub.length === 0) continue;

    const firstLine = sub[0]?.[0]?.text || '';

    // Skip pure "Exposure:" lines as standalone subsections
    if (sub.length === 1 && /^Exposure:/i.test(firstLine)) continue;

    // Try to extract title from first line
    // Common formats:
    // "Project Name  Link  Org/Date"
    // "Project Name  |  Org  |  Date"
    let title = firstLine;
    let date = '';

    // Extract date from first or second line
    for (let i = 0; i < Math.min(2, sub.length); i++) {
      const lineText = sub[i]?.[0]?.text || '';
      const dateMatch = lineText.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*['']?\d{0,2}\s*[\-]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*['']?\d{0,2}|(?:19|20)\d{2}\s*[\-]\s*(?:(?:19|20)\d{2}|[Pp]resent|[Cc]urrent))/i);
      if (dateMatch) {
        date = dateMatch[0];
      }
    }

    // Clean up title  - remove "Link", date, org references
    title = title
      .replace(/\s+Link\s*/gi, ' ')
      .replace(/\s{2,}.*$/, '') // Remove everything after double space (usually org/date)
      .replace(/\|.*$/, '') // Remove pipe-separated metadata
      .trim();

    // If title is too long, it's probably not a real title
    if (title.length > 80) {
      // Try to get just the bold/first part
      title = title.split(/\s{2,}/)[0] || title.slice(0, 60);
    }

    // Collect descriptions
    const descLines = sub.slice(1);
    const descriptions: string[] = [];
    for (const line of descLines) {
      const text = line[0]?.text || '';
      // Skip "Exposure:" lines  - they're metadata, not descriptions
      if (/^Exposure:/i.test(text)) continue;
      const cleaned = text.replace(/^[•●▪■◆►\-]\s*/, '').trim();
      if (cleaned) descriptions.push(cleaned);
    }

    if (title && title.length > 2) {
      projects.push({ title, date, descriptions });
    }
  }

  return projects;
}
