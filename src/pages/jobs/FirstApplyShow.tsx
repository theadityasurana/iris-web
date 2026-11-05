/**
 * Shown once, after someone's first application: about five seconds of Iris
 * filling in a form with their real details, then back to Home. It illustrates
 * the work; the real status lives under Applications.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, FileText, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { CompanyLogo } from '@web/ui/bits';

const DURATION = 5000;
export const FIRST_APPLY_EVENT = 'iris:first-apply';
export interface FirstApplyDetail { title: string; company: string; logo?: string; website?: string; portalUrl?: string }

const hostOf = (url?: string) => { try { return new URL(url!).hostname; } catch { return 'company careers page'; } };

export function FirstApplyShow() {
  const { profile, email } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<FirstApplyDetail | null>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    const onEvent = (e: Event) => { setT(0); setJob((e as CustomEvent<FirstApplyDetail>).detail); };
    window.addEventListener(FIRST_APPLY_EVENT, onEvent);
    return () => window.removeEventListener(FIRST_APPLY_EVENT, onEvent);
  }, []);

  useEffect(() => {
    if (!job) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      setT(Math.min(1, elapsed / DURATION));
      if (elapsed < DURATION + 500) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const finish = () => { setJob(null); navigate('/app/home'); };

  const fields = useMemo(() => [
    { label: 'Full name', value: profile?.name || 'Your name' },
    { label: 'Email', value: email || 'you@email.com' },
    { label: 'Phone', value: profile?.phone || 'From your profile' },
    { label: 'Location', value: profile?.location || 'From your profile' },
    { label: 'LinkedIn', value: profile?.linkedinUrl || 'From your profile' },
  ], [profile, email]);

  if (!job) return null;

  // Each field types during its own slice of the first 70% of the run.
  const typed = (i: number, value: string) => {
    const slice = 0.7 / fields.length;
    const p = Math.max(0, Math.min(1, (t - i * slice) / slice));
    return value.slice(0, Math.round(value.length * p));
  };
  const resumeOn = t > 0.72;
  const done = t >= 0.92;
  const activeIdx = Math.min(fields.length - 1, Math.floor(t / (0.7 / fields.length)));

  return (
    <div className="fa-wrap" role="dialog" aria-modal="true" aria-label={`Iris is applying to ${job.company}`}>
      <div className="fa">
        <div className="fa-head">
          <CompanyLogo name={job.company} url={job.logo} website={job.website} />
          <div className="grow">
            <div className="t-overline muted">Your first application</div>
            <h2 className="t-title">{done ? <>Queued for <em>{job.company}.</em></> : <>Iris is applying to <em>{job.company}.</em></>}</h2>
            <p className="t-callout soft ellipsis">{job.title}</p>
          </div>
        </div>

        <div className="fa-browser">
          <div className="fa-bar"><span /><span /><span /><div className="fa-url"><Lock size={11} />{hostOf(job.portalUrl)}</div></div>
          <div className="fa-form" aria-hidden="true">
            {fields.map((f, i) => {
              const text = typed(i, f.value);
              const active = !resumeOn && i === activeIdx;
              return (
                <div key={f.label} className={`fa-field ${active ? 'on' : ''}`}>
                  <label>{f.label}</label>
                  <div>{text}{active && <i className="fa-caret" />}{text.length === f.value.length && <Check size={14} />}</div>
                </div>
              );
            })}
            <div className={`fa-field fa-resume ${resumeOn ? 'filled' : ''}`}>
              <label>Resume</label>
              <div><FileText size={14} />{resumeOn ? 'Your tailored resume attached' : 'Waiting…'}{resumeOn && <Check size={14} />}</div>
            </div>
          </div>
          <div className="fa-cursor" style={{ top: `${14 + Math.min(1, t / 0.82) * 70}%`, left: `${28 + 44 * Math.abs(Math.sin(t * 9))}%` }} aria-hidden="true"><Sparkles size={15} /></div>
        </div>

        <div className="fa-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(t * 100)} aria-label="Application progress"><i style={{ width: `${t * 100}%` }} /></div>
        <div className="row between gap-12">
          <p className="t-caption muted">A preview of the work. Follow the real status in Applications.</p>
          <button className="btn ghost sm" onClick={finish}>{done ? 'Continue' : 'Skip'}</button>
        </div>
      </div>
    </div>
  );
}
