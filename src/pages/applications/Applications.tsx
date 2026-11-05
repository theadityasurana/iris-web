import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ChevronRight, ScrollText, Search, Send, Sparkles } from 'lucide-react';
import { useApplications } from '@web/lib/queries';
import { CompanyLogo, Empty, StatusBadge, timeAgo } from '@web/ui/bits';

const IN_PROGRESS = new Set(['pending', 'processing', 'failed']);
const INTERVIEW = new Set(['interviewing', 'interview_scheduled']);
const CLOSED = new Set(['rejected', 'withdrawn']);
/** Rough time one application takes by hand, for the "time saved" figure. */
const MINUTES_PER_APPLICATION = 4;

const timeSaved = (n: number) => {
  const mins = n * MINUTES_PER_APPLICATION;
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}`.trim();
};
const fileName = (url?: string | null) => {
  if (!url) return null;
  try { return decodeURIComponent(new URL(url).pathname.split('/').pop() || '') || null; } catch { return null; }
};
/** Waiting on a verification code from the person. */
const needsYou = (a: { status: string; raw: Record<string, any> }) => !!a.raw.verification_otp && IN_PROGRESS.has(a.status);
/** The agent's progress, from the steps the queue row has recorded. */
const liveStep = (raw: Record<string, any>): string | null => {
  let stamps: unknown = raw.progress_timestamps;
  if (typeof stamps === 'string') { try { stamps = JSON.parse(stamps); } catch { stamps = []; } }
  const done = Array.isArray(stamps) ? stamps.length : 0;
  return done > 0 ? `Filling in · step ${done}` : null;
};

type Filter = 'all' | 'progress' | 'submitted' | 'needs' | 'interview' | 'offer' | 'closed';
type Sort = 'date' | 'company' | 'role';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'progress', label: 'In progress' }, { key: 'submitted', label: 'Submitted' },
  { key: 'needs', label: 'Needs you' }, { key: 'interview', label: 'Interview' }, { key: 'offer', label: 'Offer' }, { key: 'closed', label: 'Closed' },
];

function matches(a: { status: string; raw: Record<string, any> }, f: Filter) {
  const { status } = a;
  switch (f) {
    case 'all': return true;
    case 'needs': return needsYou(a);
    case 'progress': return IN_PROGRESS.has(status);
    case 'interview': return INTERVIEW.has(status);
    case 'offer': return status === 'offer';
    case 'closed': return CLOSED.has(status);
    case 'submitted': return !IN_PROGRESS.has(status) && !INTERVIEW.has(status) && !CLOSED.has(status) && status !== 'offer';
  }
}

export default function Applications() {
  const { data: apps = [], isLoading } = useApplications();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('date');
  const [q, setQ] = useState('');

  const counts = useMemo(() => ({
    submitted: apps.filter(a => !IN_PROGRESS.has(a.status)).length,
    progress: apps.filter(a => IN_PROGRESS.has(a.status)).length,
    successful: apps.filter(a => INTERVIEW.has(a.status) || a.status === 'offer').length,
    needs: apps.filter(needsYou).length,
  }), [apps]);

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const rows = apps.filter(a => matches(a, filter) && (!ql || `${a.job.companyName} ${a.job.jobTitle} ${a.job.location}`.toLowerCase().includes(ql)));
    const by: Record<Sort, (a: typeof rows[number], b: typeof rows[number]) => number> = {
      date: (a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime(),
      company: (a, b) => a.job.companyName.localeCompare(b.job.companyName),
      role: (a, b) => a.job.jobTitle.localeCompare(b.job.jobTitle),
    };
    return [...rows].sort(by[sort]);
  }, [apps, filter, sort, q]);

  return (
    <div className="page wide">
      <div className="page-head">
        <div>
          <h1 className="t-title">Applications</h1>
          <p>Everything Iris has sent, and how each submission is going. Replies land in Tracker.</p>
        </div>
        <Link to="/app/applications/logs" className="btn outline"><ScrollText />Activity log</Link>
      </div>

      <section className="summary-card">
        <h2 className="t-heading">What Iris has done</h2>
        <div className="summary-stats">
          <div><b className="num">{isLoading ? '–' : counts.submitted + counts.progress}</b><span className="t-overline muted">Applications sent</span></div>
          <div><b className="num">{isLoading ? '–' : counts.successful}</b><span className="t-overline muted">Interviews and offers</span></div>
          <div><b className="num">{isLoading ? '–' : counts.needs}</b><span className="t-overline muted">Needs you</span></div>
          <div title="Estimated at about 4 minutes per application"><b className="num">{isLoading ? '–' : timeSaved(apps.length)}</b><span className="t-overline muted">Time saved (est.)</span></div>
        </div>
      </section>

      <div className="table-tools">
        <div className="pill-tabs" role="group" aria-label="Filter by status">
          {FILTERS.map(f => <button key={f.key} className={filter === f.key ? 'on' : ''} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>)}
        </div>
        <div className="table-tools-right">
          <div className="sort-group" role="group" aria-label="Sort">
            <span className="t-overline muted">Sort</span>
            {(['date', 'company', 'role'] as Sort[]).map(s => <button key={s} className={sort === s ? 'on' : ''} aria-pressed={sort === s} onClick={() => setSort(s)}>{s[0].toUpperCase() + s.slice(1)}{sort === s && s === 'date' && <ArrowDown size={13} />}</button>)}
          </div>
          <div className="input-wrap table-search"><Search /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Company or role" aria-label="Search applications" /></div>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-head t-overline muted" aria-hidden="true"><span>Company</span><span>Resume</span><span>Status</span><span>Applied</span><span /></div>
        {isLoading ? (
          <div role="status" aria-label="Loading applications">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="table-row" aria-hidden="true"><div className="row gap-12"><div className="sk" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} /><div className="grow stack gap-6"><div className="sk" style={{ height: 14, width: '55%' }} /><div className="sk" style={{ height: 11, width: '30%' }} /></div></div><div className="sk" style={{ height: 12, width: 70 }} /><div className="sk" style={{ height: 22, width: 90, borderRadius: 99 }} /><div className="sk" style={{ height: 12, width: 56 }} /><span /></div>)}
          </div>
        ) : list.length === 0 ? (
          apps.length === 0
            ? <Empty icon={Send} title="No applications yet" body="Apply to a job and it shows up here straight away." action={<Link to="/app/jobs" className="btn">Find jobs</Link>} />
            : <Empty icon={Search} title="Nothing matches" body="Try another filter or search." />
        ) : list.map(a => (
          <Link key={a.id} to={`/app/applications/${a.id}`} className={`table-row ${IN_PROGRESS.has(a.status) ? 'live' : ''}`}>
            <div className="row gap-12" style={{ minWidth: 0 }}>
              <CompanyLogo name={a.job.companyName} url={a.job.companyLogo} size="sm" />
              <div className="grow">
                <div className="ellipsis" style={{ fontWeight: 500 }}>{a.job.jobTitle}</div>
                <div className="t-caption muted ellipsis">{a.job.companyName}{a.appliedByIris && <span className="iris-tag"><Sparkles size={12} />Auto-apply</span>}</div>
              </div>
            </div>
            <span className="t-caption muted ellipsis table-resume">{fileName(a.raw.resume_url ?? a.raw.tailored_resume_url) ?? '–'}</span>
            <div>
              <StatusBadge status={a.status} />
              {IN_PROGRESS.has(a.status) && liveStep(a.raw) && <div className="table-live ellipsis">{liveStep(a.raw)}</div>}
            </div>
            <time className="t-caption muted">{timeAgo(a.appliedDate)}</time>
            <ChevronRight className="chev" />
          </Link>
        ))}
      </div>
    </div>
  );
}
