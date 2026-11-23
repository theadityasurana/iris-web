/**
 * Browse all jobs. A signed-in person with desired roles starts on jobs picked for
 * their roles (the same feed engine as their Jobs feed: their levels, their country
 * first). Otherwise it starts on 10 fixed roles and only asks the server when someone
 * submits a search or picks a filter. Every request goes through the edge-cached
 * /api/jobs, so this page adds very little load on Postgres.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPin, RotateCcw, Search, WifiOff, X } from 'lucide-react';
import { CompanyLogo, Empty, timeAgo } from '@web/ui/bits';
import { useAuth } from '@web/auth/AuthProvider';
import { fetchJobsBatch } from '@/lib/jobs';
import { getDefaultJobLevelsFromExperience } from '@/lib/feed-policy';
import { nearFromProfile } from '@/lib/feed-home';
import { readServerJobCache } from '@/lib/server-job-cache';
import type { Job } from '@/types';

interface Card { id: string; title: string; company: string; website: string | null; location: string; type: string | null; experience: string | null; salary: string | null; posted: string | null; postedText?: string; skills: string[]; ats: string | null }
interface Page { jobs: Card[]; hasMore: boolean; fixed: boolean }

const GROUPS = [
  { key: 'level', label: 'Experience', options: [['intern', 'Internship'], ['entry', 'Entry level'], ['experienced', 'Experienced']] },
  { key: 'mode', label: 'Work mode', options: [['remote', 'Remote'], ['hybrid', 'Hybrid'], ['onsite', 'On-site']] },
  { key: 'type', label: 'Job type', options: [['full', 'Full time'], ['part', 'Part time'], ['contract', 'Contract']] },
  { key: 'days', label: 'Posted', options: [['1', '24h'], ['7', '7d'], ['14', '14d'], ['30', '30d']] },
] as const;
const TINTS = ['tint-sand', 'tint-sage', 'tint-rose', 'tint-sky', 'tint-lilac'];

const atsOf = (url?: string) => {
  const u = (url || '').toLowerCase();
  if (u.includes('greenhouse')) return 'Greenhouse';
  if (u.includes('lever.co')) return 'Lever';
  if (u.includes('ashbyhq')) return 'Ashby';
  if (u.includes('smartrecruiters')) return 'SmartRecruiters';
  return null;
};
const toCard = (j: Job): Card => ({
  id: j.id, title: j.jobTitle, company: j.companyName, website: j.companyWebsite ?? null,
  location: j.location, type: j.employmentType || null,
  experience: j.experienceLevel && j.experienceLevel !== 'Not specified' ? j.experienceLevel : null,
  salary: j.salaryRangeRaw || null, posted: null, postedText: j.postedDate || undefined,
  skills: j.skills ?? [], ats: atsOf(j.portalUrl),
});
const PERSONAL_PAGE = 24;
/** Cards shown at a time; "Load more" reveals the next set. */
const SHOW_STEP = 8;

// ── Personal Browse cache: shows instantly, refreshes in the background ──────
type Mine = { cards: Card[]; offset: number; hasMore: boolean; world: boolean };
const MINE_EMPTY: Mine = { cards: [], offset: 0, hasMore: true, world: false };
const MINE_TTL_MS = 12 * 60 * 60 * 1000;   // usable for 12 hours
const MINE_STALE_MS = 20 * 60 * 1000;      // refreshed quietly after 20 minutes
const mineKey = (uid: string, roles: string[]) => `iris_browse_mine_v1:${uid}:${roles.join('|')}`;
function readMine(key: string): { at: number; mine: Mine } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v?.mine?.cards?.length && Date.now() - v.at < MINE_TTL_MS ? v : null;
  } catch { return null; }
}
function writeMine(key: string, mine: Mine) {
  try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), mine })); } catch { /* private mode / full */ }
}

async function fetchPage(qs: string): Promise<Page> {
  const res = await fetch(`/api/jobs?${qs}`);
  if (!res.ok) throw new Error('jobs');
  return res.json();
}

