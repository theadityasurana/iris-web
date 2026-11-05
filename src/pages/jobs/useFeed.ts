/**
 * The web job feed. Same pipeline as the app's home screen, built from the
 * app's own modules: buildFeedLadder (search + filters + profile → ordered
 * requests that relax one condition at a time), fetchJobsBatch (search_jobs),
 * computeMatchScores, and the level-escalation → role-widening → recycle
 * fallbacks so the deck never runs dry.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchJobsBatch, fetchAllCompanies, type JobsFetchFailure } from '@/lib/jobs';
import { buildFeedLadder, locationTier, type FeedPanelFilters } from '@/lib/feed-search';
import { computeMatchScores } from '@/lib/match-scoring';
import { fitsLevels, getDefaultJobLevelsFromExperience, getEscalatedLevels, interleaveAdjacent, isRelevantCachedJob, titleMatchesKeyword, MAX_ROLE_BREADTH, type RoleBreadth } from '@/lib/feed-policy';
import { validateJobsByDesiredRoles, validateSearchResultsWithGPT } from '@/lib/gpt-ranking';
import { readJobCache, writeJobCache } from '@/lib/jobs-cache';
import { rc } from '@/lib/remote-config';
import type { Job, UserProfile } from '@/types';

export const EMPTY_FILTERS: FeedPanelFilters = {
  roles: [], companies: [], selectedCountries: [], selectedCities: [], locations: [],
  jobTypes: [], jobLevels: [], postedWithin: [], remoteOnly: false,
};

const PAGE = 15;
const FILTERED_PAGE = 50;
const PREFETCH_AT = 5;

export function activeFilterCount(f: FeedPanelFilters) {
  return f.roles.length + f.companies.length + f.selectedCountries.length + f.selectedCities.length
    + f.jobTypes.length + f.jobLevels.length + f.postedWithin.length + (f.remoteOnly ? 1 : 0);
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
  const rung = useRef(0);
  const roleBreadth = useRef<RoleBreadth>(0);
  const escalated = useRef<string[]>([]);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const recycles = useRef(0);
  const [exhausted, setExhausted] = useState(false);
  const swipedRef = useRef(swipedJobIds);
  swipedRef.current = swipedJobIds;

  const baselineLevels = useMemo(() => getDefaultJobLevelsFromExperience(profile?.experienceLevel), [profile?.experienceLevel]);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    fetchAllCompanies().then(c => { knownCompanies.current = c; }).catch(() => {});
  }, []);

  const ladder = useCallback(() => {
    const p = profileRef.current;
    const near = !rc('feed').location_tiers_enabled ? [] : [p?.location, ...(p?.preferredCities ?? [])].filter((l): l is string => !!l && l !== 'null');
    return buildFeedLadder({
      searchTags,
      knownCompanies: knownCompanies.current,
      filters,
      desiredRoles: p?.desiredRoles,
      baselineLevels: escalated.current.length ? escalated.current : baselineLevels,
      nearLocations: near,
      excludeIds: swipedRef.current,
      roleBreadth: roleBreadth.current,
      pageSize: PAGE,
      filteredPageSize: FILTERED_PAGE,
      homeCompanyCap: rc('feed').home_company_cap,
    });
  }, [searchTags, filters, baselineLevels]);

  /** Fetch the next page, walking the ladder past empty rungs. */
  const load = useCallback(async (append: boolean): Promise<number> => {
    if (inFlight.current) return 0;
    inFlight.current = true;
    const gen = generation.current;
    setLoading(true);
    try {
      const steps = ladder();
      let r = Math.min(rung.current, steps.length - 1);
      let off = append ? offset.current : 0;
      let result = await fetchJobsBatch(steps[r].params(off));
      while (!result.failure && result.jobs.length === 0 && r + 1 < steps.length) {
        r++;
        off = 0;
        result = await fetchJobsBatch(steps[r].params(0));
      }
      if (gen !== generation.current) return 0;
      rung.current = r;
      setNotice(steps[r].notice);

      if (result.failure && result.jobs.length === 0) {
        setError(result.failure);
        hasMore.current = false;
        return 0;
      }
      setError(null);

      let batch = computeMatchScores(profileRef.current, result.jobs);
      const desired = profileRef.current?.desiredRoles ?? [];
      const anyFilter = activeFilterCount(filters) > 0;

      // Same relevance pipeline, in the same order, as the app's home screen.
      if (rc('features').ai_role_filter_enabled && !append && desired.length > 0 && roleBreadth.current === 0) {
        const adjacent = batch.filter(j => j.relevanceTier === 'adjacent');
        batch = [...await validateJobsByDesiredRoles(batch.filter(j => j.relevanceTier !== 'adjacent'), desired), ...adjacent];
      }
      if (!anyFilter && searchTags.length > 0 && batch.length > 0 && r === 0) {
        const validated = await validateSearchResultsWithGPT(batch, searchTags);
        if (validated.length > 0) batch = validated;
      }
      if (gen !== generation.current) return 0;

      const skipSanity = filters.companies.length > 0 || searchTags.length > 0;
      const keywords = (result.titleKeywords ?? []).filter(k => k.length > 3).map(k => k.toLowerCase());
      if (!skipSanity && keywords.length > 0) {
        batch = batch.filter(job => job.relevanceTier === 'adjacent' || keywords.some(k => titleMatchesKeyword((job.jobTitle || '').toLowerCase(), k)));
      }
      const levels = steps[r].params(off).filters?.jobLevels ?? [];
      if (!skipSanity && levels.length > 0) batch = batch.filter(job => fitsLevels(job.jobTitle || '', job.experienceLevel, levels));

      const near = rc('feed').location_tiers_enabled
        ? { cities: profileRef.current?.nearCities, countries: profileRef.current?.nearCountries }
        : {};
      const rank = (list: Job[]) => list
        .map(job => ({ job, tier: locationTier(job, near), band: Math.floor((job.matchScore ?? 0) / 10), rnd: Math.random() }))
        .sort((a, b) => (a.tier - b.tier) || (b.band - a.band) || (a.rnd - b.rnd))
        .map(x => x.job);
      batch = interleaveAdjacent(rank(batch.filter(j => j.relevanceTier !== 'adjacent')), rank(batch.filter(j => j.relevanceTier === 'adjacent')));

      const seen = new Set(swipedRef.current);
      offset.current = off + result.serverRowCount;
      hasMore.current = result.serverHadMore;
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
  }, [ladder, filters, searchTags]);

  // A new search / filter set / role list starts from the exact request.
  const rolesKey = JSON.stringify(profile?.desiredRoles ?? []);
  useEffect(() => {
    if (!profile) return;
    generation.current++;
    inFlight.current = false;
    rung.current = 0;
    roleBreadth.current = 0;
    escalated.current = [];
    recycles.current = 0;
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
        const levels = escalated.current.length ? escalated.current : baselineLevels;
        const usable = cached.jobs.filter(j => !seen.has(j.id) && isRelevantCachedJob(j.jobTitle || '', j.experienceLevel, profileRef.current?.desiredRoles, levels));
        setJobs(prev => (prev.length ? prev : usable));
      }).catch(() => {});
    }
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(searchTags), JSON.stringify(filters), rolesKey, !!profile]);

  const remaining = jobs.length - index;

  // Prefetch, and when the current request is exhausted: escalate job levels,
  // then widen roles, then recycle from the top (mirrors the app).
  useEffect(() => {
    if (!initialLoaded || loading || error || exhausted) return;
    if (remaining > PREFETCH_AT) return;
    if (hasMore.current) { void load(true); return; }
    if (remaining > 0) return;

    const steps = ladder();
    if (rung.current + 1 < steps.length) {
      rung.current++;
      offset.current = 0;
      hasMore.current = true;
      void load(true);
      return;
    }
    const manualLevels = filters.jobLevels.length > 0;
    const current = escalated.current.length ? escalated.current : baselineLevels;
    const next = !manualLevels && baselineLevels.length ? getEscalatedLevels(current, baselineLevels) : null;
    if (next) {
      escalated.current = next;
    } else if (filters.roles.length === 0 && roleBreadth.current < MAX_ROLE_BREADTH) {
      roleBreadth.current = (roleBreadth.current + 1) as RoleBreadth;
      escalated.current = [];
    } else {
      // Everything has been walked once and the deck is still empty: stop
      // rather than cycling forever over a feed with nothing in it.
      if (recycles.current >= 1) { setExhausted(true); return; }
      recycles.current++;
      roleBreadth.current = 0;
      escalated.current = [];
    }
    rung.current = 0;
    offset.current = 0;
    hasMore.current = true;
    void load(true);
  }, [remaining, initialLoaded, loading, error, exhausted, load, ladder, filters, baselineLevels]);

  // Reaching new jobs means the walk is productive again.
  useEffect(() => { if (remaining > 0) recycles.current = 0; }, [remaining]);

  const retry = useCallback(() => {
    setError(null);
    setExhausted(false);
    recycles.current = 0;
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
