import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Clock, Users, Building2, ExternalLink, GraduationCap, Banknote, Globe2 } from 'lucide-react';
import type { Job } from '@/types';
import { CompanyLogo, formatSalary } from '@web/ui/bits';

const MODE: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };

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
export function JobDetail({ job, compact }: { job: Job; compact?: boolean }) {
  const requirements = job.requirements.length ? job.requirements : [];
  return (
    <div className="job-detail">
      {!compact && (
        <header className="row gap-16" style={{ alignItems: 'flex-start' }}>
          <CompanyLogo name={job.companyName} url={job.companyLogo} website={job.companyWebsite} size="lg" />
          <div className="grow">
            <Link to={`/app/companies/${encodeURIComponent(job.companyName)}`} className="t-callout muted">{job.companyName}</Link>
            <h1 className="t-title" style={{ marginTop: 2 }}>{job.jobTitle}</h1>
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
