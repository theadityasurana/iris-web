import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, Check, Trash2 } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { getRolesGroupedByCategory } from '@/constants/roles';
import type { WorkExperience, Education, Certification, Achievement, Project } from '@/types';

const CITIES = ['San Francisco, CA','New York, NY','Seattle, WA','Austin, TX','Los Angeles, CA','Chicago, IL','Boston, MA','Denver, CO','Toronto, Canada','London, UK','Berlin, Germany','Bangalore, India','Mumbai, India','Singapore','Sydney, Australia'];
const JOB_TYPES = ['Full-time','Part-time','Internship','Contract','Freelance'];
const WORK_MODES = ['Remote','Onsite','Hybrid'];
const TITLES: Record<string,string> = { topskills:'Skills',desiredroles:'Desired Roles',preferredcities:'Preferred Cities',jobtypeprefs:'Job Type',workmodeprefs:'Work Mode',coverletter:'Cover Letter',bio:'Bio',headline:'Headline',contact:'Contact',experience:'Work Experience',education:'Education',certifications:'Certifications',achievements:'Achievements',projects:'Projects','basic-info':'Basic Info','work-preferences':'Work Preferences','work-authorization':'Work Authorization','additional-info':'Additional Info','resume-optimization':'Resume Optimization','equal-opportunity':'Equal Opportunity',salary:'Salary' };

function newId() { return Math.random().toString(36).slice(2); }

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
      <div className="page-head"><h1 className="t-title">{title}</h1></div>
      {children}
    </div>
  );
}

function SaveBtn({ saving, onClick, label='Save' }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <button className="btn block" disabled={saving} onClick={onClick} style={{ marginTop: 24 }}>
      {saving ? <span className="spinner" /> : <Check size={16} />}{label}
    </button>
  );
}

