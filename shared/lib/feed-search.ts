/**
 * Search + filter → feed request, and the relaxation ladder that keeps the
 * jobs page from ever coming back empty. Pure (no I/O): the home feed
 * (app/(tabs)/(home)/index.tsx) and the test harnesses in scripts/search-tests
 * run exactly this code.
 *
 * 1. parseSearch() reads what the user typed — "data analyst bangalore",
 *    "remote react developer", "sde 1", "google", "fresher" — into parts:
 *    companies, places, levels, work modes, job types, and the remaining role
 *    / free-text words. Abbreviations (SDE, PM, HR…) expand to the titles
 *    jobs actually use; a misspelled word ("data analist", "gogle") gets a
 *    corrected reading used if the literal one finds nothing.
 *
 * 2. buildFeedLadder() turns search + filter panel + profile into an ordered
 *    list of requests ("rungs"). Rung 0 is everything ANDed. Each next rung
 *    relaxes one thing, least-important first: the user's implicit levels,
 *    the date window, profile roles under a company / place, the search words
 *    (synonyms → single words → spelling), job type / work mode, the place
 *    (becomes "nearest first" instead of a hard filter), explicit levels,
 *    role filter, search words, company — and finally the user's own feed,
 *    then any role. The home feed walks the ladder until a rung has jobs,
 *    and moves to the next rung when a rung's results run out, so the deck
 *    always has cards. Every rung past the user's own levels carries a
 *    notice saying what was relaxed.
 *
 * Every request also carries nearLocations (home city, then preferred
 * cities): search_jobs orders city → country → everywhere else within the
 * same conditions.
 */
import { expandRolesWithSynonyms, ROLE_SYNONYMS } from '@/constants/role-synonyms';
import { DOMAIN_GROUPS, getExpandedKeywords } from '@/constants/domains';
import { CATEGORY_ROLES } from '@/constants/roles';
import { LOCATION_MAPPINGS, buildLocationFilterKeywords, getCityKeywords } from '@/constants/location-mappings';
import { getAdjacentLevels, FEED_TUNING, type RoleBreadth } from '@/lib/feed-policy';
import type { BatchFetchParams } from '@/lib/feed-engine';

// ─── Parsing ─────────────────────────────────────────────────────────────────

export interface SearchPlace { label: string; keywords: string[] }

export interface ParsedSearch {
  companies: string[];
  places: SearchPlace[];
  levels: string[];
  workModes: string[];
  jobTypes: string[];
  /** Role / free-text phrases, one per tag, in the user's words. */
  terms: string[];
}

const LEVEL_PHRASES: [string, string[]][] = [
  ['entry level', ['Entry Level']], ['entry-level', ['Entry Level']], ['new grad', ['Entry Level']],
  ['fresher', ['Entry Level']], ['freshers', ['Entry Level']], ['graduate', ['Entry Level']], ['junior', ['Entry Level']],
  ['jr', ['Entry Level']], ['beginner', ['Entry Level']], ['early career', ['Entry Level']],
  ['mid level', ['Mid Level']], ['mid-level', ['Mid Level']], ['mid', ['Mid Level']], ['intermediate', ['Mid Level']],
  ['senior', ['Senior Level']], ['sr', ['Senior Level']], ['experienced', ['Senior Level']],
  ['lead', ['Lead']], ['staff', ['Lead', 'Principal']], ['principal', ['Principal']],
  ['director', ['Director']], ['head of', ['Director']], ['vp', ['VP']], ['vice president', ['VP']],
];
const WORK_MODE_PHRASES: [string, string][] = [
  ['work from home', 'Remote'], ['from home', 'Remote'], ['wfh', 'Remote'], ['remote', 'Remote'], ['remotely', 'Remote'],
  ['hybrid', 'Hybrid'],
];
const JOB_TYPE_PHRASES: [string, string][] = [
  ['internship', 'Internship'], ['internships', 'Internship'], ['intern', 'Internship'], ['interns', 'Internship'],
  ['trainee', 'Internship'], ['apprentice', 'Internship'],
  ['full time', 'Full-time'], ['full-time', 'Full-time'], ['fulltime', 'Full-time'],
  ['part time', 'Part-time'], ['part-time', 'Part-time'], ['parttime', 'Part-time'],
  ['contract', 'Contract'], ['contractual', 'Contract'], ['contractor', 'Contract'],
  ['freelance', 'Freelance'], ['freelancer', 'Freelance'],
];
// "SDE 1" / "SWE II": a trailing grade after a role word.
const GRADE_LEVELS: Record<string, string> = { '1': 'Entry Level', i: 'Entry Level', '2': 'Mid Level', ii: 'Mid Level', '3': 'Senior Level', iii: 'Senior Level' };
const STOP_WORDS = new Set(['job', 'jobs', 'role', 'roles', 'position', 'positions', 'opening', 'openings', 'vacancy', 'vacancies',
  'hiring', 'in', 'at', 'for', 'near', 'me', 'the', 'a', 'an', 'with', 'of', 'and', '&', 'opportunity', 'opportunities',
  'career', 'careers', 'level', 'based', 'office', 'onsite', 'on-site', 'any', 'all', 'show', 'find', 'looking']);

