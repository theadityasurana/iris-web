/**
 * Home-country first, shared by the app's home feed and the website's feed
 * (iris-web/shared/lib/feed-home.ts is an identical copy).
 *
 * On the plain feed (no search, no filters) every job in the user's own
 * cities / countries is shown before any job from elsewhere, whatever country
 * the user is in:
 *
 *   'home'  phase: keep only jobs in the user's cities / countries. Level
 *                  escalation and role widening (short of "any role") all run
 *                  inside the home country.
 *   'world' phase: once home is used up, walk again over every country, still
 *                  nearest first (search_jobs orders city → country → rest).
 *
 * search_jobs returns home jobs first, so the first page that reaches a job
 * outside home means the current request has no more home jobs ("crossed").
 */
import { LOCATION_MAPPINGS } from '@/constants/location-mappings';
import { locationTier, type FeedRung } from '@/lib/feed-search';
import type { BatchFetchParams } from '@/lib/feed-engine';
import { getEscalatedLevels, MAX_ROLE_BREADTH, type RoleBreadth } from '@/lib/feed-policy';
import type { Job, UserProfile } from '@/types';

export type FeedPhase = 'home' | 'world';
export interface NearLocations { cities: string[]; countries: string[] }

const SHORT_OK = new Set(['usa', 'uae', 'uk']);
const REGIONS = new Set(['apac', 'amer', 'america', 'emea', 'europe', 'latam']);
const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
const usable = (k: string) => (k.length >= 4 || SHORT_OK.has(k.toLowerCase())) && !REGIONS.has(k.toLowerCase());

/** Cities / countries named in free-text locations, in the database's canonical form (cities lower-case). */
export function parseNear(texts: string[]): NearLocations {
  const cities = new Set<string>();
  const countries = new Set<string>();
  for (const text of texts) {
    const t = norm(text);
    if (!t.trim()) continue;
    const has = (k: string) => usable(k) && t.includes(norm(k));
    for (const c of LOCATION_MAPPINGS) {
      for (const city of c.cities) {
        if ([city.name, ...city.keywords].some(has)) { cities.add(city.name.toLowerCase()); countries.add(c.name); }
      }
      if ([c.name, ...c.keywords].some(has)) countries.add(c.name);
    }
  }
  return { cities: [...cities], countries: [...countries] };
}

/** The profile's near_cities / near_countries (set by a database trigger), else read from its location text. */
export function nearFromProfile(p: Pick<UserProfile, 'location' | 'preferredCities' | 'nearCities' | 'nearCountries'> | null | undefined): NearLocations {
  if (!p) return { cities: [], countries: [] };
  if (p.nearCountries?.length) return { cities: p.nearCities ?? [], countries: p.nearCountries };
  return parseNear([p.location, ...(p.preferredCities ?? [])].filter((l): l is string => !!l && l !== 'null'));
}

/** Home-first applies to the plain feed of a user whose home is known. */
export function isHomeFirst(hasSearchOrFilters: boolean, near: NearLocations): boolean {
  return !hasSearchOrFilters && (near.countries.length > 0 || near.cities.length > 0);
}

/** Home phase: keep home jobs only; crossed = this request has no more of them. */
export function applyHomePhase<T extends Pick<Job, 'locCities' | 'locCountries' | 'relevanceTier'>>(batch: T[], rawJobs: T[], near: NearLocations): { batch: T[]; crossed: boolean } {
  return {
    batch: batch.filter(j => locationTier(j, near) < 2),
    crossed: rawJobs.some(j => j.relevanceTier !== 'adjacent' && locationTier(j, near) === 2),
  };
}

/** At home, stop short of "any role": a matching role abroad beats an unrelated one at home. */
export function maxBreadthFor(inHome: boolean): RoleBreadth {
  return (inHome ? MAX_ROLE_BREADTH - 1 : MAX_ROLE_BREADTH) as RoleBreadth;
}

// ─── The walk: what to request once the current request has no more pages ───

/** Start the next step while this many cards are still left, so the deck never empties. */
export const WALK_AHEAD = 5;

export interface WalkState {
  rung: number;
  phase: FeedPhase;
  roleBreadth: RoleBreadth;
  /** Escalated levels; empty = the user's baseline levels. */
  escalated: string[];
  recycles: number;
}

export const START_WALK: WalkState = { rung: 0, phase: 'home', roleBreadth: 0, escalated: [], recycles: 0 };

export interface WalkContext {
  rungCount: number;
  homeFirst: boolean;
  baselineLevels: string[];
  /** Levels the user picked (or a company filter): never escalated. */
  manualLevels: boolean;
  /** A role filter is set: roles are never widened. */
  roleFilter: boolean;
}

/**
 * Next ladder rung → next levels → wider roles → (home) every country →
 * recycle from the top once. null = everything walked with nothing new; stop.
 */
export function nextWalk(s: WalkState, c: WalkContext): WalkState | null {
  if (s.rung + 1 < c.rungCount) return { ...s, rung: s.rung + 1 };
  const base = { ...s, rung: 0 };
  const current = s.escalated.length ? s.escalated : c.baselineLevels;
  const next = !c.manualLevels && c.baselineLevels.length ? getEscalatedLevels(current, c.baselineLevels) : null;
  const inHome = s.phase === 'home' && c.homeFirst;
  if (next) return { ...base, escalated: next };
  if (!c.roleFilter && s.roleBreadth < maxBreadthFor(inHome)) return { ...base, roleBreadth: (s.roleBreadth + 1) as RoleBreadth, escalated: [] };
  if (inHome) return { ...base, phase: 'world', roleBreadth: 0, escalated: [] };
  if (s.recycles >= 1) return null;
  return { ...base, recycles: s.recycles + 1, roleBreadth: 0, escalated: [] };
}

// ─── Phase-aware request ─────────────────────────────────────────────────────

export interface HomeRequestContext { inHome: boolean; homeFirst: boolean; near: NearLocations }

/**
 * What to ask search_jobs for in each phase. Measured on the live database
 * (Bangalore, Software Engineer, cold cache): nearest-first over every country
 * took ~10s (its "everywhere else" step reads thousands of rows), past the 8s
 * statement timeout.
 *   home  → only the home cities / countries (indexed location filter), still
 *           city first: ~1.6s cold. It is all the home phase keeps anyway.
 *   world → no nearest-first ordering: home is used up by then, ~3.3s cold.
 */
export function phaseParams(p: BatchFetchParams, h: HomeRequestContext): BatchFetchParams {
  if (!h.homeFirst) return p;
  if (h.inHome) {
    const home = [...h.near.countries, ...h.near.cities];
    return { ...p, filters: { ...p.filters, locations: home } };
  }
  return { ...p, nearLocations: undefined };
}

/** The ladder's rungs with phase-aware requests. */
export function withPhase(rungs: FeedRung[], h: HomeRequestContext): FeedRung[] {
  if (!h.homeFirst) return rungs;
  return rungs.map(r => ({ ...r, params: (offset: number) => phaseParams(r.params(offset), h) }));
}

export function worldNotice(near: NearLocations): string | null {
  const country = near.countries[0];
  return country ? `You’ve seen the matching jobs in ${country}. Showing jobs in other countries now.` : null;
}
