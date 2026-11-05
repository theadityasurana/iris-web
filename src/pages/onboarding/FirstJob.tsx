/**
 * The last moment of onboarding: Iris picks one strong match from the real feed
 * and offers to apply. Everything shown comes from the job and the person's profile.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Banknote, Check, Globe2, GraduationCap, MapPin } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { CompanyLogo, formatSalary } from '@web/ui/bits';
import { titleMatchesKeyword } from '@/lib/feed-policy';
import type { Job } from '@/types';
import { EMPTY_FILTERS, useFeed } from '@web/pages/jobs/useFeed';
import { useJobActions } from '@web/pages/jobs/useJobActions';
import { OutOfCredits } from '@web/pages/jobs/OutOfCredits';
import { FirstApplyShow } from '@web/pages/jobs/FirstApplyShow';

const NO_TAGS: string[] = [];
const THINK_MS = 2600;
const MODE: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };

function reasons(job: Job, roles: string[], skills: string[]) {
  const out: string[] = [];
  const title = (job.jobTitle || '').toLowerCase();
  const role = roles.find(r => titleMatchesKeyword(title, r.toLowerCase()));
  if (role) out.push(`Lines up with your target role, ${role}.`);
  const have = new Set(skills.map(s => s.toLowerCase()));
  const shared = (job.skills ?? []).filter(s => have.has(s.toLowerCase())).slice(0, 3);
  if (shared.length) out.push(`Asks for skills on your resume: ${shared.join(', ')}.`);
  if (job.locationType === 'remote') out.push('You can do this one remotely.');
  if (job.postedDate) out.push(`Posted ${job.postedDate}, so you can be early.`);
  return out.slice(0, 3);
}

export default function FirstJob() {
  const { profile, swipedJobIds } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const feed = useFeed(profile, swipedJobIds, NO_TAGS, EMPTY_FILTERS);
  const actions = useJobActions();
  const [thinking, setThinking] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => { document.title = 'Your first match | Iris'; try { sessionStorage.removeItem('iris_show_first_job'); } catch { /* private mode */ } }, []);
  useEffect(() => { const t = setTimeout(() => setThinking(false), THINK_MS); return () => clearTimeout(t); }, []);

  const job = useMemo(() => [...feed.visible].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))[0] ?? null, [feed.visible]);
  const more = Math.max(0, feed.visible.length - 1);
  const ready = !thinking && !!job;
  const empty = !thinking && feed.initialLoaded && !feed.loading && !job;

  const why = useMemo(() => (job ? reasons(job, profile?.desiredRoles ?? [], profile?.skills ?? []) : []), [job, profile]);
  const salary = job ? formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod, job.salaryRangeRaw) : null;
  const exp = job?.experienceLevel && job.experienceLevel !== 'Not specified' ? job.experienceLevel : null;

  const apply = async () => {
    if (!job) return;
    setApplying(true);
    const outcome = await actions.apply(job);
    setApplying(false);
    if (outcome === 'applied') {
      feed.remove(job.id);
      setApplied(true);
    } else if (outcome === 'failed') {
      toast('Your application could not be queued. Please try again.', 'error');
    }
  };
  const skip = () => { if (!job) return; feed.remove(job.id); actions.skip(job); };

  // Anyone whose feed comes back empty goes straight on to Home.
  if (empty) return <Navigate to="/app/home" replace />;

  return (
    <div className="fj">
      <div className="fj-inner">
        <h1 className="fj-title">{ready ? 'Your agent picked one to start with.' : 'Your agent is choosing your first job.'}</h1>
        <p className="fj-sub">{ready && more > 0 ? <><b className="num">{more}</b> more matched jobs are lined up behind it.</> : 'Reading your profile against today’s live roles.'}</p>

        <article className={`fj-card ${ready ? 'ready' : ''}`} aria-busy={!ready}>
          {ready && job ? (
            <>
              <header>
                <CompanyLogo name={job.companyName} url={job.companyLogo} website={job.companyWebsite} />
                <div className="grow"><b className="ellipsis">{job.companyName}</b>{job.industry && <div className="t-caption muted ellipsis">{job.industry}</div>}</div>
                {job.matchScore > 0 && <div className="tile-pct"><b className="num">{job.matchScore}</b><small>%</small></div>}
              </header>
              <div className="fj-body">
                <h2 className="tile-title">{job.jobTitle}</h2>
                <div className="tile-tags">
                  <span><MapPin />{job.location}</span>
                  <span><Globe2 />{MODE[job.locationType] ?? 'On-site'}</span>
                  {salary && <span><Banknote />{salary}</span>}
                  {exp && <span><GraduationCap />{exp}</span>}
                </div>
                {why.length > 0 && (
                  <div className="fj-why">
                    <div className="t-overline muted">Why this one</div>
                    <ul>{why.map(w => <li key={w}><Check size={14} />{w}</li>)}</ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div aria-hidden="true">
              <header><div className="sk" style={{ width: 42, height: 42, borderRadius: '50%' }} /><div className="grow stack gap-6"><div className="sk" style={{ height: 15, width: '48%' }} /><div className="sk" style={{ height: 10, width: '26%' }} /></div></header>
              <div className="fj-body">
                <div className="sk" style={{ height: 22, width: '66%' }} />
                <div className="row gap-6" style={{ marginTop: 14 }}><div className="sk" style={{ height: 28, width: 96, borderRadius: 99 }} /><div className="sk" style={{ height: 28, width: 76, borderRadius: 99 }} /></div>
                <div className="fj-think"><span className="spinner" /><span className="t-overline">Choosing your first</span><span className="t-overline muted">Thinking</span></div>
                <div className="fj-lined"><div className="t-callout soft">Picking the one to start with…</div>{[92, 78, 58, 84, 88, 70].map(w => <div key={w} className="sk" style={{ height: 9, width: `${w}%` }} />)}</div>
              </div>
            </div>
          )}
        </article>

        <button className="btn lg block fj-cta" disabled={!ready || applying} onClick={apply}>{applying ? <><span className="spinner" />Sending to your agent</> : <>Apply with agent<ArrowRight /></>}</button>
        <button className="fj-skip" disabled={!ready || applying} onClick={skip}>Not for me, show another</button>
        <p className="fj-note">This is a real application. Iris submits it to the company’s own job portal for you, using one credit.</p>
        <Link to="/app/home" className="link t-caption">Go to my dashboard</Link>
      </div>
      <OutOfCredits open={actions.outOfCredits} onClose={() => { actions.setOutOfCredits(false); navigate('/app/home'); }} entitlements={actions.entitlements} resetAt={actions.freeResetAt} />
      {applied && <FirstApplyFallback onDone={() => navigate('/app/home')} />}
      <FirstApplyShow />
    </div>
  );
}

/** A returning device has already seen the show, so just move on. */
function FirstApplyFallback({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => { if (!document.querySelector('.fa-wrap')) onDone(); }, 150);
    return () => clearTimeout(t);
  }, [onDone]);
  return null;
}