function JobCard({ job, index }: { job: Card; index: number }) {
  return (
    <Link to={`/app/jobs/${encodeURIComponent(job.id)}`} className={`bj-card ${TINTS[index % TINTS.length]}`}>
      <div className="bj-top">
        <span className="ellipsis"><MapPin size={12} />{job.location || 'Location open'}</span>
        {job.salary && <b className="bj-pay ellipsis">{job.salary}</b>}
      </div>
      <h2 className="bj-title">{job.title}</h2>
      <div className="bj-tags">
        {job.experience && <span>{job.experience}</span>}
        {job.type && <span>{job.type}</span>}
        {job.skills.slice(0, 3).map(s => <span key={s}>{s}</span>)}
      </div>
      <div className="bj-foot">
        <CompanyLogo name={job.company} website={job.website} size="sm" />
        <div className="grow"><b className="ellipsis">{job.company}</b><small className="ellipsis">{[job.postedText ?? (job.posted && timeAgo(job.posted)), job.ats].filter(Boolean).join(' · ')}</small></div>
        <span className="bj-go" aria-hidden="true"><ArrowRight size={16} /></span>
      </div>
    </Link>
  );
}

export default function BrowseJobs() {
  const [params, setParams] = useSearchParams();
  const [draftQ, setDraftQ] = useState(params.get('q') ?? '');
  const [draftLoc, setDraftLoc] = useState(params.get('loc') ?? '');
  const [offset, setOffset] = useState(0);
  const [extra, setExtra] = useState<Card[]>([]);

  const qs = params.toString();
  useEffect(() => { setOffset(0); setExtra([]); }, [qs]);

  // Signed in, desired roles set, nothing typed or filtered: jobs picked for them.
  const { profile, swipedJobIds } = useAuth();
  const roles = profile?.desiredRoles ?? [];
  const personal = qs.length === 0 && roles.length > 0;
  const { userId } = useAuth();
  const [mine, setMine] = useState<Mine>(MINE_EMPTY);
  const [mineLoading, setMineLoading] = useState(false);
  const [mineError, setMineError] = useState(false);
  const [shown, setShown] = useState(SHOW_STEP);
  useEffect(() => { setShown(SHOW_STEP); }, [qs]);
  const key = userId ? mineKey(userId, roles) : '';

  /** One page of the person's own feed (their country first, then anywhere), retried once. */
  const fetchMine = async (prev: Mine): Promise<Mine | null> => {
    if (!profile) return null;
    const near = nearFromProfile(profile);
    const home = [...near.countries, ...near.cities];
    const levels = getDefaultJobLevelsFromExperience(profile.experienceLevel);
    const run = (world: boolean, offset: number) => fetchJobsBatch({
      tab: 'unified', limit: PERSONAL_PAGE, offset, companyCap: 1, desiredRoles: roles,
      excludeIds: [...swipedJobIds, ...prev.cards.map(c => c.id)],
      filters: { jobLevels: levels.length ? levels : undefined, ...(!world && home.length ? { locations: home } : {}) },
    });
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        let world = prev.world || home.length === 0;
        let res = await run(world, prev.offset);
        if (!world && res.jobs.length === 0 && !res.failure) { world = true; res = await run(true, 0); }
        if (res.failure && res.jobs.length === 0) throw new Error(res.failure);
        const ids = new Set(prev.cards.map(c => c.id));
        const cards = [...prev.cards, ...res.jobs.filter(j => !ids.has(j.id)).map(toCard)];
        const offset = (world && !prev.world ? 0 : prev.offset) + res.serverRowCount;
        return { cards, offset, hasMore: res.serverHadMore || (!world && home.length > 0), world };
      } catch {
        if (attempt === 0) await new Promise(r => setTimeout(r, 800));
      }
    }
    return null;
  };

  /** Backup: the site's edge-cached search for their top role. */
  const fetchBackup = async (): Promise<Mine | null> => {
    try {
      const page = await fetchPage(new URLSearchParams({ q: roles[0] }).toString());
      return page.jobs.length ? { cards: page.jobs, offset: 0, hasMore: false, world: true } : null;
    } catch { return null; }
  };

  const loadMine = async (reset: boolean) => {
    if (!profile || mineLoading) return;
    setMineLoading(true); setMineError(false);
    const prev = reset ? MINE_EMPTY : mine;
    const next = await fetchMine(prev);
    if (next) {
      setMine(next);
      if (key) writeMine(key, next);
    } else if (reset && mine.cards.length === 0) {
      const backup = await fetchBackup();
      if (backup) setMine(backup); else setMineError(true);
    } else if (!reset) {
      setMine(m => ({ ...m, hasMore: false }));
    }
    setMineLoading(false);
  };

  useEffect(() => {
    if (!personal || !profile) return;
    let cancelled = false;
    (async () => {
      // 1. This device's cache: instant.
      const cached = key ? readMine(key) : null;
      if (cached) {
        setMine(cached.mine);
        if (Date.now() - cached.at < MINE_STALE_MS) return;
      } else if (userId) {
        // 2. The person's server job cache (shared with the app) while fresh jobs load.
        const server = await readServerJobCache(userId).catch(() => []);
        if (!cancelled && server.length) setMine({ ...MINE_EMPTY, cards: server.map(toCard) });
      }
      // 3. Fresh jobs (quietly replaces the cached ones only on the first screen).
      const fresh = await fetchMine(MINE_EMPTY);
      if (cancelled) return;
      if (fresh) { setMine(prev => (prev.cards.length > SHOW_STEP && cached ? prev : fresh)); if (key) writeMine(key, fresh); return; }
      if (!cached) {
        const backup = await fetchBackup();
        if (cancelled) return;
        setMine(prev => (prev.cards.length ? prev : backup ?? prev));
        if (!backup) setMineError(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal, profile?.id, roles.join('|')]);

  const first = useQuery({
    queryKey: ['browse-jobs', qs],
    queryFn: () => fetchPage(qs),
    enabled: !personal,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
  const more = useQuery({
    queryKey: ['browse-jobs', qs, offset],
    queryFn: () => fetchPage(`${qs}${qs ? '&' : ''}offset=${offset}`),
    enabled: offset > 0,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (!more.data || offset === 0) return;
    setExtra(prev => {
      const ids = new Set(prev.map(j => j.id));
      return [...prev, ...more.data.jobs.filter(j => !ids.has(j.id))];
    });
  }, [more.data, offset]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && params.get(key) !== value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    for (const [k, v] of [['q', draftQ], ['loc', draftLoc]] as const) { if (v.trim()) next.set(k, v.trim()); else next.delete(k); }
    setParams(next, { replace: true });
  };
  const clear = () => { setDraftQ(''); setDraftLoc(''); setParams({}, { replace: true }); };

  const filtered = qs.length > 0;
  const seen = new Set<string>();
  const jobs = [...(first.data?.jobs ?? []), ...extra].filter(j => (seen.has(j.id) ? false : (seen.add(j.id), true)));
  const hasMore = offset > 0 ? more.data?.hasMore : first.data?.hasMore;

  return (
    <div className="page wide bj">
      <header className="bj-hero">
        <div className="t-overline muted">Browse all jobs</div>
        <h1 className="t-hero">Find a role. <em>Iris applies.</em></h1>
        <p className="soft">Fresh roles from company career pages. Search everything, or start with top companies hiring now.</p>
        <form className="bj-search" onSubmit={submit} role="search">
          <div className="bj-field"><Search size={17} /><input value={draftQ} onChange={e => setDraftQ(e.target.value)} maxLength={60} placeholder="Job title or company" aria-label="Job title or company" /></div>
          <div className="bj-field bj-loc"><MapPin size={17} /><input value={draftLoc} onChange={e => setDraftLoc(e.target.value)} maxLength={40} placeholder="City or country" aria-label="City or country" /></div>
          <button className="btn lg" type="submit">Search</button>
        </form>
        <div className="bj-filters">
          {GROUPS.map(g => (
            <div key={g.key} role="group" aria-label={g.label} className="bj-group">
              {g.options.map(([value, label]) => {
                const on = params.get(g.key) === value;
                return <button key={value} type="button" className={`ob-pill ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setParam(g.key, value)}>{label}</button>;
              })}
            </div>
          ))}
        </div>
      </header>

      <div className="bj-rule">
        <span className="t-caption muted">{filtered ? 'Your results' : personal ? 'Picked for your roles' : 'Top companies hiring now'}</span>
        <hr />
        {filtered && <button className="btn ghost sm" onClick={clear}><X />Clear all</button>}
      </div>

      {personal ? (
        mine.cards.length === 0 && !mineError ? (
          <div className="bj-grid" role="status" aria-label="Loading jobs">{Array.from({ length: SHOW_STEP }, (_, i) => <div key={i} className="bj-card" aria-hidden="true"><div className="sk" style={{ height: 12, width: '50%' }} /><div className="sk" style={{ height: 24, width: '85%', marginTop: 14 }} /><div className="sk" style={{ height: 24, width: '60%', marginTop: 12, borderRadius: 99 }} /><div className="sk" style={{ height: 34, marginTop: 'auto' }} /></div>)}</div>
        ) : mine.cards.length === 0 ? (
          <div className="card"><Empty icon={WifiOff} title="We couldn’t load jobs" body="Check your connection and try again." action={<button className="btn" onClick={() => loadMine(true)}><RotateCcw />Try again</button>} /></div>
        ) : (
          <>
            <div className="bj-grid">{mine.cards.slice(0, shown).map((j, i) => <JobCard key={j.id} job={j} index={i} />)}</div>
            {(shown < mine.cards.length || mine.hasMore) && (
              <div className="bj-more"><button className="btn outline lg" disabled={mineLoading} onClick={() => {
                setShown(n => n + SHOW_STEP);
                if (shown + SHOW_STEP > mine.cards.length - SHOW_STEP && mine.hasMore) void loadMine(false);
              }}>{mineLoading && shown >= mine.cards.length ? <span className="spinner" /> : 'Load more'}</button></div>
            )}
          </>
        )
      ) : first.isLoading ? (
        <div className="bj-grid" role="status" aria-label="Loading jobs">{Array.from({ length: SHOW_STEP }, (_, i) => <div key={i} className="bj-card" aria-hidden="true"><div className="sk" style={{ height: 12, width: '50%' }} /><div className="sk" style={{ height: 24, width: '85%', marginTop: 14 }} /><div className="sk" style={{ height: 24, width: '60%', marginTop: 12, borderRadius: 99 }} /><div className="sk" style={{ height: 34, marginTop: 'auto' }} /></div>)}</div>
      ) : first.isError ? (
        <div className="card"><Empty icon={WifiOff} title="We couldn’t load jobs" body="Check your connection and try again." action={<button className="btn" onClick={() => first.refetch()}><RotateCcw />Try again</button>} /></div>
      ) : jobs.length === 0 ? (
        <div className="card"><Empty icon={Search} title="No roles match that yet" body="Try fewer filters or a broader search." action={<button className="btn" onClick={clear}>Clear all</button>} /></div>
      ) : (
        <div className={`bj-grid ${first.isFetching ? 'is-stale' : ''}`}>{jobs.slice(0, shown).map((j, i) => <JobCard key={j.id} job={j} index={i} />)}</div>
      )}

      {!personal && jobs.length > 0 && (shown < jobs.length || (filtered && hasMore)) && (
        <div className="bj-more"><button className="btn outline lg" disabled={more.isFetching} onClick={() => {
          setShown(n => n + SHOW_STEP);
          if (filtered && hasMore && shown + SHOW_STEP >= jobs.length) setOffset(o => o + 10);
        }}>{more.isFetching && shown >= jobs.length ? <span className="spinner" /> : 'Load more'}</button></div>
      )}
    </div>
  );
}