export default function EditSection() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { profile, saveProfile } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  // simple fields
  const [skills, setSkills] = useState<string[]>([]);
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [desiredRoles, setDesiredRoles] = useState<string[]>([]);
  const [roleQuery, setRoleQuery] = useState('');
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [jobPreferences, setJobPreferences] = useState<string[]>([]);
  const [workModePreferences, setWorkModePreferences] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [headlineVal, setHeadlineVal] = useState('');

  // list sections
  const [experience, setExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!profile) return;
    setSkills(profile.skills ?? []);
    setTopSkills(profile.topSkills ?? []);
    setDesiredRoles(profile.desiredRoles ?? []);
    setPreferredCities(profile.preferredCities ?? []);
    setJobPreferences(profile.jobPreferences ?? []);
    setWorkModePreferences(profile.workModePreferences ?? []);
    setExperience(profile.experience ?? []);
    setEducation(profile.education ?? []);
    setCertifications(profile.certifications ?? []);
    setAchievements(profile.achievements ?? []);
    setProjects(profile.projects ?? []);
    if (section === 'coverletter') setText(profile.coverLetter ?? '');
    if (section === 'bio') setText(profile.bio ?? '');
    if (section === 'headline') setText(profile.headline ?? '');
    if (section === 'contact') { setPhone(profile.phone ?? ''); setLinkedinUrl(profile.linkedinUrl ?? ''); setGithubUrl(profile.githubUrl ?? ''); }
    if (section === 'basic-info') {
      const parts = (profile.name ?? '').split(' ');
      setFirstName(parts[0] ?? ''); setLastName(parts.slice(1).join(' '));
      setLocation(profile.location ?? ''); setHeadlineVal(profile.headline ?? '');
    }
  }, [profile, section]);

  async function save(partial: Parameters<typeof saveProfile>[0]) {
    setSaving(true);
    const ok = await saveProfile(partial);
    setSaving(false);
    if (ok) { toast('Saved'); setTimeout(() => navigate('/app/profile'), 600); }
    else toast('Could not save', 'error');
  }

  const title = TITLES[section ?? ''] ?? 'Edit';

  // ── Basic info ───────────────────────────────────────────────────────────────
  if (section === 'basic-info') return (
    <Page title={title}>
      <div className="stack gap-16">
        <div className="form-grid">
          <div className="field"><label>First name</label><input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
          <div className="field"><label>Last name</label><input className="input" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
        </div>
        <div className="field"><label>Headline</label><input className="input" maxLength={100} value={headlineVal} onChange={e => setHeadlineVal(e.target.value)} placeholder="e.g. Senior Software Engineer" /></div>
        <div className="field"><label>Location</label><input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA" /></div>
      </div>
      <SaveBtn saving={saving} onClick={() => save({ name: `${firstName} ${lastName}`.trim(), location, headline: headlineVal })} />
    </Page>
  );

  // ── Skills ───────────────────────────────────────────────────────────────────
  if (section === 'topskills') return (
    <Page title={title}>
      <p className="t-callout muted" style={{ marginBottom: 16 }}>Pin up to 5 as top skills.</p>
      <div className="field" style={{ marginBottom: 16 }}>
        <input className="input" placeholder="Add a skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const t = skillInput.trim(); if (t && !skills.includes(t)) { setSkills(p => [...p, t]); setSkillInput(''); } } }} />
        {skillInput.trim() && <button className="btn sm" style={{ marginTop: 8 }} onClick={() => { const t = skillInput.trim(); if (t && !skills.includes(t)) { setSkills(p => [...p, t]); setSkillInput(''); } }}><Plus size={14} />Add "{skillInput.trim()}"</button>}
      </div>
      <div className="chips" style={{ marginBottom: 8 }}>
        {skills.map(s => (
          <button key={s} className={`chip ${topSkills.includes(s) ? 'on' : ''}`}
            onClick={() => setTopSkills(p => p.includes(s) ? p.filter(x => x !== s) : p.length < 5 ? [...p, s] : p)}>
            {topSkills.includes(s) && <Check size={12} />}{s}
            <span className="x" onClick={e => { e.stopPropagation(); setSkills(p => p.filter(x => x !== s)); setTopSkills(p => p.filter(x => x !== s)); }}><X size={12} /></span>
          </button>
        ))}
      </div>
      <p className="t-caption muted">{topSkills.length}/5 pinned</p>
      <SaveBtn saving={saving} onClick={() => save({ skills, topSkills })} label="Save Skills" />
    </Page>
  );

  // ── Desired roles ────────────────────────────────────────────────────────────
  if (section === 'desiredroles') {
    const grouped = getRolesGroupedByCategory();
    const allRoles = Object.values(grouped).flat();
    const filtered = roleQuery ? allRoles.filter(r => r.toLowerCase().includes(roleQuery.toLowerCase())) : [];
    const toggle = (r: string) => setDesiredRoles(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]);
    return (
      <Page title={title}>
        <input className="input" placeholder="Search roles…" value={roleQuery} onChange={e => setRoleQuery(e.target.value)} style={{ marginBottom: 16 }} />
        {desiredRoles.length > 0 && <div className="chips" style={{ marginBottom: 16 }}>{desiredRoles.map(r => <button key={r} className="chip on" onClick={() => toggle(r)}>{r}<span className="x"><X size={12} /></span></button>)}</div>}
        {roleQuery ? (
          <div className="chips">
            {filtered.slice(0, 30).map(r => <button key={r} className={`chip ${desiredRoles.includes(r) ? 'on' : ''}`} onClick={() => toggle(r)}>{r}</button>)}
            {!filtered.some(r => r.toLowerCase() === roleQuery.toLowerCase()) && <button className="chip" onClick={() => { toggle(roleQuery.trim()); setRoleQuery(''); }}><Plus size={13} />Add "{roleQuery.trim()}"</button>}
          </div>
        ) : Object.entries(grouped).map(([cat, roles]) => (
          <div key={cat} className="section">
            <div className="t-overline muted" style={{ marginBottom: 8 }}>{cat}</div>
            <div className="chips">{roles.map(r => <button key={r} className={`chip ${desiredRoles.includes(r) ? 'on' : ''}`} onClick={() => toggle(r)}>{r}</button>)}</div>
          </div>
        ))}
        <SaveBtn saving={saving} onClick={() => save({ desiredRoles })} label="Save Roles" />
      </Page>
    );
  }

  // ── Cities ───────────────────────────────────────────────────────────────────
  if (section === 'preferredcities') {
    const toggle = (c: string) => setPreferredCities(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
    const addCustom = () => { const t = cityInput.trim(); if (t) { setPreferredCities(p => p.includes(t) ? p : [...p, t]); setCityInput(''); } };
    return (
      <Page title={title}>
        <div className="row gap-8" style={{ marginBottom: 16 }}>
          <input className="input" placeholder="Add a city…" value={cityInput} onChange={e => setCityInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} style={{ flex: 1 }} />
          <button className="btn" onClick={addCustom}><Plus size={16} /></button>
        </div>
        <div className="chips">
          {CITIES.map(c => <button key={c} className={`chip ${preferredCities.includes(c) ? 'on' : ''}`} onClick={() => toggle(c)}>{c}</button>)}
          {preferredCities.filter(c => !CITIES.includes(c)).map(c => <button key={c} className="chip on" onClick={() => toggle(c)}>{c}<span className="x"><X size={12} /></span></button>)}
        </div>
        <SaveBtn saving={saving} onClick={() => save({ preferredCities })} label="Save Cities" />
      </Page>
    );
  }

  // ── Job type / work mode ─────────────────────────────────────────────────────
  if (section === 'jobtypeprefs') return (
    <Page title={title}>
      <div className="chips">{JOB_TYPES.map(p => <button key={p} className={`chip ${jobPreferences.includes(p) ? 'on' : ''}`} onClick={() => setJobPreferences(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}>{p}</button>)}</div>
      <SaveBtn saving={saving} onClick={() => save({ jobPreferences })} />
    </Page>
  );

  if (section === 'workmodeprefs') return (
    <Page title={title}>
      <div className="chips">{WORK_MODES.map(m => <button key={m} className={`chip ${workModePreferences.includes(m) ? 'on' : ''}`} onClick={() => setWorkModePreferences(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}>{m}</button>)}</div>
      <SaveBtn saving={saving} onClick={() => save({ workModePreferences })} />
    </Page>
  );

  // ── Text fields ──────────────────────────────────────────────────────────────
  if (section === 'coverletter' || section === 'bio') return (
    <Page title={title}>
      <div className="field">
        <textarea className="textarea" rows={10} maxLength={2000} value={text} onChange={e => setText(e.target.value)} placeholder={section === 'coverletter' ? 'Write a personalised cover letter…' : 'Write a short bio…'} />
        <span className="hint" style={{ textAlign: 'right' }}>{text.length}/2000</span>
      </div>
      <SaveBtn saving={saving} onClick={() => save({ [section === 'coverletter' ? 'coverLetter' : 'bio']: text })} />
    </Page>
  );

  if (section === 'headline') return (
    <Page title={title}>
      <div className="field">
        <input className="input" maxLength={100} value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Senior Software Engineer" />
        <span className="hint" style={{ textAlign: 'right' }}>{text.length}/100</span>
      </div>
      <SaveBtn saving={saving} onClick={() => save({ headline: text })} />
    </Page>
  );

  // ── Contact ──────────────────────────────────────────────────────────────────
  if (section === 'contact') return (
    <Page title={title}>
      <div className="stack gap-16">
        <div className="field"><label>Phone</label><input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" /></div>
        <div className="field"><label>LinkedIn URL</label><input className="input" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/…" /></div>
        <div className="field"><label>GitHub URL</label><input className="input" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/…" /></div>
      </div>
      <SaveBtn saving={saving} onClick={() => save({ phone, linkedinUrl, githubUrl })} />
    </Page>
  );

  // ── Experience ───────────────────────────────────────────────────────────────
  if (section === 'experience') {
    const update = (id: string, patch: Partial<WorkExperience>) => setExperience(p => p.map(e => e.id === id ? { ...e, ...patch } : e));
    const add = () => setExperience(p => [...p, { id: newId(), company: '', title: '', startDate: '', endDate: null, isCurrent: false, description: '' }]);
    const remove = (id: string) => setExperience(p => p.filter(e => e.id !== id));
    return (
      <Page title={title}>
        <div className="stack gap-16">
          {experience.map((e, i) => (
            <div key={e.id} className="card pad stack gap-12">
              <div className="row between"><span className="t-callout" style={{ fontWeight: 600 }}>Entry {i + 1}</span><button className="icon-btn" onClick={() => remove(e.id)} aria-label="Remove"><Trash2 size={15} /></button></div>
              <div className="form-grid">
                <div className="field"><label>Job title</label><input className="input" value={e.title} onChange={ev => update(e.id, { title: ev.target.value })} placeholder="Software Engineer" /></div>
                <div className="field"><label>Company</label><input className="input" value={e.company} onChange={ev => update(e.id, { company: ev.target.value })} placeholder="Acme Inc." /></div>
                <div className="field"><label>Start date</label><input className="input" value={e.startDate} onChange={ev => update(e.id, { startDate: ev.target.value })} placeholder="Jan 2022" /></div>
                <div className="field"><label>End date</label><input className="input" value={e.endDate ?? ''} onChange={ev => update(e.id, { endDate: ev.target.value || null })} placeholder="Dec 2023 or leave blank" disabled={e.isCurrent} /></div>
              </div>
              <label className="check"><input type="checkbox" checked={e.isCurrent} onChange={ev => update(e.id, { isCurrent: ev.target.checked, endDate: ev.target.checked ? null : e.endDate })} />Currently working here</label>
              <div className="field"><label>Description</label><textarea className="textarea" rows={3} value={e.description} onChange={ev => update(e.id, { description: ev.target.value })} placeholder="What you did and achieved…" /></div>
            </div>
          ))}
          <button className="btn outline block" onClick={add}><Plus size={15} />Add experience</button>
        </div>
        <SaveBtn saving={saving} onClick={() => save({ experience })} label="Save Experience" />
      </Page>
    );
  }

  // ── Education ────────────────────────────────────────────────────────────────
  if (section === 'education') {
    const update = (id: string, patch: Partial<Education>) => setEducation(p => p.map(e => e.id === id ? { ...e, ...patch } : e));
    const add = () => setEducation(p => [...p, { id: newId(), institution: '', degree: '', field: '', startDate: '', endDate: '' }]);
    const remove = (id: string) => setEducation(p => p.filter(e => e.id !== id));
    return (
      <Page title={title}>
        <div className="stack gap-16">
          {education.map((e, i) => (
            <div key={e.id} className="card pad stack gap-12">
              <div className="row between"><span className="t-callout" style={{ fontWeight: 600 }}>Entry {i + 1}</span><button className="icon-btn" onClick={() => remove(e.id)} aria-label="Remove"><Trash2 size={15} /></button></div>
              <div className="field"><label>Institution</label><input className="input" value={e.institution} onChange={ev => update(e.id, { institution: ev.target.value })} placeholder="MIT" /></div>
              <div className="form-grid">
                <div className="field"><label>Degree</label><input className="input" value={e.degree} onChange={ev => update(e.id, { degree: ev.target.value })} placeholder="B.S." /></div>
                <div className="field"><label>Field of study</label><input className="input" value={e.field} onChange={ev => update(e.id, { field: ev.target.value })} placeholder="Computer Science" /></div>
                <div className="field"><label>Start date</label><input className="input" value={e.startDate} onChange={ev => update(e.id, { startDate: ev.target.value })} placeholder="Sep 2018" /></div>
                <div className="field"><label>End date</label><input className="input" value={e.endDate} onChange={ev => update(e.id, { endDate: ev.target.value })} placeholder="May 2022" /></div>
              </div>
              <div className="field"><label>Description (optional)</label><textarea className="textarea" rows={2} value={e.description ?? ''} onChange={ev => update(e.id, { description: ev.target.value })} /></div>
            </div>
          ))}
          <button className="btn outline block" onClick={add}><Plus size={15} />Add education</button>
        </div>
        <SaveBtn saving={saving} onClick={() => save({ education })} label="Save Education" />
      </Page>
    );
  }

  // ── Achievements ─────────────────────────────────────────────────────────────
  if (section === 'achievements') {
    const update = (id: string, patch: Partial<Achievement>) => setAchievements(p => p.map(a => a.id === id ? { ...a, ...patch } : a));
    const add = () => setAchievements(p => [...p, { id: newId(), title: '', issuer: '', date: '' }]);
    const remove = (id: string) => setAchievements(p => p.filter(a => a.id !== id));
    return (
      <Page title={title}>
        <div className="stack gap-16">
          {achievements.map((a, i) => (
            <div key={a.id} className="card pad stack gap-12">
              <div className="row between"><span className="t-callout" style={{ fontWeight: 600 }}>Entry {i + 1}</span><button className="icon-btn" onClick={() => remove(a.id)} aria-label="Remove"><Trash2 size={15} /></button></div>
              <div className="field"><label>Title</label><input className="input" value={a.title} onChange={ev => update(a.id, { title: ev.target.value })} placeholder="Best Paper Award" /></div>
              <div className="form-grid">
                <div className="field"><label>Issuer</label><input className="input" value={a.issuer} onChange={ev => update(a.id, { issuer: ev.target.value })} placeholder="NeurIPS" /></div>
                <div className="field"><label>Date</label><input className="input" value={a.date} onChange={ev => update(a.id, { date: ev.target.value })} placeholder="Dec 2023" /></div>
              </div>
              <div className="field"><label>Description (optional)</label><textarea className="textarea" rows={2} value={a.description ?? ''} onChange={ev => update(a.id, { description: ev.target.value })} /></div>
            </div>
          ))}
          <button className="btn outline block" onClick={add}><Plus size={15} />Add achievement</button>
        </div>
        <SaveBtn saving={saving} onClick={() => save({ achievements })} label="Save Achievements" />
      </Page>
    );
  }

  // ── Certifications ───────────────────────────────────────────────────────────
  if (section === 'certifications') {
    const update = (id: string, patch: Partial<Certification>) => setCertifications(p => p.map(c => c.id === id ? { ...c, ...patch } : c));
    const add = () => setCertifications(p => [...p, { id: newId(), name: '', issuingOrganization: '', credentialUrl: '', skills: [] }]);
    const remove = (id: string) => setCertifications(p => p.filter(c => c.id !== id));
    return (
      <Page title={title}>
        <div className="stack gap-16">
          {certifications.map((c, i) => (
            <div key={c.id} className="card pad stack gap-12">
              <div className="row between"><span className="t-callout" style={{ fontWeight: 600 }}>Entry {i + 1}</span><button className="icon-btn" onClick={() => remove(c.id)} aria-label="Remove"><Trash2 size={15} /></button></div>
              <div className="field"><label>Certificate name</label><input className="input" value={c.name} onChange={ev => update(c.id, { name: ev.target.value })} placeholder="AWS Solutions Architect" /></div>
              <div className="field"><label>Issuing organization</label><input className="input" value={c.issuingOrganization} onChange={ev => update(c.id, { issuingOrganization: ev.target.value })} placeholder="Amazon Web Services" /></div>
              <div className="field"><label>Credential URL (optional)</label><input className="input" value={c.credentialUrl} onChange={ev => update(c.id, { credentialUrl: ev.target.value })} placeholder="https://…" /></div>
            </div>
          ))}
          <button className="btn outline block" onClick={add}><Plus size={15} />Add certification</button>
        </div>
        <SaveBtn saving={saving} onClick={() => save({ certifications })} label="Save Certifications" />
      </Page>
    );
  }

  // ── Projects ─────────────────────────────────────────────────────────────────
  if (section === 'projects') {
    const update = (id: string, patch: Partial<Project>) => setProjects(p => p.map(x => x.id === id ? { ...x, ...patch } : x));
    const add = () => setProjects(p => [...p, { id: newId(), title: '', organization: '', date: '', exposure: [], bullets: [] }]);
    const remove = (id: string) => setProjects(p => p.filter(x => x.id !== id));
    return (
      <Page title={title}>
        <div className="stack gap-16">
          {projects.map((p, i) => (
            <div key={p.id} className="card pad stack gap-12">
              <div className="row between"><span className="t-callout" style={{ fontWeight: 600 }}>Entry {i + 1}</span><button className="icon-btn" onClick={() => remove(p.id)} aria-label="Remove"><Trash2 size={15} /></button></div>
              <div className="field"><label>Title</label><input className="input" value={p.title} onChange={ev => update(p.id, { title: ev.target.value })} placeholder="Open-source ML library" /></div>
              <div className="form-grid">
                <div className="field"><label>Organization (optional)</label><input className="input" value={p.organization} onChange={ev => update(p.id, { organization: ev.target.value })} /></div>
                <div className="field"><label>Date (optional)</label><input className="input" value={p.date} onChange={ev => update(p.id, { date: ev.target.value })} placeholder="2023" /></div>
              </div>
              <div className="field"><label>Link (optional)</label><input className="input" value={p.link ?? ''} onChange={ev => update(p.id, { link: ev.target.value })} placeholder="https://github.com/…" /></div>
              <div className="field"><label>Description (one bullet per line)</label><textarea className="textarea" rows={4} value={p.bullets.join('\n')} onChange={ev => update(p.id, { bullets: ev.target.value.split('\n') })} /></div>
            </div>
          ))}
          <button className="btn outline block" onClick={add}><Plus size={15} />Add project</button>
        </div>
        <SaveBtn saving={saving} onClick={() => save({ projects })} label="Save Projects" />
      </Page>
    );
  }

  // ── Fallback ─────────────────────────────────────────────────────────────────
  return (
    <Page title={title}>
      <p className="t-callout muted">This section is not yet editable on web. Use the Iris mobile app.</p>
    </Page>
  );
}
