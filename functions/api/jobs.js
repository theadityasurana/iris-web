/**
 * Public job search for /jobs and /app/browse. It protects the shared Postgres:
 * responses are edge-cached, inputs come from a fixed list, every page is capped at
 * 10 rows with no COUNT, only the columns the card shows are selected, and it runs
 * the app's existing indexed search_jobs function.
 */
const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHVqeHBhaHpscGVnempqcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTI2NjIsImV4cCI6MjA4NzMyODY2Mn0.OyjX0Qg4UlDPfTmCwhdK3JuE30698f6A-a01LunhDtM';

const PAGE = 10;
/** search_jobs keeps jobs with no level, and has no on-site test, so these filters over-fetch and trim. */
const TRIM_FETCH = 25;
/** A mode, type or level filter with no search text can time out on the whole table; a week of jobs stays fast. */
const DEFAULT_WINDOW_DAYS = 7;
const MAX_OFFSET = 40;
const FIXED_TTL = 3600;
const SEARCH_TTL = 300;
const COLUMNS = 'id,title,company_name,company_website,location,type,experience,salary_range,posted_at,skills,portal_url,education_level';

/** The fixed list on /jobs, one role from each. Names match the database exactly. */
export const TOP_COMPANIES = ['Anthropic', 'OpenAI', 'Spacex', 'Neuralink', 'Speechify', 'Perplexity', 'ElevenLabs', 'Stripe', 'Figma', 'Notion', 'Duolingo', 'Ramp'];
const DISPLAY_NAME = { Spacex: 'SpaceX' };
const BEST_ROLE = /software engineer|machine learning|ml engineer|research (engineer|scientist)|technical staff|product (manager|designer)/i;
const GOOD_ROLE = /engineer|scientist|designer|developer/i;
const NOT_CORE = /account|finance|recruit|payroll|facilit|sales|legal/i;
const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };

