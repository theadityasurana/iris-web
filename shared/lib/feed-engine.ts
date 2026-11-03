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

    // Progressive degradation: when the query is too slow, retry with fewer
    // keywords; the last rung has none (generic recent jobs) so the user still
    // sees cards. A clean empty answer stops the ladder: the caller widens
    // levels/roles in order instead.
    const ladder: string[][] = titleKeywords.length > 0
      ? [titleKeywords, titleKeywords.slice(0, T.fallback_keyword_count), []]
      : [[]];

    let data: FeedRow[] | null = null;
    let error: unknown = null;
    let usedKeywords = titleKeywords;
    const requestedKeywords = titleKeywords;

    for (let rung = 0; rung < ladder.length; rung++) {
      const kws = ladder[rung];
      const attemptParams = { ...rpcParams };
      if (kws.length > 0) attemptParams.p_title_keywords = kws;
      else delete attemptParams.p_title_keywords;
      const t0 = Date.now();
      try {
        const res = await withTimeout(searchJobs(attemptParams), timeoutMs);
        const rows = (res.data as FeedRow[] | null) ?? [];
        log(`[FEED:${tab}] attempt ${rung + 1}/${ladder.length} (${kws.length} kw): ${res.error ? `error ${res.error.message}` : `${rows.length} rows`} in ${Date.now() - t0}ms`);
        if (!res.error) {
          data = rows;
          error = null;
          usedKeywords = kws;
          break;
        }
        error = res.error;
      } catch (e) {
        error = e;
        log(`[FEED:${tab}] attempt ${rung + 1} timed out after ${Date.now() - t0}ms`);
      }
    }
    titleKeywords = usedKeywords;

    if (error && (!data || data.length === 0)) {
      const isTimeout = (error as { code?: string })?.code === '57014' || error instanceof JobsTimeoutError;
      return { rows: [], adjacentRows: [], companies: [], serverHadMore: false, serverRowCount: 0, titleKeywords, failure: isTimeout ? 'timeout' : 'server' };
    }
    if (!data || data.length === 0) {
      return { rows: [], adjacentRows: [], companies: [], serverHadMore: false, serverRowCount: 0, titleKeywords };
    }

    const serverRowCount = data.length;
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
