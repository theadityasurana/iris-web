import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ExternalLink, FileText, Pencil } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { Avatar, formatDate } from '@web/ui/bits';

const SECTIONS = [
  { id: 'chasing', label: "What you're chasing" },
  { id: 'gave', label: 'What you gave us' },
  { id: 'answers', label: 'How we answer on your behalf' },
];
const OPT_LABEL: Record<string, string> = { off: 'Off', honest: 'Honest', aggressive: 'Aggressive' };

function Card({ title, sub, edit, children, id }: { title: string; sub?: string; edit?: string; children: ReactNode; id?: string }) {
  return (
    <section className="p-card" id={id}>
      <header className="p-card-head">
        <div className="grow"><h3 className="p-card-title">{title}</h3>{sub && <p className="t-callout muted">{sub}</p>}</div>
        {edit && <Link to={edit} className="icon-btn boxed-round" aria-label={`Edit ${title}`}><Pencil size={15} /></Link>}
      </header>
      {children}
    </section>
  );
}

function Fact({ label, value, chips }: { label: string; value?: ReactNode; chips?: string[] }) {
  return (
    <div className="p-fact">
      <span className="t-overline muted">{label}</span>
      {chips && chips.length > 0
        ? <div className="chips">{chips.map(c => <span key={c} className="chip static">{c}</span>)}</div>
        : value ? <span>{value}</span> : <em className="muted">Not set</em>}
    </div>
  );
}

