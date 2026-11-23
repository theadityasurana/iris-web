/**
 * Feed engine: turns a feed request (tab, user roles, filters, levels) into
 * job rows from the search_jobs RPC. Pure apart from the two injected calls,
 * so the same code runs on the phone (lib/jobs.ts) and in the get-feed edge
 * function (bundled by scripts/build-feed-engine.sh). Tuning comes from
 * FEED_TUNING (remote_config.feed).
 *
 * Returns raw rows plus the companies they mention; turning rows into app
 * `Job` objects (logos, salary text, dates) stays in lib/jobs.ts.
 */
import { expandRolesWithSynonyms } from '@/constants/role-synonyms';
import { DOMAIN_GROUPS, getExpandedKeywords } from '@/constants/domains';
import {
  buildRoleKeywords, buildAdjacentKeywords, adjacentAllowance, EXPERIENCE_ENUM_MAP, FEED_TUNING, type RoleBreadth,
} from '@/lib/feed-policy';

export interface FeedRow {
  id: string;
  company_name?: string;
  title?: string;
  job_title?: string;
  experience?: string;
  [k: string]: unknown;
}

export interface FeedCompany {
  name: string;
  industry?: string;
  size?: string;
  company_type?: string;
  description?: string;
  website?: string;
  logo_url?: string;
}

export interface BatchFetchParams {
  tab: 'unified' | 'discover' | 'remote' | 'startup';
  limit: number;
  offset: number;
  excludeIds?: string[];
  searchTags?: string[];
  companyCap?: number;
  filters?: {
    companies?: string[];
    roles?: string[];
    locations?: string[];
    workModes?: string[];
    jobTypes?: string[];
    jobLevels?: string[];
    postedWithin?: string[];
  };
  desiredRoles?: string[];
  /**
   * How far to widen the user's desired roles (unified feed only):
   * 0 exact roles · 1 + synonyms · 2 + related-domain titles · 3 any role.
   */
  roleBreadth?: RoleBreadth;
  /**
   * Places to rank first (home city, then preferred cities, or the searched
   * place once it is relaxed from a filter): search_jobs orders city →
   * country → everywhere else within the same conditions.
   */
  nearLocations?: string[];
}

export type JobsFetchFailure = 'timeout' | 'network' | 'server';

export interface RawBatchResult {
  /** Rows for the user's own roles, in database order. */
  rows: FeedRow[];
  /** Transferable-role rows (already capped by adjacentAllowance). */
  adjacentRows: FeedRow[];
  companies: FeedCompany[];
  serverHadMore: boolean;
  serverRowCount: number;
  titleKeywords?: string[];
  /** The batch is empty because something broke, not because the feed is exhausted. */
  failure?: JobsFetchFailure;
  /** Role keywords were requested but only the keyword-less rescue query answered. */
  degraded?: boolean;
}

export interface FeedDeps {
  searchJobs: (params: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string; code?: string } | null }>;
  fetchCompanies: (names: string[]) => Promise<FeedCompany[]>;
  log?: (...args: unknown[]) => void;
  /** Rows from keyword groups that answered after the page was returned (see Progressive pages). */
  onLateRows?: (rows: FeedRow[]) => void;
}

/** Raised when the job query exceeds the configured RPC timeout. */
export class JobsTimeoutError extends Error {
  constructor() {
    super('RPC_TIMEOUT');
    this.name = 'JobsTimeoutError';
  }
}

/**
 * Reject if `promise` hasn't settled within `ms`. supabase-js has no request
 * timeout, so a stalled connection otherwise left the feed on a spinner forever.
 */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new JobsTimeoutError()), ms);
    }),
  ]).finally(() => clearTimeout(timer)) as Promise<T>;
}

// Legacy fuzzy keywords — fallback for jobs that still have free-text experience.
const EXPERIENCE_FUZZY_MAP: Record<string, string[]> = {
  'Internship':   ['intern', 'internship', 'trainee', 'apprentice', 'co-op', 'coop', 'placement', 'student'],
  'Entry Level':  ['entry', 'fresher', 'junior', '0-1', '0-2', 'graduate', 'new grad', 'early career', 'beginner'],
  'Mid Level':    ['mid', 'intermediate', '2-5', '3-5', '2-4', '3-4', '4-6', '3+', '4+'],
  'Senior Level': ['senior', '5+', '5-8', '6+', '7+', '8+', '5-7', '6-8', '7-10'],
  'Lead':         ['lead', 'staff', 'manager', '8+', '9+', '10+', '8-12'],
  'Principal':    ['principal', 'distinguished', 'fellow', 'architect', '12+', '15+', '10-15'],
  'Director':     ['director', 'head of', 'department head'],
  'VP':           ['vice president', 'vp', 'svp', 'evp', 'avp'],
  'C-Level':      ['cto', 'ceo', 'cfo', 'coo', 'cmo', 'cpo', 'chief', 'c-level', 'founder', 'president', 'executive'],
};

