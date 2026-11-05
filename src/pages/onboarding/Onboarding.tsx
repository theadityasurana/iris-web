/**
 * Web onboarding. Same questions, order, stored fields and step numbers as the
 * mobile app (components/onboarding/Step*.tsx), minus the phone-only
 * notifications prompt, so an account can start on one and finish on the other.
 */
import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Upload, FileCheck2, GraduationCap, Repeat, BriefcaseBusiness, Check, Eye, EyeOff, WandSparkles,
  Plus, X, Zap, TrendingUp, Star, BarChart3, Laptop, Leaf, BookOpen, Shuffle,
} from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { Avatar, Logo } from '@web/ui/bits';
import { supabase } from '@/lib/supabase';
import { defaultOnboardingData, type OnboardingData } from '@/types/onboarding';
import { ROLE_CATEGORIES, CATEGORY_ROLES } from '@/constants/roles';
import { countryCodes, majorCities } from '@/constants/onboarding';
import { extractAndParsePdf } from '@/lib/resume-parser/pdf-reader';
import { parseResumeFromText, mapToOnboardingData } from '@/lib/resume-parser';
import { sanitizeParsedData } from '@/lib/resume-parser/sanitize';
import { applyReferralCode } from '@/lib/referral';

type Update = (partial: Partial<OnboardingData>) => void;
interface StepDef { n: number; label: string; art: string; caption: string; skippable?: boolean }

/** `n` is the app's step number, stored in onboarding_data.onboardingStep. */
const STEPS: StepDef[] = [
  { n: 1, label: 'Your resume', art: 'resume', caption: 'start with what you have done.' },
  { n: 2, label: 'About you', art: 'about', caption: 'the person behind the page.' },
  { n: 3, label: 'A bit about you', art: 'compliance', caption: 'asked once, kept private.' },
  { n: 4, label: 'Experience', art: 'experience', caption: 'the craft you have built.' },
  { n: 5, label: 'Target roles', art: 'roles', caption: 'picture where you belong.' },
  { n: 6, label: 'Your goal', art: 'goal', caption: 'know what you are after.' },
  { n: 7, label: 'Work authorization', art: 'authorization', caption: 'where you can work, on paper.', skippable: true },
  { n: 8, label: 'How you work', art: 'preferences', caption: 'the shape of the work.', skippable: true },
  { n: 9, label: 'Anything else', art: 'details', caption: 'the details forms always ask.', skippable: true },
  { n: 10, label: 'Application password', art: 'details', caption: 'one password, every board.', skippable: true },
  { n: 11, label: 'Resume style', art: 'experience', caption: 'how far to tailor.' },
  { n: 12, label: 'Referral', art: 'about', caption: 'better with a friend.', skippable: true },
  { n: 13, label: 'Almost done', art: 'final', caption: 'one last thing.', skippable: true },
];
const BRIEF_STEP = 15;

