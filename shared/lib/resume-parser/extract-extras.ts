import type { ParsedCertification, ParsedAchievement, SectionMap } from './types';
import { getSectionLines, getBulletPoints } from './extract-text';

export function extractCertifications(sections: SectionMap): ParsedCertification[] {
  const lines = getSectionLines(sections, 'certifications');
  if (lines.length === 0) return [];

  const certs: ParsedCertification[] = [];
  const bullets = getBulletPoints(lines);

  for (const text of bullets) {
    if (!text || text.length > 150) continue;
    // Try to split "Cert Name - Issuer" or "Cert Name, Issuer" or "Cert Name | Issuer"
    const parts = text.split(/\s*[\-|]\s*/);
    certs.push({
      name: (parts[0] || text).trim(),
      issuer: (parts[1] || '').trim(),
    });
  }

  // If no bullets found, try line by line
  if (certs.length === 0) {
    for (const line of lines) {
      const text = line.map(i => i.text).join(' ').trim();
      if (text && text.length < 150) {
        const parts = text.split(/\s*[\-|,]\s*/);
        certs.push({
          name: (parts[0] || text).replace(/^[•●▪■◆►]\s*/, '').trim(),
          issuer: (parts[1] || '').trim(),
        });
      }
    }
  }

  return certs;
}

export function extractAchievements(sections: SectionMap): ParsedAchievement[] {
  const lines = getSectionLines(sections, 'achievements');
  if (lines.length === 0) return [];

  const achievements: ParsedAchievement[] = [];
  const bullets = getBulletPoints(lines);

  for (const text of bullets) {
    if (!text || text.length > 200) continue;

    // Try to extract date from the text
    const dateMatch = text.match(/(?:(?:19|20)\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*['']?\d{2,4})/i);
    const date = dateMatch ? dateMatch[0] : '';

    // Title is the text without the date
    let title = text;
    if (date) {
      title = text.replace(date, '').replace(/\s*[\-|,]\s*$/, '').trim();
    }

    if (title) {
      achievements.push({ title, issuer: '', date });
    }
  }

  // If no bullets, try line by line
  if (achievements.length === 0) {
    for (const line of lines) {
      const text = line.map(i => i.text).join(' ').trim();
      if (text && text.length < 200) {
        achievements.push({
          title: text.replace(/^[•●▪■◆►]\s*/, '').trim(),
          issuer: '',
          date: '',
        });
      }
    }
  }

  return achievements;
}