/** Abbreviations → the titles jobs actually use. */
export const ROLE_ABBREVIATIONS: Record<string, string[]> = {
  sde: ['software development engineer', 'software engineer', 'software developer'],
  swe: ['software engineer', 'software developer'],
  sdet: ['sdet', 'software development engineer in test', 'test engineer'],
  pm: ['product manager', 'project manager', 'program manager'],
  apm: ['associate product manager', 'product manager'],
  tpm: ['technical program manager', 'program manager'],
  ml: ['machine learning', 'ml engineer'],
  ai: ['ai engineer', 'artificial intelligence', 'machine learning'],
  ds: ['data scientist'], da: ['data analyst'], de: ['data engineer'],
  qa: ['qa engineer', 'quality assurance', 'test engineer', 'qa analyst'],
  sre: ['site reliability', 'sre'],
  hr: ['human resources', 'hr', 'recruiter', 'talent acquisition', 'people partner', 'people operations'],
  ux: ['ux designer', 'user experience', 'product designer'], ui: ['ui designer', 'ui/ux', 'ui engineer'],
  'ui ux': ['ui/ux', 'ux designer', 'ui designer', 'product designer'],
  fe: ['frontend', 'front end'], be: ['backend', 'back end'],
  frontend: ['frontend', 'front end', 'front-end'], backend: ['backend', 'back end', 'back-end'],
  fullstack: ['full stack', 'fullstack', 'full-stack'],
  ba: ['business analyst'], bd: ['business development'], bdr: ['business development representative'],
  sdr: ['sales development representative'], ae: ['account executive'], csm: ['customer success manager'],
  cs: ['customer success', 'customer support'], ops: ['operations'], js: ['javascript'], ts: ['typescript'],
  devops: ['devops', 'site reliability', 'platform engineer', 'infrastructure engineer'],
  mern: ['mern', 'full stack'], dotnet: ['.net'], gtm: ['go to market', 'gtm'],
};

const normCompany = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#./-]+/g, ' ').split(' ').filter(Boolean);

interface PlaceAlias { phrase: string; place: SearchPlace }
let placeAliases: PlaceAlias[] | null = null;
function getPlaceAliases(): PlaceAlias[] {
  if (placeAliases) return placeAliases;
  const out: PlaceAlias[] = [];
  const skip = new Set(['apac', 'amer', 'america', 'ca-', 'can', 'socal', 'uk2', 'spacex', 'washington', 'reading', 'sandy', 'hamilton', 'georgia']);
  for (const c of LOCATION_MAPPINGS) {
    const place = { label: c.name, keywords: buildLocationFilterKeywords([c.name], []) };
    for (const k of [c.name, ...c.keywords]) {
      const kl = k.toLowerCase();
      if (skip.has(kl) || (k.length < 4 && !['usa', 'uae', 'uk', 'us'].includes(kl))) continue;
      out.push({ phrase: words(k).join(' '), place });
    }
    for (const city of c.cities) {
      const cplace = { label: city.name, keywords: getCityKeywords(city.name) };
      for (const k of [city.name, ...city.keywords]) {
        const kl = k.toLowerCase();
        if (skip.has(kl) || (k.length < 4 && !['nyc', 'blr', 'ncr', 'sf'].includes(kl))) continue;
        out.push({ phrase: words(k).join(' '), place: cplace });
      }
    }
  }
  // "Georgia" the country stays reachable by its full name only.
  out.push({ phrase: 'georgia', place: { label: 'Georgia', keywords: ['Georgia', 'Tbilisi'] } });
  placeAliases = out.filter(a => a.phrase);
  return placeAliases;
}