export default function Profile() {
  const { profile, profileRow, email, uploadAvatar } = useAuth();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const obs = new IntersectionObserver(es => {
      const hit = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: '-90px 0px -65% 0px' });
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  if (!profile) return null;
  const onAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const ok = await uploadAvatar(f);
    setUploading(false);
    toast(ok ? 'Photo updated' : 'Upload failed', ok ? 'ok' : 'error');
  };
  const completion = profile.profileCompletion ?? 0;
  const joined = formatDate(profileRow?.created_at, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page wide">
      <section className="p-hero">
        <div className="p-avatar">
          <Avatar src={profile.avatar} name={profile.name} size="lg" />
          <button className="avatar-edit-btn" onClick={() => file.current?.click()} disabled={uploading} aria-label="Change photo">{uploading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Camera size={13} />}</button>
          <input ref={file} type="file" accept="image/*" hidden onChange={onAvatar} />
        </div>
        <div className="grow">
          <h1 className="p-name">{profile.name}</h1>
          <p className="t-callout soft ellipsis">{[email, profile.phone].filter(Boolean).join(' · ')}</p>
          <div className="row gap-16 wrap" style={{ marginTop: 6 }}>
            <span className="t-callout" style={{ color: 'var(--ok)' }}>{completion}% complete</span>
            <Link to="/app/profile/edit/basic-info" className="t-callout soft row gap-4"><Pencil size={13} />Edit</Link>
            <Link to="/app/profile/preview" className="t-callout soft">Preview</Link>
          </div>
        </div>
        {joined && <div className="t-callout muted p-since">Member since {joined}</div>}
      </section>

      <div className="p-lead">
        <p className="soft">Your profile is what Iris knows about you, and how it applies on your behalf.</p>
        <Link to="/app/profile/resumes" className="btn"><FileText />Import from resume</Link>
      </div>

      <div className="p-layout">
        <nav className="p-nav" aria-label="On this page">
          <div className="t-overline muted">On this page</div>
          {SECTIONS.map(s => <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'on' : ''}>{s.label}</a>)}
        </nav>

        <div className="p-main">
          <div id="chasing" className="p-group">
            <h2 className="p-group-title">What you're chasing</h2>
            <Card title="Your preferences" sub="These are what we match against." edit="/app/profile/edit/desiredroles">
              <div className="p-facts">
                <Fact label="Titles" chips={profile.desiredRoles} />
                <Fact label="Locations" chips={[profile.location, ...(profile.preferredCities ?? [])].filter((c): c is string => !!c)} />
                <Fact label="Work mode" chips={profile.workModePreferences} />
                <Fact label="Job type" chips={profile.jobPreferences} />
              </div>
            </Card>
          </div>

          <div id="gave" className="p-group">
            <h2 className="p-group-title">What you gave us</h2>
            <div className="p-columns">
              <div className="p-col">
                <Card title="Resume" sub="The one marked default is used to apply." edit="/app/profile/resumes">
                  {profile.resumeUrl
                    ? <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="row gap-8 t-callout"><FileText size={16} />View your resume<ExternalLink size={13} /></a>
                    : <p className="t-callout muted">No resume yet.</p>}
                </Card>
                <Card title="Professional summary" sub="The paragraph used when a form asks about you." edit="/app/profile/edit/bio">
                  {profile.bio ? <p className="prose">{profile.bio}</p> : <em className="t-callout muted">A short blurb about you</em>}
                </Card>
                <div className="p-subhead"><div><h3 className="p-card-title">Work experience</h3><p className="t-caption muted">Past roles, by recency</p></div><Link to="/app/profile/edit/experience" className="btn sm">Edit</Link></div>
                {(profile.experience ?? []).length === 0 && <p className="t-callout muted">No experience added yet.</p>}
                {profile.experience?.map((e, i) => (
                  <article key={e.id ?? i} className="p-card">
                    <h4 className="p-entry">{e.title} <span className="muted">· {e.company}</span></h4>
                    <p className="t-caption muted">{[e.employmentType, e.jobLocation].filter(Boolean).join(' · ')}{(e.startDate || e.endDate) && ` · ${e.startDate ?? ''} – ${e.isCurrent ? 'present' : e.endDate ?? ''}`}</p>
                    {e.description && <p className="prose t-callout" style={{ marginTop: 10 }}>{e.description}</p>}
                  </article>
                ))}
                <div className="p-subhead"><h3 className="p-card-title">Education</h3><Link to="/app/profile/edit/education" className="btn sm">Edit</Link></div>
                {(profile.education ?? []).length === 0 && <p className="t-callout muted">No education added yet.</p>}
                {profile.education?.map((e, i) => (
                  <article key={e.id ?? i} className="p-card">
                    <h4 className="p-entry">{e.degree}{e.field && <span className="muted">, {e.field}</span>}</h4>
                    <p className="t-callout soft">{e.institution}</p>
                    {(e.startDate || e.endDate) && <p className="t-caption muted">{e.startDate} – {e.endDate}</p>}
                  </article>
                ))}
                <div className="p-subhead"><h3 className="p-card-title">Projects</h3><Link to="/app/profile/edit/projects" className="btn sm">Edit</Link></div>
                {(profile.projects ?? []).length === 0 && <p className="t-callout muted">No projects added yet.</p>}
                {profile.projects?.map((p, i) => (
                  <article key={p.id ?? i} className="p-card">
                    <h4 className="p-entry">{p.title}</h4>
                    {p.organization && <p className="t-caption muted">{p.organization}{p.date ? ` · ${p.date}` : ''}</p>}
                    {p.bullets?.length > 0 && <ul className="bullets">{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
                  </article>
                ))}
                <Card title="Certifications" edit="/app/profile/edit/certifications">
                  {(profile.certifications ?? []).length ? profile.certifications!.map((c, i) => <p key={c.id ?? i} className="t-callout">{c.name}{c.issuingOrganization && <span className="muted"> · {c.issuingOrganization}</span>}</p>) : <p className="t-callout muted">None added yet.</p>}
                </Card>
                <Card title="Achievements" edit="/app/profile/edit/achievements">
                  {(profile.achievements ?? []).length ? profile.achievements!.map((a, i) => <p key={a.id ?? i} className="t-callout">{a.title}{a.issuer && <span className="muted"> · {a.issuer}</span>}</p>) : <p className="t-callout muted">None added yet.</p>}
                </Card>
              </div>
              <div className="p-col">
                <Card title="Skills" sub="Starred skills are the ones recruiters see first." edit="/app/profile/edit/topskills">
                  {(profile.skills ?? []).length
                    ? <div className="chips">{profile.skills!.map(s => <span key={s} className={`chip static ${profile.topSkills?.includes(s) ? 'top-skill' : ''}`}>{s}</span>)}</div>
                    : <p className="t-callout muted">No skills added yet.</p>}
                </Card>
                <Card title="Links" edit="/app/profile/edit/contact">
                  <div className="p-facts">
                    <Fact label="LinkedIn" value={profile.linkedinUrl} />
                    <Fact label="GitHub" value={profile.githubUrl} />
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <div id="answers" className="p-group">
            <h2 className="p-group-title">How we answer on your behalf</h2>
            <Card title="Application settings" sub="How Iris tailors and sends each application." edit="/app/settings?s=apply-settings">
              <div className="p-facts">
                <Fact label="Resume optimization" value={OPT_LABEL[profileRow?.resume_optimization_level ?? ''] ?? 'Honest'} />
                <Fact label="Work authorization" value={profileRow?.work_authorization_status} />
                <Fact label="Application email" value={profileRow?.proxy_email ?? profileRow?.email} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
