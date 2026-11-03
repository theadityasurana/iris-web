/**
 * Feed relevance policy — pure functions, no I/O.
 *
 * Decides which experience levels and title keywords the jobs feed asks for,
 * and how it widens them when the user runs out. Shared by the home feed
 * (app/(tabs)/(home)/index.tsx), the query builder (lib/jobs.ts) and the
 * end-to-end feed test (scripts/test-feed-relevance.ts), so all three run the
 * same rules.
 */
import { expandRolesWithSynonyms } from '@/constants/role-synonyms';
import { DOMAIN_GROUPS, getExpandedKeywords } from '@/constants/domains';
import { CATEGORY_ROLES } from '@/constants/roles';
import { ROLE_FAMILIES, FAMILY_KEYS, familyTitles, type RoleFamily } from '@/constants/role-families';
import { DEFAULT_REMOTE_CONFIG } from '@/constants/remote-config-defaults';

// ─── Tuning ──────────────────────────────────────────────────────────────────

/**
 * Feed knobs, editable from the admin website (remote_config.feed). Starts at
 * the built-in defaults; the app (lib/remote-config) and the get-feed function
 * call setFeedTuning with the live values. Kept as module state so this file
 * stays pure and runs unchanged on the phone and in the edge function.
 */
export type FeedTuning = typeof DEFAULT_REMOTE_CONFIG.feed;
export let FEED_TUNING: FeedTuning = DEFAULT_REMOTE_CONFIG.feed;
let genericWords = new Set(FEED_TUNING.generic_single_words);

export function setFeedTuning(t: FeedTuning) {
  if (t === FEED_TUNING) return;
  FEED_TUNING = t;
  genericWords = new Set(t.generic_single_words.map(w => w.toLowerCase()));
  relevanceKeywordCache.clear();
}

// ─── Experience levels ───────────────────────────────────────────────────────

/**
 * Starting rung range on LEVEL_ESCALATION_LADDER per onboarding experience:
 * the user's own level plus one below and one above.
 *   0 Internship · 1 Entry · 2 Mid · 3 Senior · 4 Lead/Principal · 5 Director/VP/C-Level
 * Junior (1–2 yrs) has no rung of its own (jobs.experience has no 'Junior'):
 * it starts at Entry through Senior, without internships.
 */

/**
 * Starting levels for a user. Escalation (getEscalatedLevels) widens further,
 * one rung at a time, once these run dry.
 */
export function getDefaultJobLevelsFromExperience(experienceLevel?: string): string[] {
  const range = experienceLevel ? FEED_TUNING.starting_levels[experienceLevel] : undefined;
  if (!range || range.length < 2) return [];
  const levels: string[] = [];
  const lo = Math.max(0, range[0]);
  const hi = Math.min(LEVEL_ESCALATION_LADDER.length - 1, range[1]);
  for (let i = lo; i <= hi; i++) levels.push(...LEVEL_ESCALATION_LADDER[i]);
  return levels;
}

/** UI job-level labels → values stored in jobs.experience. */
export const EXPERIENCE_ENUM_MAP: Record<string, string[]> = {
  'Internship':   ['Internship'],
  'Entry Level':  ['Entry Level'],
  'Mid Level':    ['Middle Level'],
  'Senior Level': ['Senior Level'],
  'Lead':         ['Lead'],
  'Principal':    ['Principal'],
  'Director':     ['Director'],
  'VP':           ['Director', 'C-Level'],
  'C-Level':      ['C-Level'],
};

export function levelsToExperienceEnums(levels: string[]): string[] {
  return [...new Set(levels.flatMap(l => EXPERIENCE_ENUM_MAP[l] || []))];
}

// ─── Titles ──────────────────────────────────────────────────────────────────

// Mirrors search_jobs_prefix_q + to_tsvector('simple', title): a keyword
// matches when its words appear consecutively and in order in the title,
// exactly, except the last word, which is a prefix after trimming a plural /
// -ing ending ("engineer" → engineer*, matching Engineer, Engineers,
// Engineering; "data engineering" → engineer* matching Data Engineer). Not
// "-er": "developer" → develop* matched "Business Development Manager".
// Phrase order keeps "product manager" off "Production Manager" and "data
// engineer" off "Software Engineer - Data Acquisition".
function titleTokens(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9.+#]+/).map(t => t.replace(/^\.+|\.+$/g, '')).filter(Boolean);
}
function lastWordStem(w: string): string {
  const stem = w.replace(/(ings|ing|s)$/, '');
  return stem.length >= 4 ? stem : w;
}
export function titleMatchesKeyword(title: string, keyword: string): boolean {
  const t = titleTokens(title);
  const k = titleTokens(keyword);
  if (k.length === 0) return false;
  const head = k.slice(0, -1);
  const tail = lastWordStem(k[k.length - 1]);
  for (let i = 0; i + k.length <= t.length; i++) {
    if (head.every((w, j) => t[i + j] === w) && t[i + head.length].startsWith(tail)) return true;
  }
  return false;
}