/** Parse what the user typed. Each tag may mix parts: "senior data analyst bangalore remote". */
export function parseSearch(tags: string[], knownCompanies: string[]): ParsedSearch {
  const out: ParsedSearch = { companies: [], places: [], levels: [], workModes: [], jobTypes: [], terms: [] };
  const companyByNorm = new Map(knownCompanies.filter(Boolean).map(c => [normCompany(c), c]));
  const addUnique = <T>(list: T[], v: T, key = (x: T) => JSON.stringify(x)) => { if (!list.some(x => key(x) === key(v))) list.push(v); };

  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag) continue;
    // A whole tag naming a known company. Exact (normalized) only — the old
    // substring test made "HR" a company because some name contained "hr".
    const whole = companyByNorm.get(normCompany(tag));
    if (whole) { addUnique(out.companies, whole); continue; }

    const w = words(tag);
    const used = new Array(w.length).fill(false);
    const claim = (i: number, n: number) => { for (let k = i; k < i + n; k++) used[k] = true; };
    const free = (i: number, n: number) => used.slice(i, i + n).every(u => !u);

    // Longest phrases first so "work from home" beats "home", "new york" beats "york".
    for (let n = Math.min(4, w.length); n >= 1; n--) {
      for (let i = 0; i + n <= w.length; i++) {
        if (!free(i, n)) continue;
        const phrase = w.slice(i, i + n).join(' ');
        const lvl = LEVEL_PHRASES.find(([p]) => p === phrase);
        if (lvl) { lvl[1].forEach(l => addUnique(out.levels, l)); claim(i, n); continue; }
        const wm = WORK_MODE_PHRASES.find(([p]) => p === phrase);
        if (wm) { addUnique(out.workModes, wm[1]); claim(i, n); continue; }
        const jt = JOB_TYPE_PHRASES.find(([p]) => p === phrase);
        if (jt) { addUnique(out.jobTypes, jt[1]); claim(i, n); continue; }
        const place = getPlaceAliases().find(a => a.phrase === phrase);
        if (place) { addUnique(out.places, place.place, p => p.label); claim(i, n); continue; }
        const co = phrase.length >= 3 ? companyByNorm.get(normCompany(phrase)) : undefined;
        if (co) { addUnique(out.companies, co); claim(i, n); continue; }
      }
    }
    // "SDE 1", "SWE II": a grade after a role word is a level.
    const rest: string[] = [];
    w.forEach((word, i) => {
      if (used[i] || STOP_WORDS.has(word)) return;
      if (GRADE_LEVELS[word] && rest.length > 0) { addUnique(out.levels, GRADE_LEVELS[word]); return; }
      rest.push(word);
    });
    if (rest.length) addUnique(out.terms, rest.join(' '));
  }
  return out;
}

// ─── Term expansion & spelling ───────────────────────────────────────────────

/** A term plus abbreviation / synonym / domain titles (most specific first). */
export function expandTerm(term: string): string[] {
  const t = term.toLowerCase().trim();
  const out: string[] = [t];
  const abbr = ROLE_ABBREVIATIONS[t];
  if (abbr) out.push(...abbr);
  // Abbreviation inside a phrase: "sde intern" → "software engineer intern"…
  const ws = t.split(' ');
  if (!abbr && ws.length > 1) {
    ws.forEach((wd, i) => {
      const a = ROLE_ABBREVIATIONS[wd];
      if (a) a.slice(0, 2).forEach(x => out.push([...ws.slice(0, i), x, ...ws.slice(i + 1)].join(' ')));
    });
  }
  if (ROLE_SYNONYMS[t]) out.push(...ROLE_SYNONYMS[t]);
  else if (!abbr) {
    // Close role names: "data analyst" → ROLE_SYNONYMS['data analyst'], "ui ux designer" → 'ui/ux designer'.
    const key = Object.keys(ROLE_SYNONYMS).find(k => k.replace(/[^a-z0-9]+/g, ' ').trim() === t.replace(/[^a-z0-9]+/g, ' ').trim());
    if (key) out.push(...ROLE_SYNONYMS[key]);
  }
  const domain = DOMAIN_GROUPS.find(g => g.domain.toLowerCase() === t);
  if (domain) out.push(...domain.keywords);
  return safeTerms(out);
}