const POSTED_WITHIN_MS: Record<string, number> = {
  '1d': 1, '2d': 2, '1w': 7, '1m': 30, '3m': 90,
};

/** Title keywords for a request (before the cap). */
function buildTitleKeywords(params: BatchFetchParams): { titleKeywords: string[]; adjacentKeywords: string[] } {
  const { tab, desiredRoles, filters } = params;
  let titleKeywords: string[] = [];
  let adjacentKeywords: string[] = [];
  if (desiredRoles && desiredRoles.length > 0) {
    if (tab === 'startup') {
      // Raw role names only: full expansion plus the company_type subquery timed out.
      titleKeywords = desiredRoles.filter(r => r.length > 3);
    } else if (tab === 'unified') {
      // A search tag or role filter drives the query on its own; sending role
      // keywords as well would AND them and drop valid results.
      const hasSearchTags = (params.searchTags?.length ?? 0) > 0;
      const hasRoleFilter = (filters?.roles?.length ?? 0) > 0;
      if (!hasSearchTags && !hasRoleFilter) {
        const breadth = params.roleBreadth ?? 0;
        titleKeywords = buildRoleKeywords(desiredRoles, breadth);
        // From breadth 2 on, the keywords already include neighbouring families.
        if (breadth <= 1) adjacentKeywords = buildAdjacentKeywords(desiredRoles);
      }
    } else {
      // Each role maps to at most one domain group (strict match); the rest use synonyms.
      const domainMatched: string[] = [];
      const unmatched: string[] = [];
      for (const role of desiredRoles) {
        const roleLower = role.toLowerCase();
        const matchedDomain = DOMAIN_GROUPS.find(g =>
          g.domain.toLowerCase() === roleLower ||
          g.domain.toLowerCase().includes(roleLower) ||
          roleLower.includes(g.domain.toLowerCase())
        );
        if (matchedDomain) {
          if (!domainMatched.includes(matchedDomain.domain)) domainMatched.push(matchedDomain.domain);
        } else {
          unmatched.push(role);
        }
      }
      const domainKeywords = domainMatched.length > 0 ? getExpandedKeywords(domainMatched) : [];
      const synonymKeywords = unmatched.length > 0 ? expandRolesWithSynonyms(unmatched) : [];
      const rawRoleKeywords = desiredRoles.filter(r => r.length > 3);
      titleKeywords = [...new Set([...domainKeywords, ...synonymKeywords, ...rawRoleKeywords])].filter(kw => kw.length > 3);
    }
  }
  if (filters?.roles && filters.roles.length > 0) {
    titleKeywords = [...new Set([...titleKeywords, ...filters.roles])];
  }
  return { titleKeywords, adjacentKeywords };
}

let nearUnsupported = false;

// ─── Progressive pages: late keyword groups carry over to the next page ──────
// A page returns once its first groups answer; groups still running finish in
// the background and their rows wait here, keyed by the request without its
// offset, to be added to the next page of the same feed (which the deck
// prefetches before it runs out). The caller saves pages to the server job
// cache as usual, so late rows reach it too.
const CARRY_TTL_MS = 10 * 60 * 1000;
const carried = new Map<string, { rows: FeedRow[]; at: number }>();
function carryKey(rpcParams: Record<string, unknown>, keywords: string[]): string {
  const { p_offset: _o, p_exclude_ids: _x, p_title_keywords: _k, ...rest } = rpcParams;
  return JSON.stringify({ rest, keywords });
}
function addCarried(key: string, rows: FeedRow[]) {
  const prev = carried.get(key);
  const fresh = prev && Date.now() - prev.at < CARRY_TTL_MS ? prev.rows : [];
  carried.set(key, { rows: [...fresh, ...rows], at: Date.now() });
}
function takeCarried(key: string, exclude: Set<string>): FeedRow[] {
  const entry = carried.get(key);
  carried.delete(key);
  if (!entry || Date.now() - entry.at > CARRY_TTL_MS) return [];
  return entry.rows.filter(r => r?.id && !exclude.has(r.id));
}