/** Newest open roles at one company. Served by the (company_name, created_at) index, so it is cheap. */
async function companyRows(name, limit, offset = 0) {
  const q = new URLSearchParams({ select: COLUMNS, company_name: `eq.${name}`, or: '(status.is.null,status.neq.closed)', order: 'created_at.desc', limit: String(limit), offset: String(offset) });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?${q}`, { headers, signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`jobs ${res.status}`);
  return res.json();
}

/** Prefers engineering, research and product roles, so the list reads well. */
export const bestRole = rows => {
  const core = rows.filter(r => !NOT_CORE.test(r.title ?? ''));
  return core.find(r => BEST_ROLE.test(r.title)) ?? core.find(r => GOOD_ROLE.test(r.title)) ?? core[0] ?? rows[0] ?? null;
};

/** A search for exactly one top company, with no other filters, skips the slow text search. */
export function topCompanyFor(f) {
  if (!f.q || f.loc || f.level || f.mode || f.type || f.days) return null;
  return TOP_COMPANIES.find(c => c.toLowerCase() === f.q) ?? null;
}

export const LEVELS = {
  intern: { exact: ['Internship'], titles: ['intern', 'internship', 'trainee', 'apprentice'] },
  entry: { exact: ['Entry Level'], titles: ['junior', 'graduate', 'entry level', 'associate'] },
  experienced: { exact: ['Middle Level', 'Senior Level', 'Lead', 'Principal'] },
};
const MODES = { remote: 'remote', hybrid: 'hybrid', onsite: null };
const TYPES = { full: 'Full-time', part: 'Part-time', contract: 'Contract' };
const DAYS = new Set(['1', '7', '14', '30']);

export const clean = (v, max) => (v || '').replace(/[^\p{L}\p{N} +#&./,'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** Only known values survive, in one order, so equal searches share one cache entry. */
export function normalize(url) {
  const q = new URL(url).searchParams;
  const pick = (k, table) => (Object.hasOwn(table, q.get(k) ?? '') ? q.get(k) : '');
  const offset = Math.min(MAX_OFFSET, Math.max(0, Math.floor(Number(q.get('offset')) / PAGE) * PAGE || 0));
  return {
    q: clean(q.get('q'), 60).toLowerCase(),
    loc: clean(q.get('loc'), 40).toLowerCase(),
    level: pick('level', LEVELS),
    mode: pick('mode', MODES),
    type: pick('type', TYPES),
    days: DAYS.has(q.get('days') ?? '') ? q.get('days') : '',
    offset,
  };
}

export const isFixed = f => !f.q && !f.loc && !f.level && !f.mode && !f.type && !f.days && f.offset === 0;

const needsTrim = f => f.level === 'intern' || f.level === 'entry' || f.mode === 'onsite';

export function rpcParams(f, now = Date.now()) {
  const limit = needsTrim(f) ? TRIM_FETCH : PAGE;
  const p = { p_tab: 'discover', p_limit: limit, p_offset: (f.offset / PAGE) * limit, p_company_cap: f.q ? 3 : needsTrim(f) || f.mode || f.type || f.level ? 3 : 1 };
  if (f.q) p.p_search_tags = [f.q];
  if (f.loc) p.p_location_keywords = [f.loc];
  // With no search text, intern and entry roles are found by title, which is indexed.
  const byTitle = !f.q && LEVELS[f.level]?.titles;
  if (byTitle) p.p_search_tags = byTitle;
  else if (f.level) p.p_exp_exact = LEVELS[f.level].exact;
  if (MODES[f.mode]) p.p_work_modes = [MODES[f.mode]];
  if (f.type) p.p_job_types = [TYPES[f.type]];
  const days = f.days ? Number(f.days) : (!f.q && !byTitle && (f.mode || f.type || f.level) ? DEFAULT_WINDOW_DAYS : 0);
  // Whole days, so the query and the cache entry stay stable through the day.
  if (days) p.p_posted_after = new Date(Math.floor(now / 864e5) * 864e5 - days * 864e5).toISOString();
  return p;
}

/** Removes rows the database could not rule out. */
export function trimRows(rows, f, max = PAGE) {
  let out = rows;
  if (f.mode === 'onsite') out = out.filter(r => !/remote|hybrid/i.test(`${r.type ?? ''} ${r.location ?? ''}`));
  if (f.level === 'intern' || f.level === 'entry') {
    const title = f.level === 'intern' ? /\b(intern|internship|trainee|apprentice|co-?op)\b/i : /\b(junior|jr\.?|graduate|grad|entry|associate|fresher)\b/i;
    out = out.filter(r => LEVELS[f.level].exact.includes(r.experience) || title.test(r.title ?? ''));
  }
  return out.slice(0, max);
}

/** Up to `limit` matches for a set of filters, or null if the search fails. Used for share images. */
export async function searchSample(filters, limit) {
  const company = topCompanyFor(filters);
  if (company) return companyRows(company, limit);
  const params = { ...rpcParams(filters), p_limit: limit + 15, p_offset: 0 };
  const call = extra => fetch(`${SUPABASE_URL}/rest/v1/rpc/search_jobs?select=${COLUMNS}`, { method: 'POST', headers, body: JSON.stringify({ ...params, ...extra }), signal: AbortSignal.timeout(7000) });
  let res = await call({});
  if (res.status === 500 && !filters.q) res = await call({ p_posted_after: new Date(Date.now() - DEFAULT_WINDOW_DAYS * 864e5).toISOString() });
  return res.ok ? trimRows(await res.json(), filters, limit) : null;
}

export function atsOf(url) {
  const u = (url || '').toLowerCase();
  if (u.includes('greenhouse')) return 'Greenhouse';
  if (u.includes('lever.co')) return 'Lever';
  if (u.includes('ashbyhq')) return 'Ashby';
  if (u.includes('smartrecruiters')) return 'SmartRecruiters';
  return null;
}

export function toCard(r) {
  const skills = Array.isArray(r.skills) ? r.skills : typeof r.skills === 'string' ? r.skills.split(',') : [];
  return {
    id: r.id,
    title: (r.title || '').trim() || 'Open role',
    company: DISPLAY_NAME[r.company_name] ?? ((r.company_name || '').trim() || 'Company'),
    website: r.company_website || null,
    location: (r.location || '').trim(),
    type: r.type || null,
    experience: r.experience && r.experience !== 'null' ? r.experience : null,
    salary: r.salary_range && !/competitive|undisclosed/i.test(r.salary_range) ? r.salary_range : null,
    posted: r.posted_at || null,
    skills: skills.map(s => String(s).trim()).filter(Boolean).slice(0, 4),
    ats: atsOf(r.portal_url),
  };
}

export async function onRequestGet({ request, waitUntil }) {
  const filters = normalize(request.url);
  const fixed = isFixed(filters);
  const ttl = fixed ? FIXED_TTL : SEARCH_TTL;
  const key = new Request(`https://irisjobs.live/api/jobs?${new URLSearchParams(Object.entries(filters).map(([k, v]) => [k, String(v)]))}`);
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const hit = await cache?.match(key);
  if (hit) return hit;

  const search = params => fetch(`${SUPABASE_URL}/rest/v1/rpc/search_jobs?select=${COLUMNS}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(12_000),
  });

  let rows;
  let full;
  try {
    const company = topCompanyFor(filters);
    if (fixed) {
      const lists = await Promise.allSettled(TOP_COMPANIES.map(c => companyRows(c, 20)));
      rows = lists.map(l => (l.status === 'fulfilled' ? bestRole(l.value) : null)).filter(Boolean).slice(0, PAGE);
      if (!rows.length) throw new Error('no top company roles');
      full = false;
    } else if (company) {
      rows = await companyRows(company, PAGE, filters.offset);
      full = rows.length === PAGE;
    } else {
      const params = rpcParams(filters);
      let res = await search(params);
      // A wide search timed out: answer once from the last week instead of failing.
      if (res.status === 500) res = await search({ ...params, p_posted_after: new Date(Date.now() - DEFAULT_WINDOW_DAYS * 864e5).toISOString() });
      if (!res.ok) throw new Error(`search_jobs ${res.status}`);
      rows = await res.json();
      full = rows.length === params.p_limit;
    }
  } catch (e) {
    console.error('jobs search failed', e);
    return new Response(JSON.stringify({ error: 'Jobs are busy right now. Please try again.' }), { status: 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
  const body = JSON.stringify({ jobs: trimRows(rows, filters).map(toCard), hasMore: full && filters.offset < MAX_OFFSET, fixed });
  const response = new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=60, s-maxage=${ttl}` } });
  if (cache) { const put = cache.put(key, response.clone()); if (waitUntil) waitUntil(put); else await put; }
  return response;
}