/**
 * Drop one- and two-letter single words: title matching treats the last word
 * as a prefix, so "ba" (a Business Analyst synonym) matched "Bangalore" and
 * "ai" matched "Airline". Typed abbreviations go through their expansions.
 */
function safeTerms(list: string[]): string[] {
  return [...new Set(list.map(k => k.trim()).filter(k => k.length >= 3 || /\s/.test(k)))];
}

/** Wider: synonyms of everything the term expands to. */
function synonymExpansion(term: string): string[] {
  const generic = new Set(FEED_TUNING.generic_single_words.map(w => w.toLowerCase()));
  const base = expandTerm(term);
  const wider = expandRolesWithSynonyms(base.filter(b => b.includes(' ')).slice(0, 6))
    // getRoleSynonyms falls back to bare core words ("data"): far too broad here.
    .filter(k => k.includes(' ') || !generic.has(k.toLowerCase()));
  return safeTerms([...base, ...wider]).slice(0, 60);
}

/** Individual meaningful words of a multi-word term ("react native developer" → react, native). */
function termWords(term: string): string[] {
  const generic = new Set(FEED_TUNING.generic_single_words.map(w => w.toLowerCase()));
  return term.split(' ').filter(w => w.length >= 3 && !generic.has(w) && !STOP_WORDS.has(w));
}

let vocab: Set<string> | null = null;
function getVocab(extra: string[]): Set<string> {
  if (!vocab) {
    vocab = new Set<string>();
    const add = (s: string) => words(s).forEach(x => { if (x.length >= 3) vocab!.add(x); });
    Object.entries(ROLE_SYNONYMS).forEach(([k, v]) => { add(k); v.forEach(add); });
    DOMAIN_GROUPS.forEach(g => { add(g.domain); g.keywords.forEach(add); });
    Object.values(CATEGORY_ROLES).flat().forEach(add);
    LOCATION_MAPPINGS.forEach(c => { add(c.name); c.keywords.forEach(add); c.cities.forEach(ci => { add(ci.name); ci.keywords.forEach(add); }); });
    [...LEVEL_PHRASES.map(x => x[0]), ...WORK_MODE_PHRASES.map(x => x[0]), ...JOB_TYPE_PHRASES.map(x => x[0]), ...Object.keys(ROLE_ABBREVIATIONS)].forEach(add);
  }
  if (extra.length === 0) return vocab;
  const v = new Set(vocab);
  extra.forEach(e => words(e).forEach(x => x.length >= 3 && v.add(x)));
  extra.forEach(e => { const n = normCompany(e); if (n.length >= 3) v.add(n); });
  return v;
}

/** Optimal-string-alignment distance, bounded. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

/** Tags with misspelled words corrected against role / place / company vocabulary; null when nothing changed. */
export function correctSpelling(tags: string[], knownCompanies: string[]): string[] | null {
  const v = getVocab(knownCompanies);
  const list = [...v];
  let changed = false;
  const fixed = tags.map(tag => words(tag).map(word => {
    if (word.length < 4 || v.has(word) || /\d/.test(word) || ROLE_ABBREVIATIONS[word]) return word;
    const max = word.length <= 5 ? 1 : 2;
    let best: string | null = null; let bestD = max + 1;
    for (const cand of list) {
      if (cand[0] !== word[0] && cand[1] !== word[1]) continue;
      const dd = editDistance(word, cand, max);
      if (dd < bestD || (dd === bestD && best && cand.length > best.length)) { best = cand; bestD = dd; }
    }
    if (best && bestD <= max) {
      changed = true;
      // A corrected company keeps its display name ("gogle" → "Google").
      return knownCompanies.find(c => normCompany(c) === best) ?? best;
    }
    return word;
  }).join(' '));
  return changed ? fixed : null;
}

