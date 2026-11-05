/**
 * Browse all jobs. Starts on 10 fixed roles and only asks the server when someone
 * submits a search or picks a filter. Every request goes through the edge-cached
 * /api/jobs, so this page adds very little load on Postgres.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPin, RotateCcw, Search, WifiOff, X } from 'lucide-react';
import { CompanyLogo, Empty, timeAgo } from '@web/ui/bits';

interface Card { id: string; title: string; company: string; website: string | null; location: string; type: string | null; experience: string | null; salary: string | null; posted: string | null; skills: string[]; ats: string | null }
interface Page { jobs: Card[]; hasMore: boolean; fixed: boolean }

const GROUPS = [
  { key: 'level', label: 'Experience', options: [['intern', 'Internship'], ['entry', 'Entry level'], ['experienced', 'Experienced']] },
  { key: 'mode', label: 'Work mode', options: [['remote', 'Remote'], ['hybrid', 'Hybrid'], ['onsite', 'On-site']] },
  { key: 'type', label: 'Job type', options: [['full', 'Full time'], ['part', 'Part time'], ['contract', 'Contract']] },
  { key: 'days', label: 'Posted', options: [['1', '24h'], ['7', '7d'], ['14', '14d'], ['30', '30d']] },
] as const;
const TINTS = ['tint-sand', 'tint-sage', 'tint-rose', 'tint-sky', 'tint-lilac'];

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
        <div className="grow"><b className="ellipsis">{job.company}</b><small className="ellipsis">{[job.posted && timeAgo(job.posted), job.ats].filter(Boolean).join(' · ')}</small></div>
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

  const first = useQuery({
    queryKey: ['browse-jobs', qs],
    queryFn: () => fetchPage(qs),
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
        <p className="soft">Fresh roles from company career pages. Search everything, or start with today’s picks.</p>
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
        <span className="t-caption muted">{filtered ? 'Your results' : 'Today’s 10 picks'}</span>
        <hr />
        {filtered && <button className="btn ghost sm" onClick={clear}><X />Clear all</button>}
      </div>

      {first.isLoading ? (
        <div className="bj-grid" role="status" aria-label="Loading jobs">{Array.from({ length: 10 }, (_, i) => <div key={i} className="bj-card" aria-hidden="true"><div className="sk" style={{ height: 12, width: '50%' }} /><div className="sk" style={{ height: 24, width: '85%', marginTop: 14 }} /><div className="sk" style={{ height: 24, width: '60%', marginTop: 12, borderRadius: 99 }} /><div className="sk" style={{ height: 34, marginTop: 'auto' }} /></div>)}</div>
      ) : first.isError ? (
        <div className="card"><Empty icon={WifiOff} title="We couldn’t load jobs" body="Check your connection and try again." action={<button className="btn" onClick={() => first.refetch()}><RotateCcw />Try again</button>} /></div>
      ) : jobs.length === 0 ? (
        <div className="card"><Empty icon={Search} title="No roles match that yet" body="Try fewer filters or a broader search." action={<button className="btn" onClick={clear}>Clear all</button>} /></div>
      ) : (
        <div className={`bj-grid ${first.isFetching ? 'is-stale' : ''}`}>{jobs.map((j, i) => <JobCard key={j.id} job={j} index={i} />)}</div>
      )}

      {filtered && hasMore && jobs.length > 0 && (
        <div className="bj-more"><button className="btn outline lg" disabled={more.isFetching} onClick={() => setOffset(o => o + 10)}>{more.isFetching ? <span className="spinner" /> : 'Show more'}</button></div>
      )}
    </div>
  );
}