// Ordered ladder used for level escalation when a tier is exhausted
export const LEVEL_ESCALATION_LADDER: string[][] = [
  ['Internship'],
  ['Entry Level'],
  ['Mid Level'],
  ['Senior Level'],
  ['Lead', 'Principal'],
  ['Director', 'VP', 'C-Level'],
];

// Returns the ±1 adjacent levels around the given levels (used for filter fallbacks)
export function getAdjacentLevels(levels: string[]): string[] {
  if (levels.length === 0) return [];
  const indices = new Set<number>();
  for (let i = 0; i < LEVEL_ESCALATION_LADDER.length; i++) {
    if (LEVEL_ESCALATION_LADDER[i].some(l => levels.includes(l))) {
      if (i > 0) LEVEL_ESCALATION_LADDER[i - 1].forEach(l => indices.add(LEVEL_ESCALATION_LADDER.indexOf(LEVEL_ESCALATION_LADDER[i - 1])));
      if (i < LEVEL_ESCALATION_LADDER.length - 1) indices.add(i + 1);
      indices.add(i);
    }
  }
  // Rebuild: include original levels + one rung above + one rung below
  const result = new Set<string>(levels);
  for (let i = 0; i < LEVEL_ESCALATION_LADDER.length; i++) {
    if (LEVEL_ESCALATION_LADDER[i].some(l => levels.includes(l))) {
      if (i > 0) LEVEL_ESCALATION_LADDER[i - 1].forEach(l => result.add(l));
      if (i < LEVEL_ESCALATION_LADDER.length - 1) LEVEL_ESCALATION_LADDER[i + 1].forEach(l => result.add(l));
    }
  }
  return [...result];
}

/**
 * Next wider level set once `currentLevels` are exhausted, or null when the
 * whole ladder is covered. Widens one rung at a time, alternating around the
 * user's own level (the centre of `baselineLevels`) and preferring up on a
 * tie — so a mid-level user sees Lead roles before internships.
 */
export function getEscalatedLevels(currentLevels: string[], baselineLevels: string[] = currentLevels): string[] | null {
  if (currentLevels.length === 0) return null;
  const rungs = (levels: string[]) => LEVEL_ESCALATION_LADDER
    .map((r, i) => (r.some(l => levels.includes(l)) ? i : -1))
    .filter(i => i >= 0);
  const cur = rungs(currentLevels);
  const base = rungs(baselineLevels.length ? baselineLevels : currentLevels);
  const lowest = Math.min(...cur);
  const highest = Math.max(...cur);
  const centre = (Math.min(...base) + Math.max(...base)) / 2;
  const canGoUp = highest + 1 < LEVEL_ESCALATION_LADDER.length;
  const canGoDown = lowest - 1 >= 0;
  if (!canGoUp && !canGoDown) return null;
  const expandUp = !canGoDown || (canGoUp && highest - centre <= centre - lowest);
  return [...currentLevels, ...LEVEL_ESCALATION_LADDER[expandUp ? highest + 1 : lowest - 1]];
}

// ─── Seniority from the title ────────────────────────────────────────────────

// Many rows have no jobs.experience value, which the level filter lets
// through for everyone — so an intern was shown "Senior Staff Full-Stack
// Engineer". When the field is blank, read the level the title states.
// Deliberately absent: "architect" (Solutions/Data Architect are roles, not
// levels) and "associate" (both a level and a job family).
const TITLE_SENIORITY: [RegExp, string][] = [
  [/\b(intern|internship|co-?op|apprentice|trainee)\b/, 'Internship'],
  [/\b(chief|cto|ceo|coo|cfo|cmo|cpo|vp|svp|evp|vice president|director|head of)\b/, 'Director'],
  [/\b(staff|principal|lead|distinguished|fellow)\b/, 'Lead'],
  [/\b(senior|sr)\b/, 'Senior Level'],
  [/\b(junior|jr|graduate|new grad|entry[- ]level|early career)\b/, 'Entry Level'],
];

