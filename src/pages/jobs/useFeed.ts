/**
 * The web job feed. Same pipeline as the app's home screen, built from the
 * app's own modules: buildFeedLadder (search + filters + profile → ordered
 * requests that relax one condition at a time), fetchJobsBatch (search_jobs),
 * computeMatchScores, and the level-escalation → role-widening → recycle
 * fallbacks so the deck never runs dry. The decisions live in feedWalk.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchJobsBatch, fetchAllCompanies, type JobsFetchFailure } from '@/lib/jobs';
import { locationTier, type FeedPanelFilters } from '@/lib/feed-search';
import { computeMatchScores } from '@/lib/match-scoring';
import { getDefaultJobLevelsFromExperience, isRelevantCachedJob } from '@/lib/feed-policy';
import { validateJobsByDesiredRoles, validateSearchResultsWithGPT } from '@/lib/gpt-ranking';
import { readJobCache, writeJobCache } from '@/lib/jobs-cache';
import { rc } from '@/lib/remote-config';
import type { Job, UserProfile } from '@/types';
import { isHomeFirst, nearFromProfile, WALK_AHEAD, worldNotice } from '@/lib/feed-home';
import { nextWalk, shapeBatch, START_WALK, walkLadder, type WalkState } from './feedWalk';

export const EMPTY_FILTERS: FeedPanelFilters = {
  roles: [], companies: [], selectedCountries: [], selectedCities: [], locations: [],
  jobTypes: [], jobLevels: [], postedWithin: [], remoteOnly: false,
};

export const PAGE = 15;
export const FILTERED_PAGE = 50;
export const PREFETCH_AT = WALK_AHEAD;

export function activeFilterCount(f: FeedPanelFilters) {
  return f.roles.length + f.companies.length + f.selectedCountries.length + f.selectedCities.length
    + f.jobTypes.length + f.jobLevels.length + f.postedWithin.length + (f.remoteOnly ? 1 : 0);
}

/** Home city, then preferred cities: search_jobs orders those first. */
export function nearTextsOf(p: UserProfile | null | undefined): string[] {
  if (!rc('feed').location_tiers_enabled) return [];
  return [p?.location, ...(p?.preferredCities ?? [])].filter((l): l is string => !!l && l !== 'null');
}

