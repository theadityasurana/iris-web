import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Clock, Users, Building2, ExternalLink, GraduationCap, Banknote, Globe2, Bookmark, Sparkles } from 'lucide-react';
import type { Job } from '@/types';
import { CompanyLogo, formatSalary } from '@web/ui/bits';

const MODE: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };

export type ApplyPhase = 'flip' | 'out' | null;
/** How long the "AI is applying" face holds after the flip starts, then how long it takes to leave. */
export const APPLY_FLIP_MS = 1500;
export const APPLY_OUT_MS = 320;

/**
 * Wraps a job card so Apply can flip it over to an "AI is applying for you"
 * face before it leaves. The back face only mounts while applying, so its
 * step animation starts in sync with the flip.
 */
export function ApplyFlip({ phase, company, children }: { phase: ApplyPhase; company: string; children: ReactNode }) {
  return (
    <div className={`apply-flip ${phase ? 'flipped' : ''} ${phase === 'out' ? 'out' : ''}`}>
      <div className="apply-flip-inner">
        <div className="apply-flip-front" aria-hidden={phase ? true : undefined}>{children}</div>
        {phase && (
          <div className="apply-flip-back" role="status" aria-live="polite">
            <div className="applying-orb"><Sparkles /></div>
            <div className="applying-title">AI is applying for you<span className="applying-dots"><i /><i /><i /></span></div>
            <div className="applying-steps">
              <span>Reading the role</span>
              <span>Tailoring your answers</span>
              <span className="ellipsis">Sending to {company}</span>
            </div>
            <div className="applying-bar"><i /></div>
          </div>
        )}
      </div>
    </div>
  );
}

export function matchTone(score: number) {
  if (score >= 75) return 'green';
  if (score >= 50) return 'amber';
  return '';
}

export function JobFacts({ job }: { job: Job }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod, job.salaryRangeRaw);
  return (
    <div className="facts">
      <span><MapPin />{job.location}</span>
      <span><Globe2 />{MODE[job.locationType] ?? 'On-site'}</span>
      <span><Briefcase />{job.employmentType}</span>
      {job.experienceLevel && job.experienceLevel !== 'Not specified' && <span><GraduationCap />{job.experienceLevel}</span>}
      {salary && <span><Banknote />{salary}</span>}
      <span><Clock />{job.postedDate}</span>
    </div>
  );
}

/** Score bands, same wording everywhere the score appears. */
export function matchBand(score: number) {
  if (score >= 85) return { label: 'Best match', strong: true };
  if (score >= 70) return { label: 'Top pick', strong: true };
  if (score >= 60) return { label: 'Strong fit', strong: false };
  return { label: 'Worth applying', strong: false };
}

/** Feed card: used by Home and the Jobs grid. */
export function JobTile({ job, onSave, onPass, onApply, busy }: { job: Job; onSave: () => void; onPass: () => void; onApply: () => void; busy?: boolean }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod, job.salaryRangeRaw);
  const band = matchBand(job.matchScore);
  const exp = job.experienceLevel && job.experienceLevel !== 'Not specified' ? job.experienceLevel : null;
  return (
    <article className="tile">
      <header className="tile-head">
        <CompanyLogo name={job.companyName} url={job.companyLogo} website={job.companyWebsite} />
        <div className="grow">
          <Link to={`/app/companies/${encodeURIComponent(job.companyName)}`} className="tile-company ellipsis">{job.companyName}</Link>
          {job.industry && <div className="t-caption muted ellipsis">{job.industry}</div>}
        </div>
        {job.matchScore > 0 && (
          <div className="tile-score">
            <div className="tile-pct"><b className="num">{job.matchScore}</b><small>%</small></div>
            <span className={`tile-band ${band.strong ? 'strong' : ''}`}>{band.label}</span>
          </div>
        )}
      </header>
      <div className="tile-body">
        <h3 className="tile-title"><Link to={`/app/jobs/${job.id}`}>{job.jobTitle}</Link></h3>
        <p className="t-caption muted">Posted {job.postedDate}</p>
        <div className="tile-tags">
          <span><MapPin />{job.location}</span>
          <span><Globe2 />{MODE[job.locationType] ?? 'On-site'}</span>
          {salary && <span><Banknote />{salary}</span>}
          {exp && <span><GraduationCap />{exp}</span>}
        </div>
      </div>
      <footer className="tile-actions">
        <button className="btn outline" onClick={onSave} disabled={busy}><Bookmark />Save</button>
        <button className="btn outline" onClick={onPass} disabled={busy}>Pass</button>
        <button className="btn" onClick={onApply} disabled={busy}>Apply</button>
      </footer>
    </article>
  );
}

export function JobTileSkeleton() {
  return (
    <div className="tile" aria-hidden="true">
      <div className="tile-head">
        <div className="sk" style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0 }} />
        <div className="grow stack gap-6"><div className="sk" style={{ height: 15, width: '60%' }} /><div className="sk" style={{ height: 11, width: '38%' }} /></div>
        <div className="sk" style={{ width: 44, height: 30 }} />
      </div>
      <div className="tile-body stack gap-8">
        <div className="sk" style={{ height: 22, width: '82%' }} />
        <div className="sk" style={{ height: 11, width: '30%' }} />
        <div className="row gap-6 wrap" style={{ marginTop: 8 }}><div className="sk" style={{ height: 28, width: 96, borderRadius: 99 }} /><div className="sk" style={{ height: 28, width: 76, borderRadius: 99 }} /><div className="sk" style={{ height: 28, width: 104, borderRadius: 99 }} /></div>
      </div>
      <div className="tile-actions"><div className="sk" style={{ height: 42, flex: 1, borderRadius: 99 }} /><div className="sk" style={{ height: 42, flex: 1, borderRadius: 99 }} /><div className="sk" style={{ height: 42, flex: 1, borderRadius: 99 }} /></div>
    </div>
  );
}

