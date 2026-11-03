import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Upload, Check, Plus, X, User, Briefcase, GraduationCap, Zap, Settings, FileText } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { defaultOnboardingData, type OnboardingData } from '@/types/onboarding';
import { getRolesGroupedByCategory } from '@/constants/roles';

const STEPS = [
  { id: 'name', label: 'You', icon: User },
  { id: 'roles', label: 'Roles', icon: Briefcase },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Zap },
  { id: 'prefs', label: 'Preferences', icon: Settings },
  { id: 'resume', label: 'Resume', icon: FileText },
];

const WORK_MODES = ['Remote', 'Onsite', 'Hybrid'];
const EXP_LEVELS = [
  { id: 'internship', label: 'Internship' },
  { id: 'entry_level', label: 'Entry Level / Graduate' },
  { id: 'junior', label: 'Junior (1–2 yrs)' },
  { id: 'mid', label: 'Mid Level (3–5 yrs)' },
  { id: 'senior', label: 'Senior (6–9 yrs)' },
  { id: 'expert', label: 'Expert / Leadership (10+ yrs)' },
];

function ProfilePreview({ data, avatarFile }: { data: OnboardingData; avatarFile: File | null }) {
  const name = [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Your name';
  const avatarSrc = avatarFile ? URL.createObjectURL(avatarFile) : null;
  const initials = [data.firstName?.[0], data.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="ob-preview">
      <div className="ob-preview-label t-overline muted">Live preview</div>
      <div className="card pad ob-preview-card">
        {/* Header */}
        <div className="row gap-14" style={{ marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '2px solid var(--line)' }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--ink-3)' }}>{initials}</span>}
          </div>
          <div className="grow">
            <div className="t-sub" style={{ marginBottom: 2 }}>{name}</div>
            {data.headline && <div className="t-callout muted">{data.headline}</div>}
            {data.location && <div className="t-caption muted" style={{ marginTop: 2 }}>{data.location}</div>}
          </div>
        </div>

        {/* Desired roles */}
        {data.desiredRoles.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="t-overline muted" style={{ marginBottom: 6 }}>Targeting</div>
            <div className="chips">
              {data.desiredRoles.slice(0, 4).map(r => <span key={r} className="chip static">{r}</span>)}
              {data.desiredRoles.length > 4 && <span className="chip static">+{data.desiredRoles.length - 4}</span>}
            </div>
          </div>
        )}

        {/* Experience level */}
        {data.experienceLevel && (
          <div style={{ marginBottom: 14 }}>
            <div className="t-overline muted" style={{ marginBottom: 6 }}>Level</div>
            <span className="badge dark">{EXP_LEVELS.find(l => l.id === data.experienceLevel)?.label}</span>
          </div>
        )}

        {/* Experience */}
        {data.workExperience.filter(e => e.title || e.company).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="t-overline muted" style={{ marginBottom: 8 }}>Experience</div>
            <div className="stack gap-8">
              {data.workExperience.filter(e => e.title || e.company).slice(0, 3).map(e => (
                <div key={e.id} className="row gap-10">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Briefcase size={14} style={{ color: 'var(--ink-3)' }} />
                  </div>
                  <div>
                    <div className="t-callout" style={{ fontWeight: 600 }}>{e.title || 'Role'}</div>
                    <div className="t-caption muted">{e.company || 'Company'}{e.startYear ? ` · ${e.startYear}–${e.isCurrent ? 'Present' : (e.endYear || '…')}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.filter(e => e.institution || e.degree).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="t-overline muted" style={{ marginBottom: 8 }}>Education</div>
            <div className="stack gap-8">
              {data.education.filter(e => e.institution || e.degree).slice(0, 2).map(e => (
                <div key={e.id} className="row gap-10">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GraduationCap size={14} style={{ color: 'var(--ink-3)' }} />
                  </div>
                  <div>
                    <div className="t-callout" style={{ fontWeight: 600 }}>{e.degree || 'Degree'}{e.field ? ` in ${e.field}` : ''}</div>
                    <div className="t-caption muted">{e.institution || 'Institution'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="t-overline muted" style={{ marginBottom: 6 }}>Skills</div>
            <div className="chips">
              {data.skills.slice(0, 6).map(s => <span key={s.name} className="chip static">{s.name}</span>)}
              {data.skills.length > 6 && <span className="chip static">+{data.skills.length - 6}</span>}
            </div>
          </div>
        )}

        {/* Work prefs */}
        {data.workPreferences.length > 0 && (
          <div>
            <div className="t-overline muted" style={{ marginBottom: 6 }}>Work mode</div>
            <div className="chips">
              {data.workPreferences.map(p => <span key={p} className="chip static">{p}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { onboardingData, saveOnboardingProgress, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
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

  const goNext = () => setStep(s => Math.min(s + 1, STEPS.length));
  const goBack = () => setStep(s => Math.max(s - 1, 0));

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

  const isDone = step === STEPS.length;
  const progress = ((step + 1) / (STEPS.length + 1)) * 100;

  return (
    <div className="ob-shell">
      {/* Top bar */}
      <div className="ob-topbar">
        <a href="/" className="brand" style={{ padding: 0 }}><img src="/app/logo.png" alt="" />Iris</a>
        <div className="ob-steps">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`ob-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              {i < step ? <Check size={11} /> : <span>{i + 1}</span>}
            </div>
          ))}
        </div>
        <div className="t-caption muted">{isDone ? 'Done' : `${step + 1} / ${STEPS.length}`}</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--line)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--brand)', transition: 'width 0.35s' }} />
      </div>

      {isDone ? (
        <div className="ob-done">
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Check size={32} style={{ color: 'var(--brand-ink)' }} />
          </div>
          <h1 className="t-title" style={{ marginBottom: 10 }}>You're all set!</h1>
          <p className="t-callout muted" style={{ marginBottom: 32, maxWidth: 360 }}>
            Iris will start finding and applying to jobs that match your profile.
          </p>
          {error && <div className="banner red" style={{ marginBottom: 16 }}>{error}</div>}
          <button className="btn lg" style={{ minWidth: 220 }} disabled={submitting} onClick={finish}>
            {submitting ? <span className="spinner" /> : <Check size={18} />}
            {submitting ? 'Setting up…' : 'Start using Iris'}
          </button>
        </div>
      ) : (
        <div className="ob-body">
          {/* Left: form */}
          <div className="ob-form">
            <div className="ob-form-inner">

              {/* Step 0: Name */}
              {step === 0 && (
                <>
                  <h1 className="t-title" style={{ marginBottom: 6 }}>Let's get started</h1>
                  <p className="t-callout muted" style={{ marginBottom: 28 }}>Tell us a bit about yourself.</p>
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
                      <label>Phone <span className="muted">(optional)</span></label>
                      <input className="input" value={data.phone} onChange={e => update({ phone: e.target.value })} placeholder="+1 (555) 123-4567" />
                    </div>
                  </div>
                  <div className="field">
                    <label>Profile photo <span className="muted">(optional)</span></label>
                    <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) setAvatarFile(f); }} />
                    <button className="btn secondary" onClick={() => avatarRef.current?.click()}>
                      <Upload size={15} />{avatarFile ? avatarFile.name : 'Upload photo'}
                    </button>
                  </div>
                </>
              )}

              {/* Step 1: Roles */}
              {step === 1 && (
                <>
                  <h1 className="t-title" style={{ marginBottom: 6 }}>What roles are you targeting?</h1>
                  <p className="t-callout muted" style={{ marginBottom: 20 }}>Pick the job titles you want Iris to apply for.</p>
                  <input className="input" placeholder="Search roles…" value={roleQuery} onChange={e => setRoleQuery(e.target.value)} style={{ marginBottom: 14 }} />
                  {data.desiredRoles.length > 0 && (
                    <div className="chips" style={{ marginBottom: 14 }}>
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
                  <div className="field">
                    <label>Experience level</label>
                    <div className="stack gap-6">
                      {EXP_LEVELS.map(l => (
                        <button key={l.id} className={`chip ${data.experienceLevel === l.id ? 'on' : ''}`}
                          style={{ justifyContent: 'flex-start', borderRadius: 10, height: 40 }}
                          onClick={() => update({ experienceLevel: l.id })}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Experience */}
              {step === 2 && (
                <>
                  <h1 className="t-title" style={{ marginBottom: 6 }}>Work experience</h1>
                  <p className="t-callout muted" style={{ marginBottom: 20 }}>Add your most recent roles. You can add more later.</p>
                  <div className="stack gap-10" style={{ marginBottom: 14 }}>
                    {data.workExperience.map((exp, i) => (
                      <div key={exp.id} className="card pad stack gap-10">
                        <div className="row between">
                          <span className="t-callout" style={{ fontWeight: 600 }}>Entry {i + 1}</span>
                          <button className="icon-btn" onClick={() => update({ workExperience: data.workExperience.filter((_, j) => j !== i) })}><X size={15} /></button>
                        </div>
                        <div className="form-grid">
                          <div className="field"><label>Job title</label><input className="input" value={exp.title} placeholder="Software Engineer"
                            onChange={e => { const w = [...data.workExperience]; w[i] = { ...w[i], title: e.target.value }; update({ workExperience: w }); }} /></div>
                          <div className="field"><label>Company</label><input className="input" value={exp.company} placeholder="Acme Inc."
                            onChange={e => { const w = [...data.workExperience]; w[i] = { ...w[i], company: e.target.value }; update({ workExperience: w }); }} /></div>
                          <div className="field"><label>Start year</label><input className="input" value={exp.startYear} placeholder="2021"
                            onChange={e => { const w = [...data.workExperience]; w[i] = { ...w[i], startYear: e.target.value }; update({ workExperience: w }); }} /></div>
                          <div className="field"><label>End year</label><input className="input" value={exp.endYear} placeholder="Present"
                            onChange={e => { const w = [...data.workExperience]; w[i] = { ...w[i], endYear: e.target.value, isCurrent: !e.target.value || e.target.value.toLowerCase() === 'present' }; update({ workExperience: w }); }} /></div>
                        </div>
                        <label className="check"><input type="checkbox" checked={exp.isCurrent} onChange={e => { const w = [...data.workExperience]; w[i] = { ...w[i], isCurrent: e.target.checked, endYear: '' }; update({ workExperience: w }); }} />Currently working here</label>
                      </div>
                    ))}
                  </div>
                  <button className="btn outline block" onClick={() => update({ workExperience: [...data.workExperience, { id: `e${Date.now()}`, title: '', company: '', employmentType: 'Full-time', location: '', isRemote: false, startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false, description: '' }] })}>
                    <Plus size={15} />Add experience
                  </button>
                </>
              )}

              {/* Step 3: Education */}
              {step === 3 && (
                <>
                  <h1 className="t-title" style={{ marginBottom: 6 }}>Education</h1>
                  <p className="t-callout muted" style={{ marginBottom: 20 }}>Add your highest degree.</p>
                  <div className="stack gap-10" style={{ marginBottom: 14 }}>
                    {data.education.map((edu, i) => (
                      <div key={edu.id} className="card pad stack gap-10">
                        <div className="row between">
                          <span className="t-callout" style={{ fontWeight: 600 }}>Entry {i + 1}</span>
                          <button className="icon-btn" onClick={() => update({ education: data.education.filter((_, j) => j !== i) })}><X size={15} /></button>
                        </div>
                        <div className="form-grid">
                          {([['institution', 'University / School', 'MIT'], ['degree', 'Degree', 'B.S.'], ['field', 'Field of study', 'Computer Science'], ['startYear', 'Start year', '2018'], ['endYear', 'End year', '2022']] as [keyof typeof edu, string, string][]).map(([f, label, ph]) => (
                            <div key={f} className="field">
                              <label>{label}</label>
                              <input className="input" value={edu[f] as string} placeholder={ph}
                                onChange={e => { const ed = [...data.education]; (ed[i] as any)[f] = e.target.value; update({ education: ed }); }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn outline block" onClick={() => update({ education: [...data.education, { id: `ed${Date.now()}`, institution: '', degree: '', field: '', startYear: '', endYear: '' }] })}>
                    <Plus size={15} />Add education
                  </button>
                </>
              )}

              {/* Step 4: Skills */}
              {step === 4 && (
                <>
                  <h1 className="t-title" style={{ marginBottom: 6 }}>Skills</h1>
                  <p className="t-callout muted" style={{ marginBottom: 20 }}>Add your top technical and soft skills.</p>
                  <div className="row gap-8" style={{ marginBottom: 16 }}>
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
                  <div className="chips">
                    {data.skills.map(s => (
                      <button key={s.name} className="chip on" onClick={() => update({ skills: data.skills.filter(x => x.name !== s.name) })}>
                        {s.name}<span className="x"><X size={12} /></span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 5: Preferences */}
              {step === 5 && (
                <>
                  <h1 className="t-title" style={{ marginBottom: 6 }}>Work preferences</h1>
                  <p className="t-callout muted" style={{ marginBottom: 24 }}>How do you prefer to work?</p>
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
                  <div className="field" style={{ marginBottom: 16 }}>
                    <label>LinkedIn URL <span className="muted">(optional)</span></label>
                    <input className="input" value={data.linkedInUrl} onChange={e => update({ linkedInUrl: e.target.value })} placeholder="linkedin.com/in/…" />
                  </div>
                  <div className="field">
                    <label>GitHub URL <span className="muted">(optional)</span></label>
                    <input className="input" value={data.githubUrl} onChange={e => update({ githubUrl: e.target.value })} placeholder="github.com/…" />
                  </div>
                </>
              )}

              {/* Step 6: Resume */}
              {step === 6 && (
                <>
                  <h1 className="t-title" style={{ marginBottom: 6 }}>Upload your resume</h1>
                  <p className="t-callout muted" style={{ marginBottom: 24 }}>Iris uses your resume to tailor every application. You can skip this and add it later.</p>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) setResumeFile(f); }} />
                  {resumeFile ? (
                    <div className="card pad row gap-12" style={{ marginBottom: 12 }}>
                      <FileText size={20} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                      <span className="grow t-callout ellipsis">{resumeFile.name}</span>
                      <button className="icon-btn" onClick={() => setResumeFile(null)}><X size={15} /></button>
                    </div>
                  ) : (
                    <div className="empty" style={{ border: '2px dashed var(--line)', borderRadius: 16, marginBottom: 16, padding: '32px 20px' }}>
                      <div className="ico"><FileText /></div>
                      <div className="t-callout" style={{ fontWeight: 600 }}>No resume yet</div>
                      <p className="t-caption muted">PDF, DOC, or DOCX · max 10 MB</p>
                    </div>
                  )}
                  <button className="btn secondary block" onClick={() => fileRef.current?.click()}>
                    <Upload size={15} />{resumeFile ? 'Replace resume' : 'Choose file'}
                  </button>
                </>
              )}

              {/* Nav */}
              <div className="row between" style={{ marginTop: 32 }}>
                <button className="btn secondary" onClick={goBack} disabled={step === 0}><ChevronLeft size={16} />Back</button>
                <button className="btn" onClick={step === STEPS.length - 1 ? goNext : goNext}>
                  {step === 6 && !resumeFile ? 'Skip' : 'Continue'}<ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: live preview */}
          <ProfilePreview data={data} avatarFile={avatarFile} />
        </div>
      )}
    </div>
  );
}