export function titleSeniority(title: string): string | null {
  const t = title.toLowerCase();
  for (const [re, level] of TITLE_SENIORITY) if (re.test(t)) return level;
  return null;
}

function rungOf(level: string): number {
  return LEVEL_ESCALATION_LADDER.findIndex(r => r.includes(level));
}

/**
 * Whether a job belongs in a feed currently showing `levels`. Rows with a real
 * experience value were already filtered by the database; rows without one are
 * judged by the seniority their title states (no stated seniority = keep).
 */
export function fitsLevels(title: string, experience: string | null | undefined, levels: string[]): boolean {
  if (levels.length === 0) return true;
  if (experience && experience !== 'Not specified') return true;
  const stated = titleSeniority(title);
  if (!stated) return true;
  const rung = rungOf(stated);
  return levels.some(l => rungOf(l) === rung);
}

// ─── Role breadth ────────────────────────────────────────────────────────────

export type RoleBreadth = 0 | 1 | 2 | 3;
export const MAX_ROLE_BREADTH: RoleBreadth = 3;

/**
 * Title keywords for the user's roles at a given breadth. Ordered most- to
 * least-specific, because the list is capped and the head is kept.
 */
// Bare job nouns that match far too broadly on their own ("developer" hit
// Developer Advocate, "research" hit Research Resident). Expanded keyword
// lists drop them; a role the user typed themselves is always kept.
// The list lives in FEED_TUNING.generic_single_words (see genericWords).

