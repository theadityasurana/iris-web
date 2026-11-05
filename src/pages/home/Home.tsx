import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Inbox as InboxIcon, Search, ClipboardList, RotateCcw, WifiOff } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useApplications, useEntitlements } from '@web/lib/queries';
import { useCredits } from '@web/lib/webBilling';
import { useToast } from '@web/ui/Toast';
import { CompanyLogo, Empty, SkeletonList, StatusBadge, timeAgo } from '@web/ui/bits';
import type { Job } from '@/types';
import { JobTile, JobTileSkeleton } from '@web/pages/jobs/JobParts';
import { EMPTY_FILTERS, useFeed } from '@web/pages/jobs/useFeed';
import { useJobActions } from '@web/pages/jobs/useJobActions';
import { OutOfCredits } from '@web/pages/jobs/OutOfCredits';

const NO_TAGS: string[] = [];
const GOAL_LABEL: Record<string, string> = {
  land_asap: 'Land a job as soon as possible', more_money: 'Move into a higher-paying role', dream_job: 'Land your dream job',
  career_growth: 'Accelerate your career growth', remote_work: 'Find remote work', work_life: 'Find a better work-life balance',
  learn_skills: 'Learn new skills on the job', switch_industry: 'Switch to a new industry',
};
const VISIBLE = 6;