const USER_TYPES = [
  { key: 'fresher', label: 'Fresher', desc: 'New to the workforce', icon: GraduationCap },
  { key: 'job_switch', label: 'Job switch', desc: 'Looking for a change', icon: Repeat },
  { key: 'laid_off', label: 'Laid off', desc: 'Recently let go', icon: BriefcaseBusiness },
] as const;
const GENDERS = [['male', 'Male'], ['female', 'Female'], ['prefer_not_to_say', 'Prefer not to say']] as const;
const VETERAN = [['not_veteran', 'Not a protected veteran'], ['veteran', 'Veteran'], ['disabled', 'Disabled veteran'], ['recent_sep', 'Recently separated veteran'], ['active_duty', 'Active duty / campaign badge veteran'], ['service_medal', 'Armed Forces service medal veteran'], ['prefer_not', 'Prefer not to disclose']] as const;
const DISABILITY = [['yes', 'Yes, I have a disability (or previously had one)'], ['no', 'No, I do not have a disability'], ['prefer_not', 'Prefer not to disclose']] as const;
const RACE = [['american_indian', 'American Indian or Alaska Native'], ['asian', 'Asian'], ['southeast_asian', 'Southeast Asian'], ['black', 'Black or African American'], ['hispanic', 'Hispanic or Latino'], ['native_hawaiian', 'Native Hawaiian or Other Pacific Islander'], ['white', 'White'], ['two_or_more', 'Two or more races'], ['prefer_not', 'Prefer not to disclose']] as const;
const LEVELS = [['internship', 'Internship', 'Student or recent grad, first role'], ['entry_level', 'Entry Level', '0–1 years of experience'], ['junior', 'Junior', '1–2 years of experience'], ['mid', 'Mid Level', '3–5 years of experience'], ['senior', 'Senior', '6–9 years of experience'], ['expert', 'Expert & Leadership', '10+ years, management or IC track']] as const;
const GOALS = [
  { key: 'land_asap', label: 'Land a job ASAP', sub: 'Speed is the priority right now', icon: Zap },
  { key: 'more_money', label: 'Make more money', sub: 'Target higher-paying roles', icon: TrendingUp },
  { key: 'dream_job', label: 'Land my dream job', sub: 'Quality over quantity', icon: Star },
  { key: 'career_growth', label: 'Accelerate career growth', sub: 'Roles with clear upward trajectory', icon: BarChart3 },
  { key: 'remote_work', label: 'Find remote opportunities', sub: 'Work from anywhere', icon: Laptop },
  { key: 'work_life', label: 'Better work-life balance', sub: 'Sustainable pace and flexibility', icon: Leaf },
  { key: 'learn_skills', label: 'Learn new skills on the job', sub: 'Growth-focused environments', icon: BookOpen },
  { key: 'switch_industry', label: 'Switch to a new industry', sub: 'Transferable skills, new sector', icon: Shuffle },
];
const VISA = ['US Citizen', 'Not a US Citizen', 'Permanent Resident', 'H-1B', 'F-1 (Student)', 'OPT', 'CPT', 'J-1', 'L-1', 'O-1', 'TN', 'E-3', 'Other'];
const QUICK_ADD = ['Available immediately', 'Available to start in 2 weeks', 'Available in 1 month', 'Currently serving notice period', 'Open to up to 25% travel', 'No travel preferred', 'Available for in-person interviews', 'Prefer video interviews', 'Flexible interview availability', 'Seeking full-time only', 'Open to contract roles', 'Open to hybrid arrangements', 'Prefer fully remote', 'Require visa sponsorship', 'No sponsorship needed'];
const OPTIMIZE = [
  { value: 'off', label: 'Off', description: 'Use your original resume without AI changes.' },
  { value: 'honest', label: 'Honest', description: 'Conservative optimization. Only adds keywords that fit your experience.' },
  { value: 'aggressive', label: 'Aggressive', description: 'Maximize AI matching. Stretches to match job requirements.' },
] as const;
const HEARD = [['linkedin', 'LinkedIn'], ['twitter', 'Twitter / X'], ['instagram', 'Instagram'], ['google', 'Google Search'], ['friends_colleagues', 'Friends or Colleagues'], ['advertisement', 'Advertisement'], ['know_founder', 'Friends with the Founder'], ['app_store', 'App Store / Play Store'], ['podcast', 'Podcast'], ['youtube', 'YouTube'], ['other', 'Other']] as const;
const PW_RULES: [string, (p: string) => boolean][] = [
  ['12+ characters', p => p.length >= 12], ['Lowercase', p => /[a-z]/.test(p)], ['Uppercase', p => /[A-Z]/.test(p)], ['Number', p => /\d/.test(p)], ['Symbol', p => /[^A-Za-z0-9]/.test(p)],
];
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

