import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, Check } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { getRolesGroupedByCategory } from '@/constants/roles';
import type { WorkExperience, Education, Certification, Achievement } from '@/types';

const MAJOR_CITIES = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX',
  'Los Angeles, CA', 'Chicago, IL', 'Boston, MA', 'Denver, CO',
  'Toronto, Canada', 'Vancouver, Canada', 'London, UK', 'Berlin, Germany',
  'Bangalore, India', 'Mumbai, India', 'Singapore', 'Sydney, Australia',
];

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
const WORK_MODES = ['Remote', 'Onsite', 'Hybrid'];

const SECTION_TITLES: Record<string, string> = {
  topskills: 'Skills',
  desiredroles: 'Desired Roles',
  preferredcities: 'Preferred Cities',
  jobtypeprefs: 'Job Type',
  workmodeprefs: 'Work Mode',
  coverletter: 'Cover Letter',
  bio: 'Bio',
  headline: 'Headline',
  contact: 'Contact',
  experience: 'Work Experience',
  education: 'Education',
  certifications: 'Certifications',
  achievements: 'Achievements',
};

export default function EditSection() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { profile, saveProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Roles
  const [desiredRoles, setDesiredRoles] = useState<string[]>([]);
  const [roleQuery, setRoleQuery] = useState('');

  // Cities
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');

  // Job type / work mode
  const [jobPreferences, setJobPreferences] = useState<string[]>([]);
  const [workModePreferences, setWorkModePreferences] = useState<string[]>([]);

  // Cover letter / bio / headline
  const [text, setText] = useState('');

  // Contact
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  useEffect(() => {
    if (!profile) return;
    setSkills(profile.skills ?? []);
    setTopSkills(profile.topSkills ?? []);
    setDesiredRoles(profile.desiredRoles ?? []);
    setPreferredCities(profile.preferredCities ?? []);
    setJobPreferences(profile.jobPreferences ?? []);
    setWorkModePreferences(profile.workModePreferences ?? []);
    if (section === 'coverletter') setText(profile.coverLetter ?? '');
    if (section === 'bio') setText(profile.bio ?? '');
    if (section === 'headline') setText(profile.headline ?? '');
    if (section === 'contact') {
      setPhone(profile.phone ?? '');
      setLinkedinUrl(profile.linkedinUrl ?? '');
      setGithubUrl(profile.githubUrl ?? '');
    }
  }, [profile, section]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  async function save(partial: Parameters<typeof saveProfile>[0]) {
    setSaving(true);
    const ok = await saveProfile(partial);
    setSaving(false);
    if (ok) { showToast('Saved'); setTimeout(() => navigate('/app/profile'), 800); }
    else showToast('Failed to save');
  }

  const title = SECTION_TITLES[section ?? ''] ?? 'Edit';

  // ── Skills ──────────────────────────────────────────────────────────────────
  if (section === 'topskills') {
    const addSkill = (s: string) => {
      const t = s.trim();
      if (!t || skills.includes(t)) return;
      setSkills(prev => [...prev, t]);
      setSkillInput('');
    };
    const removeSkill = (s: string) => {
      setSkills(prev => prev.filter(x => x !== s));
      setTopSkills(prev => prev.filter(x => x !== s));
    };
    const toggleTop = (s: string) => {
      if (topSkills.includes(s)) setTopSkills(prev => prev.filter(x => x !== s));
      else if (topSkills.length < 5) setTopSkills(prev => [...prev, s]);
    };
    return (
      <div className="page narrow">
        <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
        <div className="page-head"><h1 className="t-title">{title}</h1></div>
        <p className="t-callout" style={{ color: 'var(--ink-3)', marginBottom: 20 }}>Pin up to 5 as top skills — they appear first on your profile.</p>
        <div className="field" style={{ marginBottom: 16 }}>
          <div className="input-wrap">
            <input className="input" placeholder="Add a skill…" value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }} />
          </div>
          {skillInput.trim() && <button className="btn sm" style={{ marginTop: 8 }} onClick={() => addSkill(skillInput)}><Plus size={14} />Add "{skillInput.trim()}"</button>}
        </div>
        <div className="chips" style={{ marginBottom: 24 }}>
          {skills.map(s => (
            <button key={s} className={`chip ${topSkills.includes(s) ? 'on' : ''}`} onClick={() => toggleTop(s)}>
              {topSkills.includes(s) && <Check size={13} />}{s}
              <span className="x" onClick={e => { e.stopPropagation(); removeSkill(s); }}><X size={12} /></span>
            </button>
          ))}
        </div>
        <button className="btn block" disabled={saving} onClick={() => save({ skills, topSkills })}>
          {saving ? <span className="spinner" /> : <Check size={16} />}Save Skills
        </button>
        {toast && <div className="toasts"><div className="toast">{toast}</div></div>}
      </div>
    );
  }

  // ── Desired Roles ────────────────────────────────────────────────────────────
  if (section === 'desiredroles') {
    const grouped = getRolesGroupedByCategory();
    const allRoles = Object.values(grouped).flat();
    const filtered = roleQuery ? allRoles.filter(r => r.toLowerCase().includes(roleQuery.toLowerCase())) : [];
    const toggle = (r: string) => setDesiredRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    return (
      <div className="page narrow">
        <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
        <div className="page-head"><h1 className="t-title">{title}</h1></div>
        <div className="field" style={{ marginBottom: 16 }}>
          <input className="input" placeholder="Search roles…" value={roleQuery} onChange={e => setRoleQuery(e.target.value)} />
        </div>
        {desiredRoles.length > 0 && (
          <div className="chips" style={{ marginBottom: 16 }}>
            {desiredRoles.map(r => (
              <button key={r} className="chip on" onClick={() => toggle(r)}>{r}<span className="x"><X size={12} /></span></button>
            ))}
          </div>
        )}
        {roleQuery ? (
          <div className="chips" style={{ marginBottom: 24 }}>
            {filtered.slice(0, 30).map(r => (
              <button key={r} className={`chip ${desiredRoles.includes(r) ? 'on' : ''}`} onClick={() => toggle(r)}>{r}</button>
            ))}
            {!filtered.some(r => r.toLowerCase() === roleQuery.toLowerCase()) && (
              <button className="chip" onClick={() => { toggle(roleQuery.trim()); setRoleQuery(''); }}><Plus size={13} />Add "{roleQuery.trim()}"</button>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([cat, roles]) => (
            <div key={cat} className="section">
              <div className="section-head"><span className="t-label" style={{ color: 'var(--ink-3)' }}>{cat}</span></div>
              <div className="chips">
                {roles.map(r => (
                  <button key={r} className={`chip ${desiredRoles.includes(r) ? 'on' : ''}`} onClick={() => toggle(r)}>{r}</button>
                ))}
              </div>
            </div>
          ))
        )}
        <div style={{ marginTop: 28 }}>
          <button className="btn block" disabled={saving} onClick={() => save({ desiredRoles })}>
            {saving ? <span className="spinner" /> : <Check size={16} />}Save Roles
          </button>
        </div>
        {toast && <div className="toasts"><div className="toast">{toast}</div></div>}
      </div>
    );
  }

  // ── Preferred Cities ─────────────────────────────────────────────────────────
  if (section === 'preferredcities') {
    const toggle = (c: string) => setPreferredCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    const addCustom = () => {
      const t = cityInput.trim();
      if (t && !preferredCities.includes(t)) { setPreferredCities(prev => [...prev, t]); setCityInput(''); }
    };
    return (
      <div className="page narrow">
        <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
        <div className="page-head"><h1 className="t-title">{title}</h1></div>
        <div className="field" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Add a city…" value={cityInput} onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} style={{ flex: 1 }} />
            <button className="btn" onClick={addCustom}><Plus size={16} /></button>
          </div>
        </div>
        <div className="chips" style={{ marginBottom: 24 }}>
          {MAJOR_CITIES.map(c => (
            <button key={c} className={`chip ${preferredCities.includes(c) ? 'on' : ''}`} onClick={() => toggle(c)}>{c}</button>
          ))}
          {preferredCities.filter(c => !MAJOR_CITIES.includes(c)).map(c => (
            <button key={c} className="chip on" onClick={() => toggle(c)}>{c}<span className="x"><X size={12} /></span></button>
          ))}
        </div>
        <button className="btn block" disabled={saving} onClick={() => save({ preferredCities })}>
          {saving ? <span className="spinner" /> : <Check size={16} />}Save Cities
        </button>
        {toast && <div className="toasts"><div className="toast">{toast}</div></div>}
      </div>
    );
  }

  // ── Job Type ─────────────────────────────────────────────────────────────────
  if (section === 'jobtypeprefs') {
    const toggle = (p: string) => setJobPreferences(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    return (
      <div className="page narrow">
        <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
        <div className="page-head"><h1 className="t-title">{title}</h1></div>
        <div className="chips" style={{ marginBottom: 24 }}>
          {JOB_TYPES.map(p => (
            <button key={p} className={`chip ${jobPreferences.includes(p) ? 'on' : ''}`} onClick={() => toggle(p)}>{p}</button>
          ))}
        </div>
        <button className="btn block" disabled={saving} onClick={() => save({ jobPreferences })}>
          {saving ? <span className="spinner" /> : <Check size={16} />}Save
        </button>
        {toast && <div className="toasts"><div className="toast">{toast}</div></div>}
      </div>
    );
  }

  // ── Work Mode ────────────────────────────────────────────────────────────────
  if (section === 'workmodeprefs') {
    const toggle = (m: string) => setWorkModePreferences(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
    return (
      <div className="page narrow">
        <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
        <div className="page-head"><h1 className="t-title">{title}</h1></div>
        <div className="chips" style={{ marginBottom: 24 }}>
          {WORK_MODES.map(m => (
            <button key={m} className={`chip ${workModePreferences.includes(m) ? 'on' : ''}`} onClick={() => toggle(m)}>{m}</button>
          ))}
        </div>
        <button className="btn block" disabled={saving} onClick={() => save({ workModePreferences })}>
          {saving ? <span className="spinner" /> : <Check size={16} />}Save
        </button>
        {toast && <div className="toasts"><div className="toast">{toast}</div></div>}
      </div>
    );
  }

  // ── Cover Letter / Bio / Headline ────────────────────────────────────────────
  if (section === 'coverletter' || section === 'bio' || section === 'headline') {
    const isMultiline = section !== 'headline';
    const maxLen = section === 'headline' ? 100 : 2000;
    const fieldKey = section === 'coverletter' ? 'coverLetter' : section;
    return (
      <div className="page narrow">
        <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
        <div className="page-head"><h1 className="t-title">{title}</h1></div>
        <div className="field" style={{ marginBottom: 24 }}>
          {isMultiline ? (
            <textarea className="textarea" rows={10} maxLength={maxLen} value={text} onChange={e => setText(e.target.value)}
              placeholder={section === 'coverletter' ? 'Write a personalised cover letter…' : 'Write a short bio…'} />
          ) : (
            <input className="input" maxLength={maxLen} value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Senior Software Engineer" />
          )}
          <span className="hint" style={{ textAlign: 'right' }}>{text.length}/{maxLen}</span>
        </div>
        <button className="btn block" disabled={saving} onClick={() => save({ [fieldKey]: text })}>
          {saving ? <span className="spinner" /> : <Check size={16} />}Save
        </button>
        {toast && <div className="toasts"><div className="toast">{toast}</div></div>}
      </div>
    );
  }

  // ── Contact ──────────────────────────────────────────────────────────────────
  if (section === 'contact') {
    return (
      <div className="page narrow">
        <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
        <div className="page-head"><h1 className="t-title">{title}</h1></div>
        <div className="stack gap-16" style={{ marginBottom: 24 }}>
          <div className="field"><label>Phone</label><input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" /></div>
          <div className="field"><label>LinkedIn URL</label><input className="input" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/…" /></div>
          <div className="field"><label>GitHub URL</label><input className="input" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="github.com/…" /></div>
        </div>
        <button className="btn block" disabled={saving} onClick={() => save({ phone, linkedinUrl, githubUrl })}>
          {saving ? <span className="spinner" /> : <Check size={16} />}Save
        </button>
        {toast && <div className="toasts"><div className="toast">{toast}</div></div>}
      </div>
    );
  }

  // ── Fallback ─────────────────────────────────────────────────────────────────
  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
      <div className="page-head"><h1 className="t-title">{title || 'Edit'}</h1></div>
      <p className="t-callout" style={{ color: 'var(--ink-3)' }}>This section is not yet editable on web. Use the mobile app.</p>
    </div>
  );
}