export function useFeed(profile: UserProfile | null, swipedJobIds: string[], searchTags: string[], filters: FeedPanelFilters) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<JobsFetchFailure | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const knownCompanies = useRef<string[]>([]);
  const offset = useRef(0);
  const hasMore = useRef(true);
  const walk = useRef<WalkState>(START_WALK);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const [exhausted, setExhausted] = useState(false);
  const swipedRef = useRef(swipedJobIds);
  swipedRef.current = swipedJobIds;
  const remainingRef = useRef(0);

  const baselineLevels = useMemo(() => getDefaultJobLevelsFromExperience(profile?.experienceLevel), [profile?.experienceLevel]);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const near = useMemo(
    () => (rc('feed').location_tiers_enabled ? nearFromProfile(profile) : { cities: [], countries: [] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile?.location, JSON.stringify(profile?.preferredCities ?? []), JSON.stringify(profile?.nearCities ?? []), JSON.stringify(profile?.nearCountries ?? [])],
  );
  const nearRef = useRef(near);
  nearRef.current = near;
  /** The home phase applies to the plain feed of a user whose country is known. */
  const homeFirst = useCallback(
    () => isHomeFirst(searchTags.length > 0 || activeFilterCount(filters) > 0, nearRef.current),
    [searchTags, filters],
  );

  useEffect(() => {
    fetchAllCompanies().then(c => { knownCompanies.current = c; }).catch(() => {});
  }, []);

  const ladder = useCallback(() => walkLadder(walk.current, {
    searchTags,
    knownCompanies: knownCompanies.current,
    filters,
    desiredRoles: profileRef.current?.desiredRoles,
    baselineLevels,
    nearTexts: nearTextsOf(profileRef.current),
    excludeIds: swipedRef.current,
    pageSize: PAGE,
    filteredPageSize: FILTERED_PAGE,
    homeCompanyCap: rc('feed').home_company_cap,
  }), [searchTags, filters, baselineLevels]);

  /** Fetch the next page, walking the ladder past empty rungs. */
  const load = useCallback(async (append: boolean): Promise<number> => {
    if (inFlight.current) return 0;
    inFlight.current = true;
    const gen = generation.current;
    setLoading(true);
    try {
      const steps = ladder();
      let r = Math.min(walk.current.rung, steps.length - 1);
      let off = append ? offset.current : 0;
      let result = await fetchJobsBatch(steps[r].params(off));
      while (!result.failure && result.jobs.length === 0 && r + 1 < steps.length) {
        r++;
        off = 0;
        result = await fetchJobsBatch(steps[r].params(0));
      }
      if (gen !== generation.current) return 0;
      walk.current = { ...walk.current, rung: r };
      const inHome = walk.current.phase === 'home' && homeFirst();
      setNotice(steps[r].notice ?? (walk.current.phase === 'world' && homeFirst() ? worldNotice(nearRef.current) : null));

      if (result.failure && result.jobs.length === 0) {
        hasMore.current = false;
        // Cards still on screen: say nothing and let the walk move on to the
        // next step. An error screen only when there is nothing to show.
        if (!(append && remainingRef.current > 0)) setError(result.failure);
        return 0;
      }
      setError(null);

      let scored = computeMatchScores(profileRef.current, result.jobs);
      const desired = profileRef.current?.desiredRoles ?? [];
      const anyFilter = activeFilterCount(filters) > 0;

      // Same relevance pipeline, in the same order, as the app's home screen.
      if (rc('features').ai_role_filter_enabled && !append && desired.length > 0 && walk.current.roleBreadth === 0) {
        const adjacent = scored.filter(j => j.relevanceTier === 'adjacent');
        scored = [...await validateJobsByDesiredRoles(scored.filter(j => j.relevanceTier !== 'adjacent'), desired), ...adjacent];
      }
      if (!anyFilter && searchTags.length > 0 && scored.length > 0 && r === 0) {
        const validated = await validateSearchResultsWithGPT(scored, searchTags);
        if (validated.length > 0) scored = validated;
      }
      if (gen !== generation.current) return 0;

      const { batch, crossed } = shapeBatch(scored, {
        rawJobs: result.jobs,
        titleKeywords: result.titleKeywords,
        levels: steps[r].params(off).filters?.jobLevels ?? [],
        skipSanity: filters.companies.length > 0 || searchTags.length > 0,
        inHome,
        near: nearRef.current,
      });

      const seen = new Set(swipedRef.current);
      offset.current = off + result.serverRowCount;
      hasMore.current = result.serverHadMore && !crossed;
      let added = 0;
      setJobs(prev => {
        const base = append ? prev : [];
        const ids = new Set(base.map(j => j.id));
        const fresh = batch.filter(j => !ids.has(j.id) && !seen.has(j.id));
        added = fresh.length;
        return [...base, ...fresh];
      });
      if (!append) setIndex(0);
      if (!searchTags.length && !anyFilter && batch.length && profileRef.current?.id) writeJobCache(profileRef.current.id, 'web-feed', batch, offset.current).catch(() => {});
      return added || batch.length;
    } catch (e) {
      console.error('[feed] load failed', e);
      if (gen === generation.current) setError('network');
      return 0;
    } finally {
      inFlight.current = false;
      if (gen === generation.current) { setLoading(false); setInitialLoaded(true); }
    }
  }, [ladder, filters, searchTags, homeFirst]);

  // A new search / filter set / role list starts from the exact request.
  const rolesKey = JSON.stringify(profile?.desiredRoles ?? []);
  useEffect(() => {
    if (!profile) return;
    generation.current++;
    inFlight.current = false;
    walk.current = START_WALK;
    setExhausted(false);
    offset.current = 0;
    hasMore.current = true;
    setJobs([]);
    setIndex(0);
    setInitialLoaded(false);
    const gen = generation.current;
    if (!searchTags.length && activeFilterCount(filters) === 0 && profile.id) {
      readJobCache(profile.id, 'web-feed').then(cached => {
        if (gen !== generation.current || !cached?.jobs?.length) return;
        const seen = new Set(swipedRef.current);
        const levels = walk.current.escalated.length ? walk.current.escalated : baselineLevels;
        const home = homeFirst();
        const usable = cached.jobs.filter(j => !seen.has(j.id) && isRelevantCachedJob(j.jobTitle || '', j.experienceLevel, profileRef.current?.desiredRoles, levels)
          && (!home || locationTier(j, nearRef.current) < 2));
        setJobs(prev => (prev.length ? prev : usable));
      }).catch(() => {});
    }
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(searchTags), JSON.stringify(filters), rolesKey, !!profile]);

  const remaining = jobs.length - index;
  remainingRef.current = remaining;

  // Prefetch, and when the current request is exhausted: next rung, escalate
  // job levels, widen roles, every country, then recycle (see nextWalk).
  // Both happen while WALK_AHEAD cards are still left, so the search runs in
  // the background as the user swipes and the deck never empties.
  useEffect(() => {
    if (!initialLoaded || loading || error || exhausted) return;
    if (remaining > WALK_AHEAD) return;
    if (hasMore.current) { void load(true); return; }

    const next = nextWalk(walk.current, {
      rungCount: ladder().length,
      homeFirst: homeFirst(),
      baselineLevels,
      manualLevels: filters.jobLevels.length > 0,
      roleFilter: filters.roles.length > 0,
    });
    // Everything has been walked and the deck is still empty: stop rather
    // than cycling forever over a feed with nothing in it.
    if (!next) { setExhausted(true); return; }
    walk.current = next;
    offset.current = 0;
    hasMore.current = true;
    void load(true);
  }, [remaining, initialLoaded, loading, error, exhausted, load, ladder, filters, baselineLevels, homeFirst]);

  // Reaching new jobs means the walk is productive again.
  useEffect(() => { if (remaining > 0 && walk.current.recycles) walk.current = { ...walk.current, recycles: 0 }; }, [remaining]);

  const retry = useCallback(() => {
    setError(null);
    setExhausted(false);
    walk.current = { ...walk.current, recycles: 0 };
    hasMore.current = true;
    offset.current = 0;
    void load(false);
  }, [load]);

  const advance = useCallback(() => setIndex(i => i + 1), []);
  const rewind = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  /** Grid view: take one card out wherever it sits. */
  const remove = useCallback((id: string) => setJobs(prev => prev.filter(j => j.id !== id)), []);
  const restore = useCallback((job: Job) => setJobs(prev => (prev.some(j => j.id === job.id) ? prev : [job, ...prev])), []);

  return {
    current: jobs[index] ?? null,
    upcoming: jobs.slice(index + 1, index + 3),
    visible: jobs.slice(index),
    remove,
    restore,
    remaining,
    loading,
    initialLoaded,
    exhausted,
    error,
    notice,
    advance,
    rewind,
    retry,
  };
}
