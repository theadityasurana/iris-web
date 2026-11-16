/**
 * The feed's decisions, free of React so they can be run and tested on their
 * own (scripts/feed-sim.ts drives these against the live database).
 *
 * Home-country first: on the plain feed (no search, no filters) every job from
 * the user's own cities / countries is shown before any job from elsewhere.
 * The 'home' phase keeps only those jobs and walks level escalation and role
 * widening (short of "any role") inside them; when they run out, the 'world'
 * phase walks again over every country, still nearest first.
 */
import type { Job } from '@/types';
import { buildFeedLadder, locationTier, type FeedPanelFilters, type FeedRung } from '@/lib/feed-search';
import { fitsLevels, interleaveAdjacent, titleMatchesKeyword } from '@/lib/feed-policy';
import { applyHomePhase, withPhase, type HomeRequestContext, type NearLocations, type WalkState } from '@/lib/feed-home';

// The walk itself (nextWalk, WalkState, START_WALK) is shared with the app: lib/feed-home.
export { nextWalk, START_WALK, WALK_AHEAD, type WalkState } from '@/lib/feed-home';

export interface LadderArgs {
  searchTags: string[];
  knownCompanies: string[];
  filters: FeedPanelFilters;
  desiredRoles?: string[];
  baselineLevels: string[];
  /** Raw profile locations (home city, then preferred cities) for search_jobs. */
  nearTexts: string[];
  excludeIds: string[];
  pageSize: number;
  filteredPageSize: number;
  homeCompanyCap: number;
  /** Home-country phase context: shapes each request (see phaseParams). */
  home?: HomeRequestContext;
}

export function walkLadder(s: WalkState, a: LadderArgs): FeedRung[] {
  const rungs = buildFeedLadder({
    searchTags: a.searchTags,
    knownCompanies: a.knownCompanies,
    filters: a.filters,
    desiredRoles: a.desiredRoles,
    baselineLevels: s.escalated.length ? s.escalated : a.baselineLevels,
    nearLocations: a.nearTexts,
    excludeIds: a.excludeIds,
    roleBreadth: s.roleBreadth,
    pageSize: a.pageSize,
    filteredPageSize: a.filteredPageSize,
    homeCompanyCap: a.homeCompanyCap,
  });
  return a.home ? withPhase(rungs, a.home) : rungs;
}

export interface ShapeOptions {
  /** Everything search_jobs returned for this page, before any filtering. */
  rawJobs: Job[];
  titleKeywords?: string[];
  levels: string[];
  skipSanity: boolean;
  inHome: boolean;
  near: NearLocations;
  random?: () => number;
}

/**
 * Title / level sanity checks, the home-country cut, and ordering: own city,
 * own country, elsewhere; better matches first; adjacent roles interleaved.
 * `crossed` = the page reached jobs outside the home country, so (search_jobs
 * being home-first) this request has no more home jobs.
 */
export function shapeBatch(scored: Job[], o: ShapeOptions): { batch: Job[]; crossed: boolean } {
  let batch = scored;
  const keywords = (o.titleKeywords ?? []).filter(k => k.length > 3).map(k => k.toLowerCase());
  if (!o.skipSanity && keywords.length > 0) {
    batch = batch.filter(job => job.relevanceTier === 'adjacent' || keywords.some(k => titleMatchesKeyword((job.jobTitle || '').toLowerCase(), k)));
  }
  if (!o.skipSanity && o.levels.length > 0) batch = batch.filter(job => fitsLevels(job.jobTitle || '', job.experienceLevel, o.levels));

  let crossed = false;
  if (o.inHome) ({ batch, crossed } = applyHomePhase(batch, o.rawJobs, o.near));

  const random = o.random ?? Math.random;
  const rank = (list: Job[]) => list
    .map(job => ({ job, tier: locationTier(job, o.near), band: Math.floor((job.matchScore ?? 0) / 10), rnd: random() }))
    .sort((a, b) => (a.tier - b.tier) || (b.band - a.band) || (a.rnd - b.rnd))
    .map(x => x.job);
  batch = interleaveAdjacent(rank(batch.filter(j => j.relevanceTier !== 'adjacent')), rank(batch.filter(j => j.relevanceTier === 'adjacent')));
  return { batch, crossed };
}
