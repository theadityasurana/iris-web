import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Send, Mic, FileText, Bookmark, ScrollText, Sparkles, ChevronRight } from 'lucide-react';
import { useApplications, useEntitlements } from '@web/lib/queries';
import { CompanyLogo, Empty, SkeletonList, StatusBadge, timeAgo } from '@web/ui/bits';

type Filter = 'done' | 'pending';

/** 30-day bar chart of applications per day. */
function Streak({ dates }: { dates: string[] }) {
  const { counts, streak, max } = useMemo(() => {
    const days = 30;
    const counts = new Array(days).fill(0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const iso of dates) {
      const d = new Date(iso); d.setHours(0, 0, 0, 0);
      const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < days) counts[days - 1 - diff]++;
    }
    let streak = 0;
    for (let i = days - 1; i >= 0 && counts[i] > 0; i--) streak++;
    return { counts, streak, max: Math.max(1, ...counts) };
  }, [dates]);
  return (
    <div className="card pad">
      <div className="row between">
        <div>
          <div className="t-sub">Application streak</div>
          <div className="t-caption muted">Last 30 days</div>
        </div>
        {streak > 0 && <span className="badge dark num">{streak} day{streak > 1 ? 's' : ''}</span>}
      </div>
      <div className="bars" role="img" aria-label={`Applications per day over 30 days; current streak ${streak} days`}>
        {counts.map((c, i) => <span key={i} title={`${c} application${c === 1 ? '' : 's'}`} style={{ height: `${Math.max(4, (c / max) * 100)}%`, opacity: c ? 1 : 0.35 }} />)}
      </div>
    </div>
  );
}

export default function Applications() {
  const { data: apps = [], isLoading } = useApplications();
  const ent = useEntitlements();
  const [filter, setFilter] = useState<Filter>('done');
  const [q, setQ] = useState('');

  const pending = apps.filter(a => a.status === 'pending' || a.status === 'processing');
  const done = apps.filter(a => a.status !== 'pending' && a.status !== 'processing');
  const interviews = apps.filter(a => a.status === 'interview_scheduled' || a.status === 'interviewing').length;
  const viaIris = apps.filter(a => a.appliedByIris).length;

  const list = useMemo(() => {
    const base = filter === 'pending' ? pending : done;
    const ql = q.trim().toLowerCase();
    return ql ? base.filter(a => a.job.jobTitle.toLowerCase().includes(ql) || a.job.companyName.toLowerCase().includes(ql)) : base;
  }, [filter, pending, done, q]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-title">Applications</h1>
          <p className="t-body muted">Everything Iris has applied to for you, and where each one stands.</p>
        </div>
        <Link to="/app/applications/logs" className="btn outline"><ScrollText />Activity log</Link>
      </div>

      {pending.length > 0 && (
        <div className="banner" style={{ marginBottom: 16 }}>
          <span className="live-dot" />
          <span className="grow">{pending.length} application{pending.length > 1 ? 's' : ''} in the queue. Iris is filling {pending.length > 1 ? 'them' : 'it'} in now.</span>
          <button className="btn sm secondary" onClick={() => setFilter('pending')}>View</button>
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="v">{apps.length}</div><div className="k">Applied</div></div>
        <div className="stat"><div className="v">{interviews}</div><div className="k">Interviews</div></div>
        <div className="stat"><div className="v">{viaIris}</div><div className="k">By Iris auto-apply</div></div>
        <div className="stat"><div className="v">{pending.length}</div><div className="k">In the queue</div></div>
      </div>

      <div className="apps-grid section">
        <Streak dates={apps.map(a => a.appliedDate)} />
        <div className="quick">
          <Link to="/app/interviews" className="quick-item"><Mic /><span className="grow">Practice an interview</span><ChevronRight className="chev" /></Link>
          <Link to={ent.iris ? '/app/iris/report' : '/app/iris'} className="quick-item"><FileText /><span className="grow">Iris report</span><ChevronRight className="chev" /></Link>
          <Link to="/app/saved" className="quick-item"><Bookmark /><span className="grow">Saved jobs</span><ChevronRight className="chev" /></Link>
        </div>
      </div>

      <div className="section">
        <div className="row between wrap gap-12" style={{ marginBottom: 12 }}>
          <div className="segmented">
            <button className={filter === 'done' ? 'on' : ''} onClick={() => setFilter('done')}>Submitted <span className="muted num">{done.length}</span></button>
            <button className={filter === 'pending' ? 'on' : ''} onClick={() => setFilter('pending')}>In progress <span className="muted num">{pending.length}</span></button>
          </div>
          <div className="input-wrap" style={{ width: 260 }}><Search /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search applications" style={{ height: 38 }} /></div>
        </div>

        {isLoading ? <SkeletonList /> : list.length === 0 ? (
          apps.length === 0
            ? <Empty icon={Send} title="No applications yet" body="Swipe right on a job and Iris applies for you. It shows up here straight away." action={<Link to="/app/jobs" className="btn">Find jobs</Link>} />
            : <Empty icon={Search} title={q ? 'No matches' : filter === 'pending' ? 'Nothing in the queue' : 'Nothing submitted yet'} />
        ) : (
          <div className="list lined card">
            {list.map(a => (
              <Link key={a.id} to={`/app/applications/${a.id}`} className="list-row">
                <CompanyLogo name={a.job.companyName} url={a.job.companyLogo} />
                <div className="grow">
                  <div className="t-sub ellipsis">{a.job.jobTitle}</div>
                  <div className="t-callout muted ellipsis">
                    {a.job.companyName}{a.job.location ? ` · ${a.job.location}` : ''}
                    {a.appliedByIris && <span className="iris-tag"><Sparkles size={12} />Iris</span>}
                  </div>
                </div>
                <div className="stack" style={{ alignItems: 'flex-end', gap: 4 }}>
                  <StatusBadge status={a.status} />
                  <span className="t-caption muted">{timeAgo(a.appliedDate)}</span>
                </div>
                <ChevronRight className="chev" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