export function buildRoleKeywords(desiredRoles: string[], breadth: RoleBreadth): string[] {
  if (breadth >= 3) return [];
  const own = new Set(desiredRoles.map(r => r.trim().toLowerCase()));
  // Case-insensitive de-dupe, first spelling wins (keeps the most specific order).
  const uniq = (list: string[]) => {
    const seen = new Set<string>();
    return list.filter(k => {
      const key = k.trim().toLowerCase();
      if (key.length <= 3 || seen.has(key)) return false;
      if (genericWords.has(key) && !own.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const raw = desiredRoles.filter(r => r.length > 3);
  if (breadth === 0) return uniq(raw);
  const synonyms = expandRolesWithSynonyms(desiredRoles);
  if (breadth === 1) return uniq([...raw, ...synonyms]);
  // Related domains: any domain whose title list contains one of the user's
  // roles or their synonyms (role names rarely equal domain names).
  const known = new Set([...raw, ...synonyms].map(k => k.toLowerCase()));
  const domains = DOMAIN_GROUPS
    .filter(g => g.keywords.some(k => known.has(k.toLowerCase())))
    .map(g => g.domain);
  // Breadth 2 only runs once breadth 1 came back empty, so lead with the new
  // titles — the user's own career family, then the families their skills
  // transfer to — otherwise the keyword cap would just resend breadth 1.
  const ownFamily = userFamilies(desiredRoles).flatMap(familyTitles);
  const adjacent = adjacentFamilies(desiredRoles).flatMap(f => ROLE_FAMILIES[f].generalTitles);
  return uniq([...raw, ...ownFamily.slice(0, 15), ...adjacent, ...getExpandedKeywords(domains), ...synonyms]);
}

// ─── Career families & transferable roles ────────────────────────────────────

/**
 * Phrase match for classifying a role by family cue. Unlike title matching,
 * short cue words ("pr", "ui", "ml") must equal a whole word, so "pr" can't
 * claim "Product Manager"; cue words of 4+ letters match as a prefix
 * ("statistic" → Statistical).
 */
function roleHasCue(role: string, cue: string): boolean {
  const r = titleTokens(role);
  const c = titleTokens(cue);
  if (c.length === 0) return false;
  const wordOk = (t: string | undefined, w: string, last: boolean) =>
    !!t && (t === w || (last && w.length >= 4 && t.startsWith(w)));
  for (let i = 0; i + c.length <= r.length; i++) {
    if (c.every((w, j) => wordOk(r[i + j], w, j === c.length - 1))) return true;
  }
  return false;
}

const ROLE_TO_FAMILIES: Map<string, RoleFamily[]> = (() => {
  const m = new Map<string, RoleFamily[]>();
  for (const f of FAMILY_KEYS) {
    for (const role of CATEGORY_ROLES[f] ?? []) {
      const k = role.toLowerCase();
      m.set(k, [...(m.get(k) ?? []), f]);
    }
  }
  return m;
})();

/** Families a role belongs to: its onboarding category, else by cue words. */
export function familiesOfRole(role: string): RoleFamily[] {
  const listed = ROLE_TO_FAMILIES.get(role.trim().toLowerCase());
  if (listed) return listed;
  return FAMILY_KEYS.filter(f => ROLE_FAMILIES[f].cues.some(cue => roleHasCue(role, cue)));
}

/** The user's own families, most represented first. */
export function userFamilies(roles: string[]): RoleFamily[] {
  const count = new Map<RoleFamily, number>();
  for (const r of roles) for (const f of familiesOfRole(r)) count.set(f, (count.get(f) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);
}

/**
 * Families the user's skills transfer to (excluding their own), ordered by
 * closeness: a family listed earlier in more of the user's families' adjacency
 * lists ranks higher.
 */
export function adjacentFamilies(roles: string[]): RoleFamily[] {
  const own = userFamilies(roles);
  const score = new Map<RoleFamily, number>();
  own.forEach((f, ownRank) => {
    ROLE_FAMILIES[f].adjacent.forEach((a, adjRank) => {
      if (own.includes(a)) return;
      score.set(a, (score.get(a) ?? 0) + 1 / (1 + adjRank + ownRank * 0.5));
    });
  });
  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);
}

/** Share of each feed page given to transferable (adjacent-family) roles. */
export function adjacentShare(): number {
  return FEED_TUNING.adjacent_share;
}

/**
 * How many transferable jobs may accompany `coreCount` core jobs: one per four
 * core jobs, so a thin page of the user's own roles isn't swamped by
 * neighbours (a fixed 3-per-page let Cybersecurity users' feeds go 60%
 * adjacent).
 */
export function adjacentAllowance(coreCount: number, pageLimit: number): number {
  return Math.min(Math.max(1, Math.round(pageLimit * FEED_TUNING.adjacent_share)), Math.ceil(coreCount / Math.max(1, FEED_TUNING.adjacent_core_ratio)));
}
/** Keyword budget for the adjacent query. */

/**
 * Title keywords for transferable roles: first the other roles in the user's
 * own families (a backend engineer → Software/Frontend/Full Stack Engineer),
 * then neighbouring families, closest first. Round-robin across the lists so
 * no single family crowds out the rest.
 */
export function buildAdjacentKeywords(roles: string[]): string[] {
  const own = new Set(buildRoleKeywords(roles, 1).map(k => k.toLowerCase()));
  const families = [...userFamilies(roles), ...adjacentFamilies(roles)];
  const lists = families.map(f => familyTitles(f).filter(t => !own.has(t.toLowerCase())));
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < FEED_TUNING.adjacent_keywords_cap && lists.some(l => i < l.length); i++) {
    for (const l of lists) {
      const t = l[i];
      if (!t || seen.has(t.toLowerCase())) continue;
      seen.add(t.toLowerCase());
      out.push(t);
      if (out.length >= FEED_TUNING.adjacent_keywords_cap) break;
    }
  }
  return out;
}

/**
 * Merge a ranked core page with ranked adjacent jobs: one adjacent card after
 * every `every - 1` core cards, any surplus at the end.
 */
export function interleaveAdjacent<T>(core: T[], adjacent: T[], every = FEED_TUNING.interleave_every): T[] {
  every = Math.max(2, every);
  const out: T[] = [];
  let a = 0;
  core.forEach((job, i) => {
    out.push(job);
    if ((i + 1) % (every - 1) === 0 && a < adjacent.length) out.push(adjacent[a++]);
  });
  return [...out, ...adjacent.slice(a)];
}

// ─── Cached jobs ─────────────────────────────────────────────────────────────

const relevanceKeywordCache = new Map<string, string[]>();

/**
 * Whether a cached job still belongs in this user's feed: its title matches
 * one of their roles, synonyms, related-field or transferable titles, and its
 * level fits. Caches (on-device and server) skip the live pipeline, so without
 * this they replayed whatever was stored — including generic jobs written when
 * a fetch had fallen back to its keyword-less rescue query.
 */
export function isRelevantCachedJob(title: string, experience: string | null | undefined, roles: string[] | undefined, levels: string[]): boolean {
  if (!roles || roles.length === 0) return fitsLevels(title, experience, levels);
  const key = JSON.stringify(roles);
  let keywords = relevanceKeywordCache.get(key);
  if (!keywords) {
    keywords = [...new Set([...buildRoleKeywords(roles, 2), ...buildAdjacentKeywords(roles)])];
    relevanceKeywordCache.set(key, keywords);
  }
  return keywords.some(k => titleMatchesKeyword(title, k)) && fitsLevels(title, experience, levels);
}