export async function runFeedBatch(params: BatchFetchParams, deps: FeedDeps): Promise<RawBatchResult> {
  const log = deps.log ?? (() => {});
  const T = FEED_TUNING;
  const started = Date.now();
  const { tab, limit, offset, excludeIds, searchTags, filters, companyCap } = params;
  const timeoutMs = T.rpc_timeout_ms;
  // A database without the p_near_locations parameter answers PGRST202
  // (no matching function): retry once without it, and stop sending it.
  const searchJobs: FeedDeps['searchJobs'] = async (p) => {
    if (!nearUnsupported || !('p_near_locations' in p)) {
      const res = await deps.searchJobs(p);
      if (!(res.error?.code === 'PGRST202' && 'p_near_locations' in p)) return res;
      nearUnsupported = true;
    }
    const { p_near_locations: _drop, ...rest } = p;
    return deps.searchJobs(rest);
  };

  try {
    let groupMaxRows = 0;
    let { titleKeywords, adjacentKeywords } = buildTitleKeywords(params);

    // Experience: exact enum values when we have them, the fuzzy list only otherwise.
    // Sending both multiplied ILIKE predicates and caused statement timeouts (57014).
    let expExact: string[] = [];
    let expKeywords: string[] = [];
    if (filters?.jobLevels && filters.jobLevels.length > 0) {
      expExact = [...new Set(filters.jobLevels.flatMap(level => EXPERIENCE_ENUM_MAP[level] || []))];
      expKeywords = filters.jobLevels.flatMap(level => EXPERIENCE_FUZZY_MAP[level] || [level.toLowerCase()]);
    }

    let postedAfter: string | null = null;
    if (filters?.postedWithin && filters.postedWithin.length > 0) {
      const days = Math.max(...filters.postedWithin.map(r => POSTED_WITHIN_MS[r] ?? 90));
      postedAfter = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    }

    // A date, location or company filter gives a small fixed result set: page
    // with excludeIds instead of an offset (offset 1 would skip the first match).
    const hasSmallResultSetFilter = !!postedAfter || (filters?.locations?.length ?? 0) > 0 || (filters?.companies?.length ?? 0) > 0;
    const effectiveOffset = hasSmallResultSetFilter ? 0 : offset;

    // Keywords are ordered by the user's own preferences, so keep the head.
    if (titleKeywords.length > T.title_keywords_cap) titleKeywords = titleKeywords.slice(0, T.title_keywords_cap);

    const rpcParams: Record<string, unknown> = { p_tab: tab, p_limit: limit, p_offset: effectiveOffset };
    if (titleKeywords.length > 0) rpcParams.p_title_keywords = titleKeywords;
    if (expExact.length > 0) rpcParams.p_exp_exact = expExact;
    if (expExact.length === 0 && expKeywords.length > 0) rpcParams.p_exp_keywords = expKeywords;
    if (excludeIds && excludeIds.length > 0) rpcParams.p_exclude_ids = excludeIds.slice(-T.exclude_ids_cap);
    if (searchTags && searchTags.length > 0) rpcParams.p_search_tags = searchTags;
    if (filters?.companies && filters.companies.length > 0) rpcParams.p_company_names = filters.companies;
    if (filters?.locations && filters.locations.length > 0) rpcParams.p_location_keywords = filters.locations;
    if (filters?.workModes && filters.workModes.length > 0) rpcParams.p_work_modes = filters.workModes;
    if (filters?.jobTypes && filters.jobTypes.length > 0) rpcParams.p_job_types = filters.jobTypes;
    if (postedAfter) rpcParams.p_posted_after = postedAfter;
    // Always sent (avoids PGRST203 overload ambiguity); uncapped when searching a company.
    const hasCompanyFilter = (filters?.companies?.length ?? 0) > 0;
    rpcParams.p_company_cap = hasCompanyFilter ? 999 : (companyCap ?? T.default_company_cap);
    if (params.nearLocations && params.nearLocations.length > 0) rpcParams.p_near_locations = params.nearLocations.slice(0, 8);

    log(`[FEED:${tab}] offset=${effectiveOffset} limit=${limit} keywords=${titleKeywords.length} adjacent=${adjacentKeywords.length} exp=${expExact.length || expKeywords.length} exclude=${(excludeIds || []).length}`);

    // Transferable roles run alongside; a failure here only means no extra cards.
    const adjacentLimit = Math.max(1, Math.round(limit * T.adjacent_share));
    const adjacentPromise: Promise<FeedRow[]> = adjacentKeywords.length > 0
      ? withTimeout(
          searchJobs({ ...rpcParams, p_title_keywords: adjacentKeywords, p_limit: adjacentLimit, p_offset: 0, p_company_cap: 1 }),
          timeoutMs,
        ).then(r => (r.error ? [] : ((r.data as FeedRow[]) ?? []))).catch(() => [])
      : Promise.resolve([]);

    // Keywords are split into small groups queried in parallel and merged:
    // one big ILIKE query with every keyword hit the database statement
    // timeout, and the old fallback then kept only the first few keywords,
    // silently dropping the rest of the person's desired roles. Groups are
    // dealt round-robin from a list that starts with the person's own roles,
    // so every desired role is searched. A group that fails is split in two
    // and retried, never dropped. Only if every group fails does the
    // keyword-less rescue run (flagged `degraded`, never cached).
    // Every group pages with the same offset/limit, so the caller advancing by
    // the largest group's row count keeps each group's paging exact.
    let data: FeedRow[] | null = null;
    let error: unknown = null;
    let usedKeywords = titleKeywords;
    const requestedKeywords = titleKeywords;

    const runQuery = async (kws: string[], label: string): Promise<FeedRow[] | null> => {
      const attemptParams = { ...rpcParams };
      if (kws.length > 0) attemptParams.p_title_keywords = kws;
      else delete attemptParams.p_title_keywords;
      const t0 = Date.now();
      try {
        const res = await withTimeout(searchJobs(attemptParams), timeoutMs);
        const rows = (res.data as FeedRow[] | null) ?? [];
        log(`[FEED:${tab}] ${label} (${kws.length} kw): ${res.error ? `error ${res.error.message}` : `${rows.length} rows`} in ${Date.now() - t0}ms`);
        if (res.error) { error = res.error; return null; }
        return rows;
      } catch (e) {
        error = e;
        log(`[FEED:${tab}] ${label} timed out after ${Date.now() - t0}ms`);
        return null;
      }
    };

    // A failed group is retried once, as-is, after a short random pause (so
    // groups that failed together don't retry together). It is never split:
    // splitting multiplied the queries and made a struggling database worse.
    // A group that still fails is simply searched again on the next page.
    const runGroup = async (kws: string[], label: string): Promise<FeedRow[][] | null> => {
      const first = await runQuery(kws, label);
      if (first) return [first];
      await new Promise(r => setTimeout(r, 300 + Math.floor(Math.random() * 500)));
      const again = await runQuery(kws, `${label} retry`);
      return again ? [again] : null;
    };

    let groupsPending = false;
    if (titleKeywords.length > 0) {
      // Chunks of a few keywords in the person's own order, so the first
      // chunk holds their top roles. At most `max_parallel_queries` run at
      // once; the rest queue behind. The page returns as soon as the
      // top-roles chunk has answered with jobs (plus a short grace for chunks
      // finishing alongside it), or at `first_page_budget_ms` if anything has
      // answered by then, or when every chunk is done; never empty while
      // chunks are still running. Chunks still running carry over.
      const perQuery = Math.max(1, T.keywords_per_query ?? 5);
      const parallel = Math.max(1, T.max_parallel_queries ?? 3);
      const budgetMs = T.first_page_budget_ms ?? 3000;
      const graceMs = 300;
      const groups: string[][] = [];
      for (let i = 0; i < titleKeywords.length; i += perQuery) groups.push(titleKeywords.slice(i, i + perQuery));
      const key = carryKey(rpcParams, titleKeywords);
      const exclude = new Set(excludeIds ?? []);

      const settled: (FeedRow[][] | null | undefined)[] = groups.map(() => undefined);
      let returned = false;
      let next = 0;
      let wake: () => void = () => {};
      const startNext = (): Promise<void> | null => {
        if (next >= groups.length) return null;
        const i = next++;
        return runGroup(groups[i], `group ${i + 1}/${groups.length}`).then(res => {
          settled[i] = res;
          if (returned && res) {
            const late = res.flat().filter(r => r?.id && !exclude.has(r.id));
            if (late.length) {
              addCarried(key, late);
              log(`[FEED:${tab}] group ${i + 1}/${groups.length} late: ${late.length} rows carried to the next page`);
              try { deps.onLateRows?.(late); } catch { /* caching is best effort */ }
            }
          }
          wake();
          return startNext() ?? undefined;
        });
      };
      for (let k = 0; k < Math.min(parallel, groups.length); k++) void startNext();

      // Rows carried from the previous page of this feed: taken up front so
      // they count as jobs already in hand (the page can return at the budget).
      const carriedRows = takeCarried(key, exclude);

      await new Promise<void>(resolve => {
        let finished = false;
        const timers: ReturnType<typeof setTimeout>[] = [];
        const finish = () => { if (finished) return; finished = true; timers.forEach(clearTimeout); resolve(); };
        let graceSet = false;
        const hasRows = () => carriedRows.length > 0 || settled.some(r => r && r.some(l => l.length > 0));
        const check = () => {
          if (settled.every(r => r !== undefined)) return finish();
          // Top-roles chunk answered with jobs: show it (after a short grace).
          if (!graceSet && settled[0] && settled[0].some(l => l.length > 0)) { graceSet = true; timers.push(setTimeout(finish, graceMs)); }
        };
        // Budget: return then if anything has jobs; otherwise keep waiting.
        timers.push(setTimeout(function budget() {
          if (hasRows()) finish(); else timers.push(setTimeout(budget, 250));
        }, budgetMs));
        wake = check;
        check();
      });
      returned = true;
      groupsPending = settled.some(r => r === undefined);

      // Rows carried from the previous page of this feed come first.
      const lists = [carriedRows, ...settled.filter((r): r is FeedRow[][] => !!r).flat()].filter(l => l.length > 0);
      if (lists.length > 0) {
        // Round-robin merge so every group (and so every role) is represented.
        const seen = new Set<string>();
        const merged: FeedRow[] = [];
        const longest = Math.max(...lists.map(l => l.length));
        for (let i = 0; i < longest; i++) {
          for (const list of lists) {
            const row = list[i];
            if (row?.id && !seen.has(row.id)) { seen.add(row.id); merged.push(row); }
          }
        }
        data = merged;
        error = null;
        const groupLists = settled.filter((r): r is FeedRow[][] => !!r).flat();
        const maxRows = groupLists.length ? Math.max(...groupLists.map(l => l.length)) : 0;
        // Every group pages with the same offset/limit: advance by a full page
        // while any group is still running (it may have a full page).
        groupMaxRows = groupsPending ? limit : maxRows;
        if (carriedRows.length) log(`[FEED:${tab}] +${carriedRows.length} rows carried from the previous page`);
      }
      if (groupsPending) log(`[FEED:${tab}] returned with ${settled.filter(r => r === undefined).length}/${groups.length} groups still running`);
    }
    if (data === null) {
      const rows = await runQuery([], titleKeywords.length > 0 ? 'rescue' : 'attempt 1/1');
      if (rows) { data = rows; error = null; usedKeywords = []; groupMaxRows = rows.length; }
    }
    titleKeywords = usedKeywords;

    if (error && (!data || data.length === 0)) {
      const isTimeout = (error as { code?: string })?.code === '57014' || error instanceof JobsTimeoutError;
      return { rows: [], adjacentRows: [], companies: [], serverHadMore: false, serverRowCount: 0, titleKeywords, failure: isTimeout ? 'timeout' : 'server' };
    }
    if (!data || data.length === 0) {
      return { rows: [], adjacentRows: [], companies: [], serverHadMore: false, serverRowCount: 0, titleKeywords };
    }

    // The largest group's page size: the caller's next offset (see above).
    const serverRowCount = groupMaxRows;
    // Rows with no id can't be deduped or tracked.
    const rows = data.filter(r => !!r?.id);

    const coreIds = new Set(rows.map(r => r.id));
    const adjacentRows = (await adjacentPromise)
      .filter(r => r?.id && !coreIds.has(r.id))
      .slice(0, adjacentAllowance(rows.length, limit));

    const names = [...new Set([...rows, ...adjacentRows].map(r => r.company_name).filter((n): n is string => !!n))];
    const companies = names.length ? await deps.fetchCompanies(names).catch(() => []) : [];

    log(`[FEED:${tab}] done: ${rows.length} core + ${adjacentRows.length} adjacent in ${Date.now() - started}ms`);
    const degraded = requestedKeywords.length > 0 && usedKeywords.length === 0;
    return { rows, adjacentRows, companies, serverHadMore: serverRowCount > 0, serverRowCount, titleKeywords, degraded };
  } catch (e) {
    const isTimeout = e instanceof JobsTimeoutError;
    log(`[FEED:${tab}] ${isTimeout ? 'timeout' : 'exception'} after ${Date.now() - started}ms`, e);
    return { rows: [], adjacentRows: [], companies: [], serverHadMore: false, serverRowCount: 0, failure: isTimeout ? 'timeout' : 'network' };
  }
}

/**
 * Case-insensitive company lookup filter for PostgREST `.or()`. Values are
 * quoted so names with commas or parentheses don't break it.
 */
export function companyNameFilter(names: string[]): string {
  return names.map(n => `name.ilike."${n.replace(/["\\]/g, '\\$&')}"`).join(',');
}