function generatePassword(): string {
  const sets = ['abcdefghijkmnpqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', '!@#$%&*?'];
  const all = sets.join('');
  const pick = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  const chars = [...sets.map(pick), ...Array.from({ length: 12 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function Pills<T extends string>({ options, value, onPick }: { options: readonly (readonly [T, string])[]; value: string; onPick: (v: T) => void }) {
  return (
    <div className="ob-pills">
      {options.map(([v, label]) => <button type="button" key={v} className={`ob-pill ${value === v ? 'on' : ''}`} aria-pressed={value === v} onClick={() => onPick(v)}>{label}</button>)}
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="ob-yn">
      <button type="button" className={`ob-pill ${value === true ? 'on' : ''}`} aria-pressed={value === true} onClick={() => onChange(true)}>Yes</button>
      <button type="button" className={`ob-pill ${value === false ? 'on' : ''}`} aria-pressed={value === false} onClick={() => onChange(false)}>No</button>
    </div>
  );
}

function Block({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return <div className="ob-block"><div className="ob-label"><span>{label}</span>{hint && <small>{hint}</small>}</div>{children}</div>;
}

function StepResume({ data, update, onSkipResume, onBusy }: { data: OnboardingData; update: Update; onSkipResume: () => void; onBusy: (b: boolean) => void }) {
  const { uploadResume } = useAuth();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState('');

  const handle = async (file?: File | null) => {
    if (!file) return;
    if (file.size > MAX_RESUME_BYTES) return toast('That file is over 5 MB. Please upload a smaller one.', 'error');
    if (!/\.(pdf|docx)$/i.test(file.name)) return toast('Please upload a PDF or DOCX file.', 'error');
    setParsing(true); onBusy(true); setFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    try {
      const parsePromise = extractAndParsePdf(objectUrl);
      const url = await uploadResume(file);
      if (!url) { parsePromise.catch(() => {}); toast('Could not upload your resume. Please try again.', 'error'); setFileName(''); return; }
      let parsed: Record<string, any> = {};
      const result = await parsePromise.catch(() => null);
      if (result?.geminiData && result.method !== 'regex-fallback') parsed = result.geminiData;
      else if (result?.rawText && result.rawText.trim().length > 20) parsed = mapToOnboardingData(parseResumeFromText(result.rawText));
      if (Object.keys(parsed).length) parsed = sanitizeParsedData(parsed);
      else toast(result?.errorMessage || 'Resume saved. We could not read the details, so please fill them in.', 'error');
      // Blank parser values must never wipe something the user already typed.
      const clean = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && v.length === 0)));
      update({ ...clean, resumeUri: url });
    } finally {
      URL.revokeObjectURL(objectUrl);
      setParsing(false); onBusy(false);
    }
  };

  return (
    <>
      <h1>Let's start with your resume.</h1>
      <p>We read it once to fill in your profile, so you don't have to type it all out.</p>
      <Block label="Your resume" hint="PDF or DOCX, up to 5 MB">
        <input ref={input} type="file" hidden accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => { handle(e.target.files?.[0]); e.target.value = ''; }} />
        {parsing ? (
          <div className="ob-parsing" role="status"><span className="spinner" /><span>Reading {fileName || 'your resume'}. This takes a few seconds.</span></div>
        ) : data.resumeUri ? (
          <div className="ob-file"><FileCheck2 size={20} /><span className="grow ellipsis">{fileName || 'Resume uploaded'}</span><button type="button" className="btn ghost sm" onClick={() => input.current?.click()}>Replace</button></div>
        ) : (
          <>
            <button type="button" className={`ob-drop ${over ? 'over' : ''}`} onClick={() => input.current?.click()}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
              onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files?.[0]); }}>
              <Upload />
              <b>Upload your resume</b>
              <span className="t-callout muted">Drag it here, or click to choose a file</span>
            </button>
            <button type="button" className="t-caption link" style={{ marginTop: 10 }} onClick={onSkipResume}>I'll add it later</button>
          </>
        )}
      </Block>
      <Block label="What describes you best?">
        <div className="ob-types">
          {USER_TYPES.map(({ key, label, desc, icon: Icon }) => (
            <button type="button" key={key} className={`ob-choice ${data.userType === key ? 'on' : ''}`} aria-pressed={data.userType === key} onClick={() => update({ userType: data.userType === key ? '' : key })}>
              <Icon /><span><b>{label}</b><small>{desc}</small></span>
            </button>
          ))}
        </div>
      </Block>
    </>
  );
}

