import { supabase } from './supabase';
import type { Job, UserProfile } from '@/types';

export interface ATSKeyword {
  keyword: string;
  matched: boolean;
}

export interface ATSScoreResult {
  score: number;
  matchedCount: number;
  totalCount: number;
  keywords: ATSKeyword[];
}

/**
 * Extract ATS-relevant keywords from a job and score against user profile.
 */
export function computeATSScore(profile: UserProfile | null, job: Job): ATSScoreResult {
  if (!profile) return { score: 0, matchedCount: 0, totalCount: 0, keywords: [] };

  const jobKeywords = extractJobKeywords(job);
  if (jobKeywords.length === 0) return { score: 85, matchedCount: 0, totalCount: 0, keywords: [] };

  const userSkillsLower = (profile.skills || []).map(s => s.toLowerCase().trim());
  const userExp = (profile.experience || [])
    .map(e => `${e.title} ${e.description || ''} ${(e.skills || []).join(' ')}`)
    .join(' ')
    .toLowerCase();

  const keywords: ATSKeyword[] = [];
  let matched = 0;

  for (const kw of jobKeywords) {
    const kwLower = kw.toLowerCase();
    const isMatched =
      userSkillsLower.some(s => s === kwLower || s.includes(kwLower) || kwLower.includes(s)) ||
      userExp.includes(kwLower);
    keywords.push({ keyword: kw, matched: isMatched });
    if (isMatched) matched++;
  }

  const score = jobKeywords.length > 0 ? Math.round((matched / jobKeywords.length) * 100) : 0;
  return { score, matchedCount: matched, totalCount: jobKeywords.length, keywords };
}

/**
 * Generate ATS score via Gemini for more accurate keyword extraction.
 * Falls back to local computation.
 */
export async function computeATSScoreWithAI(
  profile: UserProfile,
  job: Job
): Promise<ATSScoreResult> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-assist', {
      body: {
        action: 'ats-score',
        profile: {
          skills: (profile.skills || []).slice(0, 15).join(', '),
          experience: (profile.experience || []).slice(0, 3).map(e => `${e.title} at ${e.company}`).join('; '),
        },
        job: {
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          skills: (job.skills || []).join(', '),
          requirements: (job.requirements || []).join(', '),
          description: (job.description || '').slice(0, 600),
        },
      },
    });

    if (!error && data?.success && data.score != null) {
      return {
        score: data.score,
        matchedCount: data.matchedCount || 0,
        totalCount: data.totalCount || 0,
        keywords: data.keywords || [],
      };
    }
  } catch (e) {
    console.log('[ATS-AI] Error, falling back to local:', e);
  }

  return computeATSScore(profile, job);
}

function extractJobKeywords(job: Job): string[] {
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const s of (job.skills || [])) {
    const normalized = s.trim();
    if (normalized && !seen.has(normalized.toLowerCase())) {
      seen.add(normalized.toLowerCase());
      keywords.push(normalized);
    }
  }

  for (const req of (job.requirements || [])) {
    const terms = req.split(/[,;|]/).map(t => t.trim()).filter(t => t.length > 1 && t.length < 30);
    for (const term of terms) {
      if (!seen.has(term.toLowerCase()) && !isStopPhrase(term)) {
        seen.add(term.toLowerCase());
        keywords.push(term);
      }
    }
  }

  if (keywords.length < 8 && job.description) {
    const techTerms = extractTechTerms(job.description);
    for (const term of techTerms) {
      if (!seen.has(term.toLowerCase())) {
        seen.add(term.toLowerCase());
        keywords.push(term);
        if (keywords.length >= 20) break;
      }
    }
  }

  return keywords.slice(0, 20);
}

const STOP_PHRASES = new Set([
  'experience', 'years', 'ability', 'strong', 'excellent', 'good',
  'team', 'work', 'communication', 'skills', 'knowledge', 'understanding',
  'required', 'preferred', 'must', 'have', 'with', 'and', 'the',
]);

function isStopPhrase(term: string): boolean {
  return STOP_PHRASES.has(term.toLowerCase()) || term.split(' ').length > 4;
}

const TECH_PATTERN = /\b(React|Angular|Vue|Node\.?js|Python|Java|TypeScript|JavaScript|SQL|NoSQL|MongoDB|PostgreSQL|AWS|GCP|Azure|Docker|Kubernetes|GraphQL|REST|Redis|Kafka|Git|CI\/CD|TDD|Agile|Scrum|Figma|Swift|Kotlin|Go|Rust|C\+\+|\.NET|Spring|Django|Flask|FastAPI|Next\.?js|Tailwind|CSS|HTML|Terraform|Linux|Spark|Hadoop|Tableau|Power BI|Snowflake|dbt|Airflow|MLOps|PyTorch|TensorFlow|NLP|LLM|RAG|Pandas|NumPy)\b/gi;

function extractTechTerms(description: string): string[] {
  const matches: string[] = description.match(TECH_PATTERN) || [];
  const unique = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const lower = m.toLowerCase();
    if (!unique.has(lower)) {
      unique.add(lower);
      result.push(m);
    }
  }
  return result;
}