// ─── Ladder ──────────────────────────────────────────────────────────────────

export interface FeedPanelFilters {
  roles: string[];             // domain names from the filter panel
  companies: string[];
  selectedCountries: string[];
  selectedCities: string[];
  locations?: string[];        // legacy keyword list
  jobTypes: string[];
  jobLevels: string[];
  postedWithin: string[];
  remoteOnly: boolean;
}

export interface FeedLadderInput {
  searchTags: string[];
  knownCompanies: string[];
  filters: FeedPanelFilters;
  desiredRoles?: string[];
  /** The user's starting / escalated levels (implicit). */
  baselineLevels: string[];
  /** Home location, then preferred cities. */
  nearLocations: string[];
  excludeIds: string[];
  roleBreadth: RoleBreadth;
  pageSize: number;
  filteredPageSize: number;
  homeCompanyCap: number;
}

/** One request shape, before paging. */
interface Spec {
  terms?: string[];        // → p_search_tags (title phrase OR company)
  roles?: string[];        // → filter title keywords (panel roles)
  useProfileRoles: boolean;
  roleBreadth: RoleBreadth;
  companies?: string[];
  places?: SearchPlace[];
  near: string[];
  workModes?: string[];
  jobTypes?: string[];
  levels?: string[];
  postedWithin?: string[];
}

export interface FeedRung {
  /** Short machine label, for logs and tests. */
  label: string;
  /** What was relaxed, for the banner above the cards; null = exact. */
  notice: string | null;
  params: (offset: number) => BatchFetchParams;
  key: string;
}

const quote = (s: string) => `“${s}”`;
const listText = (xs: string[]) => xs.length <= 2 ? xs.join(' & ') : `${xs.slice(0, 2).join(', ')} +${xs.length - 2}`;

export function hasActiveQuery(input: Pick<FeedLadderInput, 'searchTags' | 'filters'>): boolean {
  const f = input.filters;
  return input.searchTags.length > 0 || !!(f.roles.length || f.companies.length || f.selectedCountries.length || f.selectedCities.length
    || (f.locations?.length ?? 0) || f.jobTypes.length || f.jobLevels.length || f.postedWithin.length || f.remoteOnly);
}

function placeKeywords(places?: SearchPlace[]): string[] | undefined {
  if (!places || places.length === 0) return undefined;
  return [...new Set(places.flatMap(p => p.keywords))];
}

/**
 * The ordered requests for this search / filter state. With nothing typed or
 * filtered it is a single rung (the normal feed; level escalation and role
 * widening handle exhaustion there).
 */