function StepAbout({ data, update }: { data: OnboardingData; update: Update }) {
  const [cityFocus, setCityFocus] = useState(false);
  const matches = useMemo(() => {
    const q = data.location.trim().toLowerCase();
    if (!q) return [];
    return (majorCities as string[]).filter(c => c.toLowerCase().includes(q) && c.toLowerCase() !== q).slice(0, 6);
  }, [data.location]);
  return (
    <>
      <h1>Tell us about yourself.</h1>
      <p>This is how you'll appear to employers. {data.resumeUri ? 'We filled in what we could from your resume.' : ''}</p>
      <div className="form-grid" style={{ marginTop: 28 }}>
        <div className="field"><label htmlFor="ob-first">First name</label><input id="ob-first" className="input" autoComplete="given-name" value={data.firstName} onChange={e => update({ firstName: e.target.value })} /></div>
        <div className="field"><label htmlFor="ob-last">Last name</label><input id="ob-last" className="input" autoComplete="family-name" value={data.lastName} onChange={e => update({ lastName: e.target.value })} /></div>
        <div className="field span-2">
          <label htmlFor="ob-phone">Phone number</label>
          <div className="row gap-8">
            <select className="select" style={{ width: 112, flexShrink: 0 }} aria-label="Country code" value={data.countryCode} onChange={e => update({ countryCode: e.target.value })}>
              {countryCodes.map(c => <option key={`${c.code}-${c.country}`} value={c.code}>{c.code} {c.country}</option>)}
            </select>
            <input id="ob-phone" className="input" type="tel" autoComplete="tel-national" value={data.phone} onChange={e => update({ phone: e.target.value })} />
          </div>
        </div>
        <div className="field span-2">
          <label htmlFor="ob-city">City</label>
          <input id="ob-city" className="input" autoComplete="off" placeholder="Your city" value={data.location} onFocus={() => setCityFocus(true)} onBlur={() => setTimeout(() => setCityFocus(false), 120)} onChange={e => update({ location: e.target.value })} />
          {cityFocus && matches.length > 0 && <div className="ob-suggest">{matches.map(c => <button type="button" key={c} onMouseDown={() => update({ location: c })}>{c}</button>)}</div>}
        </div>
        <div className="field"><label htmlFor="ob-li">LinkedIn <span className="muted">(optional)</span></label><input id="ob-li" className="input" placeholder="linkedin.com/in/you" value={data.linkedInUrl} onChange={e => update({ linkedInUrl: e.target.value })} /></div>
        <div className="field"><label htmlFor="ob-gh">GitHub <span className="muted">(optional)</span></label><input id="ob-gh" className="input" placeholder="github.com/you" value={data.githubUrl} onChange={e => update({ githubUrl: e.target.value })} /></div>
      </div>
    </>
  );
}

function StepRoles({ data, update }: { data: OnboardingData; update: Update }) {
  const [custom, setCustom] = useState('');
  const toggleCat = (key: string) => {
    const on = data.desiredRoleCategories.includes(key);
    const remove = on ? new Set(CATEGORY_ROLES[key] ?? []) : null;
    update({
      desiredRoleCategories: on ? data.desiredRoleCategories.filter(c => c !== key) : [...data.desiredRoleCategories, key],
      desiredRoles: remove ? data.desiredRoles.filter(r => !remove.has(r)) : data.desiredRoles,
    });
  };
  const toggleRole = (r: string) => update({ desiredRoles: data.desiredRoles.includes(r) ? data.desiredRoles.filter(x => x !== r) : [...data.desiredRoles, r] });
  const addCustom = () => {
    const r = custom.trim();
    if (r && !data.desiredRoles.includes(r)) update({ desiredRoles: [...data.desiredRoles, r] });
    setCustom('');
  };
  const known = new Set(data.desiredRoleCategories.flatMap(c => CATEGORY_ROLES[c] ?? []));
  const extras = data.desiredRoles.filter(r => !known.has(r));
  return (
    <>
      <h1>What roles are you looking for?</h1>
      <p>Pick categories, then the specific roles. The more specific, the better your matches.</p>
      <Block label="Categories">
        <div className="ob-pills">{ROLE_CATEGORIES.map(c => <button type="button" key={c.key} className={`ob-pill ${data.desiredRoleCategories.includes(c.key) ? 'on' : ''}`} onClick={() => toggleCat(c.key)}>{c.label}</button>)}</div>
      </Block>
      {data.desiredRoleCategories.map(key => (
        <Block key={key} label={ROLE_CATEGORIES.find(c => c.key === key)?.label}>
          <div className="ob-pills">{(CATEGORY_ROLES[key] ?? []).map(r => <button type="button" key={r} className={`ob-pill ${data.desiredRoles.includes(r) ? 'on' : ''}`} onClick={() => toggleRole(r)}>{r}</button>)}</div>
        </Block>
      ))}
      {extras.length > 0 && <Block label="Your additions"><div className="ob-pills">{extras.map(r => <button type="button" key={r} className="ob-pill on" onClick={() => toggleRole(r)}>{r} <X size={13} style={{ display: 'inline', verticalAlign: -2 }} /></button>)}</div></Block>}
      <Block label="Add a role" hint={`${data.desiredRoles.length} selected`}>
        <div className="input-wrap" style={{ display: 'flex', gap: 8 }}>
          <input className="input" style={{ paddingLeft: 18 }} placeholder="Add a role" value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} />
          <button type="button" className="btn outline" onClick={addCustom} aria-label="Add role"><Plus /></button>
        </div>
      </Block>
    </>
  );
}