export default function Home() {
  const { profile, onboardingData, swipedJobIds } = useAuth();
  const toast = useToast();
  const feed = useFeed(profile, swipedJobIds, NO_TAGS, EMPTY_FILTERS);
  const actions = useJobActions();
  const apps = useApplications();
  const [q, setQ] = useState('');

  const act = useCallback(async (kind: 'save' | 'pass' | 'apply', job: Job) => {
    feed.remove(job.id);
    if (kind === 'pass') return actions.skip(job);
    if (kind === 'save') {
      const ok = await actions.save(job);
      return toast(ok ? `Saved ${job.jobTitle}` : 'Could not save this job', ok ? 'ok' : 'error');
    }
    const outcome = await actions.apply(job);
    if (outcome === 'no-credits') return feed.restore(job);
    toast(outcome === 'applied' ? `Applying to ${job.companyName}` : 'Your application could not be queued', outcome === 'applied' ? 'ok' : 'error');
  }, [feed, actions, toast]);

  const roles = profile?.desiredRoles ?? [];
  const goal = GOAL_LABEL[onboardingData.goal] ?? null;
  const firstName = (profile?.name || '').split(' ')[0];
  const recent = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (apps.data ?? []).filter(a => !ql || `${a.job.companyName} ${a.job.jobTitle}`.toLowerCase().includes(ql)).slice(0, 5);
  }, [apps.data, q]);
  const shown = feed.visible.slice(0, VISIBLE);
  const ent = useEntitlements();
  const { webLeft } = useCredits();
  const isFree = !ent.paid && webLeft <= 0;
  const behind = feed.visible.slice(VISIBLE);
  const logos = useMemo(() => [...new Map(behind.map(j => [j.companyName, j])).values()].slice(0, 5), [behind]);

  return (
    <div className="page wide">
      <section className="hero-card">
        <img src="/media/onboarding/final.webp" alt="" width={880} height={1100} />
        <div className="hero-copy">
          <div className="t-overline">{firstName ? `Welcome back, ${firstName}` : 'Your goal'}</div>
          <h1 className="t-display">{goal ? <>{goal}.</> : <>Where do you want to <em>land?</em></>}</h1>
          <p>{goal ? 'Iris is prioritising roles that fit this goal. Swipe through them, or let auto-apply work while you sleep.' : 'Tell Iris what you are after and it will prioritise the roles that fit.'}</p>
          <div className="row gap-8 wrap center" style={{ marginTop: 22 }}>
            <Link to="/app/jobs" className="btn lg hero-btn">Start swiping<ArrowRight /></Link>
            <Link to="/app/iris" className="btn lg outline hero-alt">Set up auto-apply</Link>
          </div>
        </div>
      </section>

      <div className="what-jobs">
        <span className="t-overline muted">What jobs</span>
        <Link to="/app/profile" className="chip">{roles[0] ?? 'Add target roles'}{roles.length > 1 && ` +${roles.length - 1}`}</Link>
        {profile?.location && <Link to="/app/profile" className="chip">{profile.location}</Link>}
        <Link to="/app/settings?s=job-preferences" className="chip">Preferences<ChevronDown size={14} /></Link>
      </div>

      <section className="home-section">
        <div className="section-title">
          <h2 className="t-title">Jobs for you {shown.length > 0 && <span className="count-note">({shown.length})</span>}</h2>
          <div className="row gap-8">
            <Link to="/app/jobs/search" className="btn outline"><Search />Search</Link>
            <Link to="/app/jobs" className="btn">Swipe jobs</Link>
          </div>
        </div>
        {shown.length > 0 ? (
          <>
            <div className="tile-grid">{shown.map(j => <JobTile key={j.id} job={j} onSave={() => act('save', j)} onPass={() => act('pass', j)} onApply={() => act('apply', j)} />)}</div>
            {isFree && behind.length > 0 && (
              <div className="feed-gate">
                <div className="feed-gate-ghosts" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} className="tile feed-ghost"><JobTileSkeleton /></div>)}</div>
                <div className="feed-gate-card">
                  <div className="t-overline">You’ve seen your top {shown.length}</div>
                  <h3 className="t-display"><span className="num">{behind.length}</span>{feed.remaining > behind.length + shown.length ? '+' : ''} more {behind.length === 1 ? 'role matches' : 'roles match'} you</h3>
                  <p className="soft">Keep swiping for free, or upgrade and let your agent apply to the ones you pick.</p>
                  <div className="feed-gate-logos">{logos.map(j => <CompanyLogo key={j.companyName} name={j.companyName} url={j.companyLogo} website={j.companyWebsite} size="sm" />)}</div>
                  {logos.length > 0 && <p className="t-caption muted">Roles at {logos.slice(0, 2).map(j => j.companyName).join(', ')}{logos.length > 2 ? ' and more' : ''}</p>}
                  <div className="row gap-8 wrap center" style={{ marginTop: 18 }}>
                    <Link to="/app/jobs" className="btn lg">See the full feed<ArrowRight /></Link>
                    <Link to="/app/plans" className="btn lg outline">Compare plans</Link>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (!feed.initialLoaded || feed.loading) ? (
          <div className="tile-grid" role="status" aria-label="Loading jobs">{Array.from({ length: 3 }, (_, i) => <JobTileSkeleton key={i} />)}</div>
        ) : feed.error ? (
          <div className="card"><Empty icon={WifiOff} title="We couldn't load jobs" body="Check your connection and try again." action={<button className="btn" onClick={feed.retry}><RotateCcw />Try again</button>} /></div>
        ) : (
          <div className="card"><Empty icon={InboxIcon} title="You're all caught up" body="New roles are added through the day. Check back soon." /></div>
        )}
      </section>

      <hr className="dash-rule" />

      <section className="home-section">
        <div className="section-title">
          <h2 className="t-title">Applications</h2>
          <div className="row gap-12">
            <div className="input-wrap home-search"><Search /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Company or role" aria-label="Search applications" /></div>
            <Link to="/app/applications" className="link t-callout">See all</Link>
          </div>
        </div>
        <div className="card table-card">
          {apps.isLoading ? <SkeletonList n={4} /> : recent.length === 0 ? (
            <Empty icon={ClipboardList} title={q ? 'No matches' : 'No applications yet'} body={q ? undefined : 'Apply to a job above and it shows up here.'} />
          ) : recent.map(a => (
            <Link key={a.id} to={`/app/applications/${a.id}`} className="app-row">
              <CompanyLogo name={a.job.companyName} url={a.job.companyLogo} size="sm" />
              <div className="grow"><div className="ellipsis" style={{ fontWeight: 500 }}>{a.job.jobTitle}</div><div className="t-caption muted ellipsis">{a.job.companyName}</div></div>
              <StatusBadge status={a.status} />
              <time className="t-caption muted app-when">{timeAgo(a.appliedDate)}</time>
            </Link>
          ))}
        </div>
      </section>

      <OutOfCredits open={actions.outOfCredits} onClose={() => actions.setOutOfCredits(false)} entitlements={actions.entitlements} resetAt={actions.freeResetAt} />
    </div>
  );
}
