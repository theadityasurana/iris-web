import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Upload, Check, Plus, X } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { defaultOnboardingData, type OnboardingData } from '@/types/onboarding';
import { getRolesGroupedByCategory } from '@/constants/roles';

const STEPS = ['Name', 'Role & Level', 'Experience', 'Education', 'Skills', 'Preferences', 'Resume', 'Done'];
const WORK_MODES = ['Remote', 'Onsite', 'Hybrid'];
const EXP_LEVELS = [
  { id: 'internship', label: 'Internship' },
  { id: 'entry_level', label: 'Entry Level / Graduate' },
  { id: 'junior', label: 'Junior (1–2 yrs)' },
  { id: 'mid', label: 'Mid Level (3–5 yrs)' },
  { id: 'senior', label: 'Senior (6–9 yrs)' },
  { id: 'expert', label: 'Expert / Leadership (10+ yrs)' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { onboardingData, saveOnboardingProgress, completeOnboarding } = useAuth();
  const [step, setStep] = useState((onboardingData.onboardingStep ?? 1) - 1);
  const [data, setData] = useState<OnboardingData>({ ...defaultOnboardingData, ...onboardingData });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [roleQuery, setRoleQuery] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<OnboardingData>) => {
    const next = { ...data, ...partial };
    setData(next);
    saveOnboardingProgress({ ...partial, onboardingStep: step + 1 });
  };

  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1); };
  const back = () => { if (step > 0) setStep(s => s - 1); };

  async function finish() {
    setSubmitting(true);
    setError('');
    try {
      await completeOnboarding(data, { avatar: avatarFile, resume: resumeFile });
      navigate('/app/jobs', { replace: true });
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
      setSubmitting(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flex: 1, flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--line)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--brand)', transition: 'width 0.3s' }} />
      </div>

      <div style={{ maxWidth: 520, width: '100%', margin: '0 auto', padding: '32px 20px 64px', flex: 1 }}>
        <div style={{ marginBottom: 8, color: 'var(--ink-3)', fontSize: 13 }}>Step {step + 1} of {STEPS.length}</div>

        {/* ── Step 0: Name ── */}
        {step === 0 && (
          <div>
            <h1 className="t-title" style={{ marginBottom: 8 }}>Let's get started</h1>
            <p className="t-callout" style={{ color: 'var(--ink-3)', marginBottom: 28 }}>Tell us a bit about yourself.</p>
            <div className="form-grid" style={{ marginBottom: 20 }}>
              <div className="field">
                <label>First name</label>
                <input className="input" value={data.firstName} onChange={e => update({ firstName: e.target.value })} placeholder="Jane" autoFocus />
              </div>
              <div className="field">
                <label>Last name</label>
                <input className="input" value={data.lastName} onChange={e => update({ lastName: e.target.value })} placeholder="Smith" />
              </div>
              <div className="field span-2">
                <label>Headline</label>
                <input className="input" value={data.headline} onChange={e => update({ headline: e.target.value })} placeholder="e.g. Software Engineer" />
              </div>
              <div className="field span-2">
                <label>Location</label>
                <input className="input" value={data.location} onChange={e => update({ location: e.target.value })} placeholder="e.g. San Francisco, CA" />
              </div>
              <div className="field span-2">
                <label>Phone (optional)</label>
                <input className="input" value={data.phone} onChange={e => update({ phone: e.target.value })} placeholder="+1 (555) 123-4567" />
              </div>
            </div>
            {/* Avatar */}
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Profile photo (optional)</label>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) setAvatarFile(f); }} />
              <button className="btn secondary" onClick={() => avatarRef.current?.click()}>
                <Upload size={16} />{avatarFile ? avatarFile.name : 'Upload photo'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Role & Level ── */}
        {step === 1 && (
          <div>
            <h1 className="t-title" style={{ marginBottom: 8 }}>What roles are you targeting?</h1>
            <p className="t-callout" style={{ color: 'var(--ink-3)', marginBottom: 20 }}>Pick the job titles you want Iris to apply for.</p>
            <div className="field" style={{ marginBottom: 16 }}>
              <input className="input" placeholder="Search roles…" value={roleQuery} onChange={e => setRoleQuery(e.target.value)} />
            </div>
            {data.desiredRoles.length > 0 && (
              <div className="chips" style={{ marginBottom: 16 }}>
                {data.desiredRoles.map(r => (
                  <button key={r} className="chip on" onClick={() => update({ desiredRoles: data.desiredRoles.filter(x => x !== r) })}>
                    {r}<span className="x"><X size={12} /></span>
                  </button>
                ))}
              </div>
            )}
            <div className="chips" style={{ marginBottom: 24 }}>
              {(() => {
                const grouped = getRolesGroupedByCategory();
                const all = Object.values(grouped).flat();
                const filtered = roleQuery ? all.filter(r => r.toLowerCase().includes(roleQuery.toLowerCase())) : all.slice(0, 30);
                return filtered.map(r => (
                  <button key={r} className={`chip ${data.desiredRoles.includes(r) ? 'on' : ''}`}
                    onClick={() => update({ desiredRoles: data.desiredRoles.includes(r) ? data.desiredRoles.filter(x => x !== r) : [...data.desiredRoles, r] })}>
                    {r}
                  </button>
                ));
              })()}
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Experience level</label>
              <div className="stack gap-8">
                {EXP_LEVELS.map(l => (
                  <button key={l.id} className={`chip ${data.experienceLevel === l.id ? 'on' : ''}`} style={{ justifyContent: 'flex-start', borderRadius: 10, height: 40 }}
                    onClick={() => update({ experienceLevel: l.id })}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Experience ── */}
        {step === 2 && (
          <div>
            <h1 className="t-title" style={{ marginBottom: 8 }}>Work experience</h1>
            <p className="t-callout" style={{ color: 'var(--ink-3)', marginBottom: 20 }}>Add your most recent roles. You can add more later.</p>
            {data.workExperience.map((exp, i) => (
              <div key={exp.id} className="card pad" style={{ marginBottom: 12, position: 'relative' }}>
                <button style={{ position: 'absolute', top: 12, right: 12 }} className="icon-btn"
                  onClick={() => update({ workExperience: data.workExperience.filter((_, j) => j !== i) })}>
                  <X size={16} />
                </button>
                <div className="t-sub">{exp.title} at {exp.company}</div>
                <div className="t-callout" style={{ color: 'var(--ink-3)' }}>{exp.startYear || exp.startMonth} — {exp.isCurrent ? 'Present' : (exp.endYear || exp.endMonth)}</div>
              </div>
            ))}
            <button className="btn secondary block" onClick={() => {
              const id = `e${Date.now()}`;
              update({ workExperience: [...data.workExperience, { id, title: '', company: '', employmentType: 'Full-time', location: '', isRemote: false, startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false, description: '' }] });
            }}>
              <Plus size={16} />Add experience
            </button>
            {data.workExperience.length > 0 && data.workExperience[data.workExperience.length - 1].title === '' && (
              <div className="card pad" style={{ marginTop: 16 }}>
                <div className="form-grid">
                  {(['title', 'company'] as const).map(field => (
                    <div key={field} className="field">
                      <label>{field === 'title' ? 'Job title' : 'Company'}</label>
                      <input className="input" value={data.workExperience[data.workExperience.length - 1][field]}
                        onChange={e => {
                          const exps = [...data.workExperience];
                          exps[exps.length - 1] = { ...exps[exps.length - 1], [field]: e.target.value };
                          update({ workExperience: exps });
                        }} />
                    </div>
                  ))}
                  <div className="field">
                    <label>Start year</label>
                    <input className="input" placeholder="2021" value={data.workExperience[data.workExperience.length - 1].startYear}
                      onChange={e => { const exps = [...data.workExperience]; exps[exps.length - 1] = { ...exps[exps.length - 1], startYear: e.target.value }; update({ workExperience: exps }); }} />
                  </div>
                  <div className="field">
                    <label>End year</label>
                    <input className="input" placeholder="Present" value={data.workExperience[data.workExperience.length - 1].endYear}
                      onChange={e => { const exps = [...data.workExperience]; exps[exps.length - 1] = { ...exps[exps.length - 1], endYear: e.target.value, isCurrent: e.target.value === '' || e.target.value.toLowerCase() === 'present' }; update({ workExperience: exps }); }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Education ── */}
        {step === 3 && (
          <div>
            <h1 className="t-title" style={{ marginBottom: 8 }}>Education</h1>
            <p className="t-callout" style={{ color: 'var(--ink-3)', marginBottom: 20 }}>Add your highest degree.</p>
            {data.education.map((edu, i) => (
              <div key={edu.id} className="card pad" style={{ marginBottom: 12, position: 'relative' }}>
                <button style={{ position: 'absolute', top: 12, right: 12 }} className="icon-btn"
                  onClick={() => update({ education: data.education.filter((_, j) => j !== i) })}>
                  <X size={16} />
                </button>
                <div className="t-sub">{edu.degree} in {edu.field}</div>
                <div className="t-callout" style={{ color: 'var(--ink-3)' }}>{edu.institution}</div>
              </div>
            ))}
            <button className="btn secondary block" onClick={() => {
              const id = `ed${Date.now()}`;
              update({ education: [...data.education, { id, institution: '', degree: '', field: '', startYear: '', endYear: '' }] });
            }}>
              <Plus size={16} />Add education
            </button>
            {data.education.length > 0 && data.education[data.education.length - 1].institution === '' && (
              <div className="card pad" style={{ marginTop: 16 }}>
                <div className="form-grid">
                  {[['institution', 'University / School'], ['degree', 'Degree'], ['field', 'Field of study'], ['startYear', 'Start year'], ['endYear', 'End year']].map(([f, label]) => (
                    <div key={f} className="field">
                      <label>{label}</label>
                      <input className="input" value={(data.education[data.education.length - 1] as any)[f]}
                        onChange={e => { const edus = [...data.education]; (edus[edus.length - 1] as any)[f] = e.target.value; update({ education: edus }); }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Skills ── */}
        {step === 4 && (
          <div>
            <h1 className="t-title" style={{ marginBottom: 8 }}>Skills</h1>
            <p className="t-callout" style={{ color: 'var(--ink-3)', marginBottom: 20 }}>Add your top technical and soft skills.</p>
            <div className="field" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="e.g. React, Python…" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && skillInput.trim()) {
                      e.preventDefault();
                      const s = skillInput.trim();
                      if (!data.skills.find(x => x.name === s)) update({ skills: [...data.skills, { name: s, level: 'intermediate', yearsOfExperience: 1 }] });
                      setSkillInput('');
                    }
                  }} style={{ flex: 1 }} />
                <button className="btn" onClick={() => {
                  const s = skillInput.trim();
                  if (s && !data.skills.find(x => x.name === s)) { update({ skills: [...data.skills, { name: s, level: 'intermediate', yearsOfExperience: 1 }] }); setSkillInput(''); }
                }}><Plus size={16} /></button>
              </div>
            </div>
            <div className="chips">
              {data.skills.map(s => (
                <button key={s.name} className="chip on" onClick={() => update({ skills: data.skills.filter(x => x.name !== s.name) })}>
                  {s.name}<span className="x"><X size={12} /></span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 5: Preferences ── */}
        {step === 5 && (
          <div>
            <h1 className="t-title" style={{ marginBottom: 8 }}>Work preferences</h1>
            <p className="t-callout" style={{ color: 'var(--ink-3)', marginBottom: 20 }}>How do you prefer to work?</p>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Work mode</label>
              <div className="chips">
                {WORK_MODES.map(m => (
                  <button key={m} className={`chip ${data.workPreferences.includes(m) ? 'on' : ''}`}
                    onClick={() => update({ workPreferences: data.workPreferences.includes(m) ? data.workPreferences.filter(x => x !== m) : [...data.workPreferences, m] })}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>LinkedIn URL (optional)</label>
              <input className="input" value={data.linkedInUrl} onChange={e => update({ linkedInUrl: e.target.value })} placeholder="linkedin.com/in/…" />
            </div>
            <div className="field">
              <label>GitHub URL (optional)</label>
              <input className="input" value={data.githubUrl} onChange={e => update({ githubUrl: e.target.value })} placeholder="github.com/…" />
            </div>
          </div>
        )}

        {/* ── Step 6: Resume ── */}
        {step === 6 && (
          <div>
            <h1 className="t-title" style={{ marginBottom: 8 }}>Upload your resume</h1>
            <p className="t-callout" style={{ color: 'var(--ink-3)', marginBottom: 20 }}>Iris uses your resume to tailor applications. You can skip this and add it later.</p>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) setResumeFile(f); }} />
            <button className="btn secondary block" style={{ marginBottom: 12 }} onClick={() => fileRef.current?.click()}>
              <Upload size={16} />{resumeFile ? resumeFile.name : 'Choose file'}
            </button>
            <p className="t-callout" style={{ color: 'var(--ink-3)', textAlign: 'center' }}>PDF, DOC, or DOCX · max 10 MB</p>
          </div>
        )}

        {/* ── Step 7: Done ── */}
        {step === 7 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={28} style={{ color: 'var(--brand-ink)' }} />
            </div>
            <h1 className="t-title" style={{ marginBottom: 8 }}>You're all set!</h1>
            <p className="t-callout" style={{ color: 'var(--ink-3)', marginBottom: 32 }}>
              Iris will start finding and applying to jobs that match your profile.
            </p>
            {error && <div className="banner red" style={{ marginBottom: 16, textAlign: 'left' }}>{error}</div>}
            <button className="btn lg block" disabled={submitting} onClick={finish}>
              {submitting ? <span className="spinner" /> : <Check size={18} />}
              {submitting ? 'Setting up your account…' : 'Start using Iris'}
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 7 && (
          <div className="row between" style={{ marginTop: 32 }}>
            <button className="btn secondary" onClick={back} disabled={step === 0}><ChevronLeft size={16} />Back</button>
            <button className="btn" onClick={next}>
              {step === 6 && !resumeFile ? 'Skip' : 'Continue'}<ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