function StepPassword({ data, update }: { data: OnboardingData; update: Update }) {
  const [show, setShow] = useState(false);
  const pw = data.applicationPassword;
  return (
    <>
      <h1>One password for job boards.</h1>
      <p>Some job sites (Workday, iCIMS, Oracle) require an account. We use this password to apply for you. Generate one or set your own.</p>
      <Block label="Password">
        <div className="row gap-8">
          <div className="input-wrap grow">
            <input className="input" style={{ paddingLeft: 18, paddingRight: 46 }} type={show ? 'text' : 'password'} autoComplete="new-password" value={pw} onChange={e => update({ applicationPassword: e.target.value })} aria-label="Application password" />
            <button type="button" className="icon-btn" style={{ position: 'absolute', right: 6, top: 6 }} onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff /> : <Eye />}</button>
          </div>
          <button type="button" className="btn outline" onClick={() => { update({ applicationPassword: generatePassword() }); setShow(true); }}><WandSparkles />Generate</button>
        </div>
        <div className="ob-checks">{PW_RULES.map(([label, test]) => <span key={label} className={test(pw) ? 'ok' : ''}><Check size={13} />{label}</span>)}</div>
      </Block>
    </>
  );
}

function StepReferral({ data, update, userId, onValidity }: { data: OnboardingData; update: Update; userId: string | null; onValidity: (v: boolean | null) => void }) {
  const [valid, setValid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    const code = data.referralCode.trim().toUpperCase();
    if (!code) { setValid(null); onValidity(null); setChecking(false); return; }
    setChecking(true);
    const t = setTimeout(async () => {
      const { data: rows, error } = await supabase.from('profiles').select('id').eq('referral_code', code).limit(1);
      const ok = !error && !!rows?.length && rows[0].id !== userId;
      setValid(ok); onValidity(ok); setChecking(false);
    }, 450);
    return () => clearTimeout(t);
  }, [data.referralCode, userId, onValidity]);
  return (
    <>
      <h1>Got a referral code?</h1>
      <p>You'll both get 5 bonus applications. No code? Just skip this.</p>
      <Block label="Referral code">
        <input className="input" style={{ textTransform: 'uppercase', fontFamily: 'var(--mono)' }} value={data.referralCode} onChange={e => update({ referralCode: e.target.value })} aria-label="Referral code" />
        {checking && <p className="t-caption muted" style={{ marginTop: 8 }}>Checking…</p>}
        {!checking && valid === true && <p className="t-caption" style={{ marginTop: 8, color: 'var(--ok)' }}>Valid. You'll both get 5 bonus applications.</p>}
        {!checking && valid === false && <p className="t-caption" style={{ marginTop: 8, color: 'var(--danger)' }}>This code doesn't exist. Double-check it, or clear it to skip.</p>}
      </Block>
    </>
  );
}

const joinList = (items: string[]) => items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`;

function Brief({ data, avatar, busy, error, onBack, onFinish }: { data: OnboardingData; avatar?: string | null; busy: boolean; error: string; onBack: () => void; onFinish: () => void }) {
  const name = `${data.firstName} ${data.lastName}`.trim() || 'You';
  const level = LEVELS.find(l => l[0] === data.experienceLevel);
  const roles = data.desiredRoles.slice(0, 3);
  const latest = data.workExperience?.[0];
  const goal = GOALS.find(g => g.key === data.goal);
  const skills = (data.skills ?? []).slice(0, 6);
  const today = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="brief-page">
      <div className="brief-read">
        <div className="t-overline muted">Our read on you</div>
        <p>
          {data.firstName || 'You'}, you're {level ? <mark>{level[1].toLowerCase().replace(' & ', ' and ')} level</mark> : 'starting out'}
          {roles.length > 0 && <> and looking for <mark>{joinList(roles)}</mark> roles</>}
          {data.location && <> around <mark>{data.location}</mark></>}.
        </p>
      </div>
      <article className="brief">
        <div className="brief-head t-overline"><span>Your brief</span><span>{today}</span></div>
        <div className="brief-who">
          <Avatar src={typeof data.profilePicture === 'string' ? data.profilePicture : avatar} name={name} size="lg" />
          <div><h2>{name}</h2>{data.location && <div className="t-overline muted" style={{ marginTop: 4 }}>{data.location}</div>}</div>
        </div>
        {latest?.title && <div className="brief-row"><span className="t-overline">Is</span><span>{latest.title}{latest.company ? ` at ${latest.company}` : ''}</span></div>}
        <div className="brief-row"><span className="t-overline">Wants</span><span>{data.desiredRoles.join(' · ') || 'Not set yet'}</span></div>
        {goal && <div className="brief-row"><span className="t-overline">Goal</span><span>{goal.label}</span></div>}
        {skills.length > 0 && (
          <div className="brief-skills">
            <div className="t-overline muted" style={{ marginBottom: 10 }}>Skills from your resume</div>
            <div className="chips">{skills.map(s => <span key={s.name} className="chip static">{s.name}</span>)}</div>
          </div>
        )}
        <div className="brief-tear" />
        <div className="t-overline muted">A note from the founder</div>
        <p className="brief-note">I built Iris because job hunting shouldn't feel like a full-time job. Swipe right on what excites you, and we handle the rest.</p>
        <p className="t-callout muted" style={{ marginTop: 8 }}>Aditya Surana, founder</p>
      </article>
      <div className="brief-cta">
        {error && <div className="banner red" role="alert">{error}</div>}
        <button className="btn lg block" onClick={onFinish} disabled={busy}>{busy ? <><span className="spinner" />Setting up your feed</> : <>See my jobs<ArrowRight /></>}</button>
        <button className="btn ghost block" onClick={onBack} disabled={busy}><ArrowLeft />Back and edit</button>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const { onboardingData, profileRow, userId, saveOnboardingProgress, completeOnboarding, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<OnboardingData>(() => ({
    ...defaultOnboardingData,
    ...onboardingData,
    firstName: onboardingData.firstName || profileRow?.first_name || '',
    lastName: onboardingData.lastName || profileRow?.last_name || '',
  }));
  const [stepNo, setStepNo] = useState<number>(() => {
    const saved = onboardingData.onboardingStep ?? 1;
    if (saved >= 14) return BRIEF_STEP;
    return STEPS.some(s => s.n === saved) ? saved : 1;
  });
  const [skippedResume, setSkippedResume] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update: Update = partial => setData(prev => ({ ...prev, ...partial }));
  const index = STEPS.findIndex(s => s.n === stepNo);
  const step = STEPS[index];

  useEffect(() => { document.title = `${step?.label ?? 'Your brief'} | Iris`; window.scrollTo(0, 0); }, [step]);

  const go = (n: number) => { setStepNo(n); saveOnboardingProgress({ ...data, onboardingStep: n }); };
  const next = () => {
    if (stepNo === 13) return go(BRIEF_STEP);
    go(STEPS[index + 1].n);
  };
  const back = () => {
    if (stepNo === BRIEF_STEP) return go(13);
    if (index === 0) {
      saveOnboardingProgress({ ...data, onboardingStep: 1 });
      window.location.assign('/');
      return;
    }
    go(STEPS[index - 1].n);
  };

  const canContinue = (() => {
    switch (stepNo) {
      case 1: return !uploading && !!data.userType && (!!data.resumeUri || skippedResume);
      case 2: return !!data.firstName.trim() && !!data.lastName.trim() && data.phone.trim().length >= 6 && !!data.location.trim();
      case 3: return !!data.gender && !!data.veteranStatus && !!data.disabilityStatus && !!data.ethnicity;
      case 4: return !!data.experienceLevel;
      case 5: return data.desiredRoles.length > 0;
      case 6: return !!data.goal;
      case 7: return !!data.workAuthorizationStatus && data.authorizedToWork !== null && data.needsSponsorship !== null;
      case 10: return !data.applicationPassword || PW_RULES.every(([, t]) => t(data.applicationPassword));
      case 11: return !!data.resumeOptimizationLevel;
      case 12: return referralValid !== false;
      default: return true;
    }
  })();

  const signOut = async () => { await logout(); navigate('/app/sign-in', { replace: true }); };

  const finish = async () => {
    setSubmitting(true);
    setError('');
    try {
      try { sessionStorage.setItem('iris_show_first_job', '1'); } catch { /* private mode */ }
      await completeOnboarding(data, {});
      if (data.referralCode.trim() && userId) {
        const r = await applyReferralCode(userId, data.referralCode.trim().toUpperCase()).catch(() => null);
        if (r && !r.success) toast(r.message, 'error');
      }
      navigate('/app/first-job', { replace: true });
    } catch (e: any) {
      try { sessionStorage.removeItem('iris_show_first_job'); } catch { /* private mode */ }
      setError(e?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const top = (
    <header className="ob-top">
      <a href="/" className="brand"><Logo size={26} />Iris</a>
      <button className="btn ghost sm" onClick={signOut}>Sign out</button>
    </header>
  );

  if (stepNo === BRIEF_STEP) {
    return (
      <div className="ob">
        {top}
        <Brief data={data} avatar={profileRow?.avatar_url} busy={submitting} error={error} onBack={back} onFinish={finish} />
      </div>
    );
  }

  return (
    <div className="ob">
      {top}
      <div className="ob-progress" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={index + 1} aria-label="Onboarding progress"><span style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} /></div>
      <div className="ob-main">
        <div className="ob-art">
          <img src={`/media/onboarding/${step.art}.webp`} alt="" width={880} height={1100} />
          <div className="ob-art-copy">
            <div className="t-overline">{String(index + 1).padStart(2, '0')} / {STEPS.length} · {step.label}</div>
            <em>{step.caption}</em>
          </div>
        </div>
        <div className="ob-panel">
          <section className="ob-q" key={stepNo}>
            {stepNo === 1 && <StepResume data={data} update={update} onBusy={setUploading} onSkipResume={() => { setSkippedResume(true); toast('No problem. You can add it from your profile.'); }} />}
            {stepNo === 2 && <StepAbout data={data} update={update} />}
            {stepNo === 3 && (
              <>
                <h1>A bit about you.</h1>
                <p>Required by US employers for equal opportunity compliance. Confidential, and never shared with hiring managers.</p>
                <Block label="Gender"><Pills options={GENDERS} value={data.gender} onPick={v => update({ gender: v })} /></Block>
                <Block label="Veteran status"><Pills options={VETERAN} value={data.veteranStatus} onPick={v => update({ veteranStatus: v })} /></Block>
                <Block label="Do you have a disability?"><Pills options={DISABILITY} value={data.disabilityStatus} onPick={v => update({ disabilityStatus: v })} /></Block>
                <Block label="Race or ethnicity"><Pills options={RACE} value={data.ethnicity} onPick={v => update({ ethnicity: v })} /></Block>
              </>
            )}
            {stepNo === 4 && (
              <>
                <h1>Where are you in your career?</h1>
                <p>We use this to filter roles by seniority and match you with the right salary bands.</p>
                <div className="ob-choices ob-block">
                  {LEVELS.map(([v, label, sub]) => <button type="button" key={v} className={`ob-choice ${data.experienceLevel === v ? 'on' : ''}`} aria-pressed={data.experienceLevel === v} onClick={() => update({ experienceLevel: v })}><span><b>{label}</b><small>{sub}</small></span></button>)}
                </div>
              </>
            )}
            {stepNo === 5 && <StepRoles data={data} update={update} />}
            {stepNo === 6 && (
              <>
                <h1>What's your primary goal?</h1>
                <p>We'll prioritize roles that match what you're actually after.</p>
                <div className="ob-choices ob-block">
                  {GOALS.map(({ key, label, sub, icon: Icon }) => <button type="button" key={key} className={`ob-choice ${data.goal === key ? 'on' : ''}`} aria-pressed={data.goal === key} onClick={() => update({ goal: key })}><Icon /><span><b>{label}</b><small>{sub}</small></span></button>)}
                </div>
              </>
            )}
            {stepNo === 7 && (
              <>
                <h1>Work authorization.</h1>
                <p>Required by US employers on every application. Takes 10 seconds. Only applying elsewhere? You can skip this.</p>
                <Block label="Your current visa or citizenship status"><Pills options={VISA.map(v => [v, v] as const)} value={data.workAuthorizationStatus} onPick={v => update({ workAuthorizationStatus: v })} /></Block>
                <div className="ob-card ob-block">
                  <div className="ob-row"><div className="ob-row-text">Authorized to work in the US?<small>Without any restrictions, right now.</small></div><YesNo value={data.authorizedToWork} onChange={v => update({ authorizedToWork: v })} /></div>
                  <div className="ob-row"><div className="ob-row-text">Will you need sponsorship?<small>A work visa such as H-1B, now or in the future.</small></div><YesNo value={data.needsSponsorship} onChange={v => update({ needsSponsorship: v })} /></div>
                </div>
              </>
            )}
            {stepNo === 8 && (
              <>
                <h1>How do you want to work?</h1>
                <p>These help us filter and match roles that actually fit your situation.</p>
                <div className="ob-card ob-block">
                  <div className="ob-row"><div className="ob-row-text">Open to in-person work?</div><YesNo value={data.openToInPerson} onChange={v => update({ openToInPerson: v })} /></div>
                  <div className="ob-row"><div className="ob-row-text">Willing to relocate?</div><YesNo value={data.willingToRelocate} onChange={v => update({ willingToRelocate: v })} /></div>
                  <div className="ob-row"><div className="ob-row-text">Can start immediately?</div><YesNo value={data.canStartImmediately} onChange={v => update({ canStartImmediately: v })} /></div>
                  <div className="ob-row"><div className="ob-row-text">Reliable transportation?</div><YesNo value={data.hasReliableTransport} onChange={v => update({ hasReliableTransport: v })} /></div>
                </div>
                <Block label="Need workplace accommodations?" hint="Covered under the ADA. This won't affect your chances.">
                  <Pills options={[['no', 'No'], ['yes', 'Yes'], ['prefer_not', 'Prefer not to say']] as const} value={data.needsAccommodations ?? ''} onPick={v => update({ needsAccommodations: v })} />
                </Block>
              </>
            )}
            {stepNo === 9 && (
              <>
                <h1>Anything else we should know?</h1>
                <p>Notice period, travel, interview availability. Anything that helps us fill applications faster and more accurately.</p>
                <div className="ob-block"><textarea className="textarea" rows={5} maxLength={2000} value={data.additionalInfo} aria-label="Additional information" onChange={e => update({ additionalInfo: e.target.value })} /></div>
                <Block label="Quick add">
                  <div className="ob-pills">{QUICK_ADD.filter(q => !data.additionalInfo.includes(q)).map(q => <button type="button" key={q} className="ob-pill" onClick={() => update({ additionalInfo: data.additionalInfo ? `${data.additionalInfo.trim()}\n${q}` : q })}>{q}</button>)}</div>
                </Block>
              </>
            )}
            {stepNo === 10 && <StepPassword data={data} update={update} />}
            {stepNo === 11 && (
              <>
                <h1>How far should we tailor your resume?</h1>
                <p>You can change this anytime from your account.</p>
                <div className="ob-choices ob-block">
                  {OPTIMIZE.map(o => <button type="button" key={o.value} className={`ob-choice ${data.resumeOptimizationLevel === o.value ? 'on' : ''}`} aria-pressed={data.resumeOptimizationLevel === o.value} onClick={() => update({ resumeOptimizationLevel: o.value })}><span><b>{o.label}</b><small>{o.description}</small></span></button>)}
                </div>
              </>
            )}
            {stepNo === 12 && <StepReferral data={data} update={update} userId={userId} onValidity={setReferralValid} />}
            {stepNo === 13 && (
              <>
                <h1>How did you hear about us?</h1>
                <p>Helps us understand where to focus our energy.</p>
                <div className="ob-block"><Pills options={HEARD} value={data.heardAboutUs} onPick={v => update({ heardAboutUs: v })} /></div>
              </>
            )}
          </section>
          <div className="ob-nav">
            <button className="btn outline lg" onClick={back}><ArrowLeft />{index === 0 ? 'Home' : 'Back'}</button>
            <button className="btn lg next" onClick={next} disabled={!canContinue}>Continue<ArrowRight /></button>
          </div>
          {step.skippable && !canContinue && stepNo !== 12 && <button className="t-caption link" style={{ alignSelf: 'center' }} onClick={next}>Skip for now</button>}
          {stepNo === 12 && data.referralCode && referralValid === false && <button className="t-caption link" style={{ alignSelf: 'center' }} onClick={() => update({ referralCode: '' })}>Clear code and continue</button>}
        </div>
      </div>
    </div>
  );
}