/** The swipe card. */
export function JobCard({ job }: { job: Job }) {
  return (
    <article className="job-card">
      <header className="row gap-12">
        <CompanyLogo name={job.companyName} url={job.companyLogo} website={job.companyWebsite} size="lg" />
        <div className="grow">
          <div className="t-callout muted ellipsis">{job.companyName}</div>
          <h2 className="t-heading clamp-2" style={{ marginTop: 2 }}>{job.jobTitle}</h2>
        </div>
        {job.matchScore > 0 && <span className={`badge ${matchTone(job.matchScore)}`}>{job.matchScore}% match</span>}
      </header>
      <JobFacts job={job} />
      {job.fitWriteup && (
        <div className="fit">
          <div className="t-overline muted">Why it fits</div>
          <p className="t-callout soft clamp-3" style={{ marginTop: 6 }}>{job.fitWriteup}</p>
        </div>
      )}
      {job.skills.length > 0 && (
        <div className="chips" style={{ marginTop: 'auto' }}>
          {job.skills.slice(0, 6).map(s => <span key={s} className="chip static">{s}</span>)}
          {job.skills.length > 6 && <span className="chip static">+{job.skills.length - 6}</span>}
        </div>
      )}
      {job.relevanceTier === 'adjacent' && <div className="t-caption muted" style={{ marginTop: 10 }}>A transferable role from a neighbouring field</div>}
    </article>
  );
}

function splitLines(text: string): string[] {
  return text.split(/\n+|•|·/).map(s => s.replace(/^[-*\s]+/, '').trim()).filter(s => s.length > 2);
}

/** Full job information; used beside the deck and on /app/jobs/:id. */
export function JobDetail({ job, compact, embedded }: { job: Job; compact?: boolean; embedded?: boolean }) {
  const Title = embedded ? 'h2' : 'h1';
  const requirements = job.requirements.length ? job.requirements : [];
  return (
    <div className="job-detail">
      {!compact && (
        <header className="row gap-16" style={{ alignItems: 'flex-start' }}>
          <CompanyLogo name={job.companyName} url={job.companyLogo} website={job.companyWebsite} size="lg" />
          <div className="grow">
            <Link to={`/app/companies/${encodeURIComponent(job.companyName)}`} className="t-callout muted">{job.companyName}</Link>
            <Title className="t-title" style={{ marginTop: 2 }}>{job.jobTitle}</Title>
          </div>
        </header>
      )}
      {!compact && <JobFacts job={job} />}

      {job.matchScore > 0 && (
        <section className="jd-section">
          <div className="row between">
            <h3 className="t-sub">Your match</h3>
            <span className={`badge ${matchTone(job.matchScore)}`}>{job.matchScore}%</span>
          </div>
          {job.fitWriteup && <p className="t-body soft" style={{ marginTop: 8 }}>{job.fitWriteup}</p>}
        </section>
      )}

      <section className="jd-section">
        <h3 className="t-sub">About the role</h3>
        <div className="prose" style={{ marginTop: 8 }}>{job.description}</div>
      </section>

      {requirements.length > 0 && (
        <section className="jd-section">
          <h3 className="t-sub">Requirements</h3>
          <ul className="bullets">{requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </section>
      )}
      {requirements.length === 0 && job.detailedRequirements && job.detailedRequirements !== job.description && (
        <section className="jd-section">
          <h3 className="t-sub">Requirements</h3>
          <ul className="bullets">{splitLines(job.detailedRequirements).slice(0, 14).map((r, i) => <li key={i}>{r}</li>)}</ul>
        </section>
      )}

      {job.skills.length > 0 && (
        <section className="jd-section">
          <h3 className="t-sub">Skills</h3>
          <div className="chips" style={{ marginTop: 10 }}>{job.skills.map(s => <span key={s} className="chip static">{s}</span>)}</div>
        </section>
      )}

      {job.benefits.length > 0 && (
        <section className="jd-section">
          <h3 className="t-sub">Benefits</h3>
          <ul className="bullets">{job.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul>
        </section>
      )}

      <section className="jd-section">
        <h3 className="t-sub">About {job.companyName}</h3>
        <p className="t-body soft" style={{ marginTop: 8 }}>{job.companyDescription}</p>
        <div className="facts" style={{ marginTop: 12 }}>
          {job.industry && <span><Building2 />{job.industry}</span>}
          {job.companySize && <span><Users />{job.companySize}</span>}
          {job.companyWebsite && (
            <a href={job.companyWebsite.startsWith('http') ? job.companyWebsite : `https://${job.companyWebsite}`} target="_blank" rel="noreferrer"><ExternalLink />Website</a>
          )}
        </div>
      </section>

      {job.applicantsCount > 0 && <p className="t-caption muted" style={{ marginTop: 18 }}>{job.applicantsCount} people applied through Iris</p>}
    </div>
  );
}