export function buildFeedLadder(input: FeedLadderInput): FeedRung[] {
  const f = input.filters;
  const active = hasActiveQuery(input);
  const searchLabel = input.searchTags.join(', ');

  const toParams = (s: Spec) => (offset: number): BatchFetchParams => {
    const locations = placeKeywords(s.places);
    const filtered = active;
    return {
      tab: 'unified',
      limit: filtered ? input.filteredPageSize : input.pageSize,
      offset,
      excludeIds: input.excludeIds,
      companyCap: s.companies?.length ? undefined : input.homeCompanyCap,
      searchTags: s.terms?.length ? s.terms : undefined,
      filters: {
        companies: s.companies?.length ? s.companies : undefined,
        roles: s.roles?.length ? s.roles : undefined,
        locations,
        workModes: s.workModes?.length ? s.workModes : undefined,
        jobTypes: s.jobTypes?.length ? s.jobTypes : undefined,
        jobLevels: s.levels?.length ? s.levels : undefined,
        postedWithin: s.postedWithin?.length ? s.postedWithin : undefined,
      },
      desiredRoles: s.useProfileRoles && input.desiredRoles?.length ? input.desiredRoles : undefined,
      roleBreadth: s.roleBreadth,
      nearLocations: s.near.length ? s.near : undefined,
    };
  };
  const keyOf = (s: Spec) => JSON.stringify({ ...toParams(s)(0), excludeIds: undefined, offset: undefined });

  const rungs: FeedRung[] = [];
  const push = (label: string, s: Spec, notice: string | null) => {
    const key = keyOf(s);
    if (rungs.some(r => r.key === key)) return;
    rungs.push({ label, notice, params: toParams(s), key });
  };

  const fromParsed = (parsed: ParsedSearch): Spec => {
    const panelPlaces: SearchPlace[] = [
      ...f.selectedCountries.map(c => ({ label: c, keywords: buildLocationFilterKeywords([c], []) })),
      ...f.selectedCities.map(c => ({ label: c, keywords: getCityKeywords(c) })),
      ...(f.locations?.length && !f.selectedCountries.length && !f.selectedCities.length ? [{ label: f.locations[0], keywords: f.locations }] : []),
    ];
    const places = [...parsed.places, ...panelPlaces];
    const roles = f.roles.length ? getExpandedKeywords(f.roles) : undefined;
    const terms = parsed.terms.length ? [...new Set(parsed.terms.flatMap(expandTerm))] : undefined;
    const explicitLevels = [...new Set([...parsed.levels, ...f.jobLevels])];
    return {
      terms,
      roles,
      // Profile roles drive the query unless the user named a role (typed or filtered).
      useProfileRoles: !terms && !roles,
      roleBreadth: input.roleBreadth,
      companies: [...new Set([...parsed.companies, ...f.companies])],
      places,
      near: input.nearLocations,
      workModes: [...new Set([...parsed.workModes, ...(f.remoteOnly ? ['Remote'] : [])])],
      jobTypes: [...new Set([...parsed.jobTypes, ...f.jobTypes])],
      levels: explicitLevels.length ? explicitLevels : input.baselineLevels,
      postedWithin: f.postedWithin,
    };
  };

  const parsed = parseSearch(input.searchTags, input.knownCompanies);
  const explicitLevels = parsed.levels.length > 0 || f.jobLevels.length > 0;
  let s = fromParsed(parsed);
  const exactTerms = s.terms;
  push('exact', s, null);
  if (!active) return rungs;

  const fallbackNotice = input.searchTags.length
    ? `No matches for ${quote(searchLabel)} — showing jobs for you`
    : 'No jobs match these filters — showing jobs for you';
  const pushFinal = () => {
    push('profile-feed', { useProfileRoles: true, roleBreadth: input.roleBreadth, near: input.nearLocations, levels: input.baselineLevels.length ? input.baselineLevels : undefined }, fallbackNotice);
    push('any-role', { useProfileRoles: true, roleBreadth: 3, near: input.nearLocations }, fallbackNotice);
  };
  // App Control off-switch: exact results, then straight to the user's own feed.
  if (!FEED_TUNING.search_relaxation_enabled) { pushFinal(); return rungs; }

  // Implicit levels: widen around the user's own, then drop.
  if (!explicitLevels && input.baselineLevels.length) {
    s = { ...s, levels: getAdjacentLevels(input.baselineLevels) }; push('levels±1', s, null);
    s = { ...s, levels: undefined }; push('any-level', s, null);
  }
  // Date window: 1w → 1m → 3m → any.
  if (s.postedWithin?.length) {
    for (const w of [['1w'], ['1m'], ['3m'], []]) {
      const days = (r: string) => ({ '1d': 1, '2d': 2, '1w': 7, '1m': 30, '3m': 90 } as Record<string, number>)[r] ?? 90;
      if (w.length && days(w[0]) <= Math.max(...s.postedWithin!.map(days))) continue;
      s = { ...s, postedWithin: w }; push(`posted:${w[0] ?? 'any'}`, s, w.length ? 'No new posts in that window — showing older ones' : 'Showing jobs from any date');
    }
  }
  // Profile roles under a company / place: show every role there.
  if (s.useProfileRoles && (s.companies?.length || s.places?.length)) {
    const where = s.companies?.length ? `at ${listText(s.companies)}` : `in ${listText(s.places!.map(p => p.label))}`;
    s = { ...s, useProfileRoles: false }; push('all-roles-there', s, `Showing all roles ${where}`);
  }
  // A misspelled word is the likeliest reason for nothing: try the corrected
  // reading before widening the words.
  const corrected = input.searchTags.length && FEED_TUNING.spelling_correction_enabled ? correctSpelling(input.searchTags, input.knownCompanies) : null;
  if (corrected) {
    const cp = parseSearch(corrected, input.knownCompanies);
    const cs = fromParsed(cp);
    const notice = `Showing results for ${quote(corrected.join(', '))}`;
    push('spelling', { ...cs, levels: explicitLevels ? cs.levels : undefined, postedWithin: s.postedWithin }, notice);
    if (cp.terms.length) {
      push('spelling+synonyms', { ...cs, levels: explicitLevels ? cs.levels : undefined, postedWithin: s.postedWithin,
        terms: [...new Set(cp.terms.flatMap(synonymExpansion))] }, notice);
    }
    // Later rungs relax the corrected reading when it found a company / place the literal one missed.
    if (cp.companies.length > parsed.companies.length || cp.places.length > parsed.places.length) {
      s = { ...cs, levels: explicitLevels ? cs.levels : undefined, postedWithin: s.postedWithin, useProfileRoles: false };
    }
  }
  // Search words: synonyms, then single words.
  if (parsed.terms.length) {
    s = { ...s, terms: [...new Set(parsed.terms.flatMap(synonymExpansion))] };
    push('synonyms', s, `Showing roles similar to ${quote(searchLabel)}`);
    const single = [...new Set(parsed.terms.flatMap(termWords))];
    if (single.length) { s = { ...s, terms: [...new Set([...s.terms!, ...single])] }; push('words', s, `Showing closest matches for ${quote(searchLabel)}`); }
  }
  // Job type / work mode.
  if (s.jobTypes?.length) { s = { ...s, jobTypes: undefined }; push('any-job-type', s, `No ${listText(parsed.jobTypes.length ? parsed.jobTypes : f.jobTypes).toLowerCase()} matches — showing all job types`); }
  if (s.workModes?.length) { s = { ...s, workModes: undefined }; push('any-work-mode', s, 'No remote matches — showing all work modes'); }
  // Place: from a hard filter to "nearest first".
  if (s.places?.length) {
    const labels = s.places.map(p => p.label);
    const notice = `No matches in ${listText(labels)} — showing the closest first`;
    const near = [...labels, ...input.nearLocations];
    // The exact words near the place beat looser words in it.
    if (exactTerms) push('place-nearest-first', { ...s, terms: exactTerms, places: undefined, near }, notice);
    s = { ...s, places: undefined, near };
    push('place-nearest-first+wider', s, notice);
  }
  // Explicit levels.
  if (explicitLevels) { s = { ...s, levels: undefined }; push('any-level-explicit', s, 'Showing all experience levels'); }
  // Panel role filter.
  if (s.roles?.length) {
    s = { ...s, roles: undefined, useProfileRoles: !s.terms?.length };
    push('no-role-filter', s, `No matches for ${listText(f.roles)} — showing other roles`);
  }
  // Search words under a company: every role at that company.
  if (s.terms?.length && s.companies?.length) {
    s = { ...s, terms: undefined }; push('company-all-roles', s, `Showing all roles at ${listText(s.companies!)}`);
  }
  // Company.
  if (s.companies?.length) {
    const cos = s.companies;
    s = { ...s, companies: undefined, useProfileRoles: !s.terms?.length };
    push('no-company', s, `No open roles at ${listText(cos)} right now — showing similar jobs`);
  }
  // The user's own feed, then any role: these always have jobs.
  pushFinal();
  return rungs;
}

// ─── Location tier (client-side ordering within a page) ─────────────────────

/** 0 = one of the user's cities, 1 = one of their countries, 2 = elsewhere / unknown. */
export function locationTier(
  job: { locCities?: string[] | null; locCountries?: string[] | null },
  near: { cities?: string[] | null; countries?: string[] | null },
): number {
  const hit = (a?: string[] | null, b?: string[] | null) => !!a?.length && !!b?.length && a.some(x => b.includes(x));
  if (hit(job.locCities, near.cities)) return 0;
  if (hit(job.locCountries, near.countries)) return 1;
  return 2;
}
