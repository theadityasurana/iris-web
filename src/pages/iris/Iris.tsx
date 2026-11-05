import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, FileText, Lock, Moon, SlidersHorizontal, Upload, X, Send, type LucideIcon } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useEntitlements } from '@web/lib/queries';
import { useToast } from '@web/ui/Toast';
import { CompanyLogo, Empty, Switch, timeAgo } from '@web/ui/bits';
import { fetchAllCompanies } from '@/lib/jobs';
import { DEFAULT_IRIS_PREFS, getIrisApplications, getIrisEnabled, getIrisPreferences, saveIrisPreferences, setIrisEnabled, type IrisPreferences, type SalaryCurrency } from '@/lib/iris';

const SIZES = ['Any', 'Startup', 'Mid-size', 'Enterprise'] as const;
const TONES = ['Professional', 'Conversational', 'Bold', 'Friendly', 'Assertive', 'Witty'] as const;
const CURRENCIES: SalaryCurrency[] = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD'];
const LOCATIONS = [
  { value: 'unified', label: 'Best matches' }, { value: 'india', label: 'India' }, { value: 'usa', label: 'USA' },
  { value: 'remote', label: 'Remote' }, { value: 'discover', label: 'Global' },
] as const;
const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Upload, title: 'Add your resume', desc: 'Iris reads your experience and uses it for every application.' },
  { icon: SlidersHorizontal, title: 'Set your criteria', desc: 'Match threshold, salary floor, company size, and companies to prioritise or avoid.' },
  { icon: Moon, title: 'Iris works overnight', desc: 'It finds matching roles and applies, up to your daily limit.' },
  { icon: FileText, title: 'Wake up to a report', desc: 'See what was sent, with an ATS score and interview prep for each job.' },
];
const FAQS = [
  { q: 'How is Iris different from mass-apply tools?', a: 'Iris only applies when a job clears the match score you set, and it never applies to companies you block. You decide how selective it is.' },
  { q: 'How many applications does Iris send per day?', a: 'Up to the daily limit you choose here, from 1 to 10. Each one uses a credit.' },
  { q: 'When does Iris run?', a: 'Overnight. You can pause it on weekends or switch it off at any time, and it stops straight away.' },
  { q: 'Do I need a resume?', a: 'Yes. Iris uses your resume and profile to fill in applications, so add a PDF or DOCX from your profile first.' },
  { q: 'Can I see what Iris sent?', a: 'Yes. Every application appears under Applications, and replies land in your Tracker.' },
  { q: 'Which plans include Iris?', a: 'Starter, Pro and Ultra plans bought in the Iris mobile app.' },
];

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}><span>{q}</span><ChevronDown size={17} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} /></button>
      {open && <p className="t-callout soft">{a}</p>}
    </div>
  );
}

function CompanyList({ label, hint, items, options, onChange, disabled }: { label: string; hint: string; items: string[]; options: string[]; onChange: (next: string[]) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState('');
  const q = draft.trim().toLowerCase();
  const matches = useMemo(() => (q ? options.filter(o => o.toLowerCase().includes(q) && !items.includes(o)).slice(0, 6) : []), [q, options, items]);
  const add = (v: string) => { const t = v.trim(); if (t && !items.includes(t)) onChange([...items, t]); setDraft(''); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); add(matches[0] ?? draft); } };
  return (
    <section className="iris-control">
      <div className="iris-label"><b>{label}</b><small>{hint}</small></div>
      {items.length > 0 && <div className="chips" style={{ marginBottom: 10 }}>{items.map(c => <span key={c} className="chip static">{c}<button className="x" disabled={disabled} onClick={() => onChange(items.filter(x => x !== c))} aria-label={`Remove ${c}`}><X size={13} /></button></span>)}</div>}
      <input className="input" disabled={disabled} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onKey} placeholder="Add a company" aria-label={`Add a company to ${label}`} />
      {matches.length > 0 && <div className="ob-suggest">{matches.map(m => <button key={m} onClick={() => add(m)}>{m}</button>)}</div>}
    </section>
  );
}

export default function Iris() {
  const { userId } = useAuth();
  const ent = useEntitlements();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<'controls' | 'about'>('controls');
  const [local, setLocal] = useState<IrisPreferences>(DEFAULT_IRIS_PREFS);
  const locked = !ent.iris;

  const { data: enabled = false } = useQuery({ queryKey: ['iris-enabled', userId], queryFn: () => getIrisEnabled(userId!), enabled: !!userId && !locked });
  const { data: prefs } = useQuery({ queryKey: ['iris-preferences', userId], queryFn: () => getIrisPreferences(userId!), enabled: !!userId && !locked });
  const { data: apps = [] } = useQuery({ queryKey: ['iris-applications', userId], queryFn: () => getIrisApplications(userId!), enabled: !!userId && !locked, staleTime: 60_000 });
  const { data: companies = [] } = useQuery({ queryKey: ['all-companies'], queryFn: fetchAllCompanies, enabled: !locked, staleTime: 24 * 60 * 60_000 });

  useEffect(() => { if (prefs) setLocal({ ...DEFAULT_IRIS_PREFS, ...prefs }); }, [prefs]);

  const toggle = useMutation({
    mutationFn: (v: boolean) => setIrisEnabled(userId!, v),
    onMutate: v => qc.setQueryData(['iris-enabled', userId], v),
    onSuccess: ok => { if (!ok) { qc.invalidateQueries({ queryKey: ['iris-enabled', userId] }); toast('Could not update Iris. Please try again.', 'error'); } },
    onError: () => { qc.invalidateQueries({ queryKey: ['iris-enabled', userId] }); toast('Could not update Iris. Please try again.', 'error'); },
  });

  const save = async (patch: Partial<IrisPreferences>) => {
    if (!userId || locked) return;
    const before = local;
    setLocal({ ...local, ...patch });
    if (await saveIrisPreferences(userId, patch)) qc.invalidateQueries({ queryKey: ['iris-preferences', userId] });
    else { setLocal(before); toast('Could not save. Please try again.', 'error'); }
  };

  const toggleLocation = (v: IrisPreferences['jobLocations'][number]) => {
    const on = local.jobLocations.includes(v);
    const next = on ? local.jobLocations.filter(x => x !== v) : [...local.jobLocations, v];
    if (next.length) save({ jobLocations: next });
  };

  return (
    <div className="page">
      <section className="iris-hero">
        <img src="/media/onboarding/authorization.webp" alt="" width={880} height={1100} />
        <div className="iris-hero-copy">
          <div className="t-overline">Your personal job concierge</div>
          <h1 className="t-display">Iris applies to jobs while you sleep.</h1>
          <p>Set your criteria once. Iris finds the roles that clear your bar and applies overnight.</p>
          {locked ? (
            <Link to="/app/plans" className="btn lg iris-hero-btn"><Lock />See plans</Link>
          ) : (
            <label className="iris-switch"><Switch checked={enabled} onChange={v => toggle.mutate(v)} label="Iris auto-apply" /><span>{enabled ? 'Iris is on' : 'Iris is off'}</span></label>
          )}
        </div>
      </section>

      <div className="segmented" role="group" aria-label="Iris sections" style={{ margin: '24px 0' }}>
        <button className={tab === 'controls' ? 'on' : ''} aria-pressed={tab === 'controls'} onClick={() => setTab('controls')}>Controls</button>
        <button className={tab === 'about' ? 'on' : ''} aria-pressed={tab === 'about'} onClick={() => setTab('about')}>About Iris</button>
      </div>

      {tab === 'controls' && (
        <>
          {locked && <div className="banner" style={{ marginBottom: 18 }}><Lock /><span className="grow">Iris auto-apply is included with Starter, Pro and Ultra plans from the mobile app. These controls unlock with those plans.</span></div>}

          <section className="summary-card">
            <div className="summary-stats">
              <div><b className="num">{apps.length}</b><span className="t-overline muted">Applied</span></div>
              <div><b className="num">{local.minMatchScore}%</b><span className="t-overline muted">Min match</span></div>
              <div><b className="num">{local.watchlist.length}</b><span className="t-overline muted">Watchlist</span></div>
              <div><b className="num">{local.blocked.length}</b><span className="t-overline muted">Blocked</span></div>
            </div>
          </section>

          <div className={`iris-grid ${locked ? 'is-locked' : ''}`}>
            <div className="card pad iris-col">
              <h2 className="t-heading">Companies</h2>
              <CompanyList label="Watchlist" hint="Prioritise these companies" items={local.watchlist} options={companies} disabled={locked} onChange={watchlist => save({ watchlist })} />
              <CompanyList label="Blocked" hint="Never apply to these companies" items={local.blocked} options={companies} disabled={locked} onChange={blocked => save({ blocked })} />
              <section className="iris-control">
                <div className="iris-label"><b>Company size</b><small>Filter by headcount</small></div>
                <div className="ob-pills">{SIZES.map(s => <button key={s} disabled={locked} className={`ob-pill ${local.companySize === s ? 'on' : ''}`} aria-pressed={local.companySize === s} onClick={() => save({ companySize: s })}>{s}</button>)}</div>
              </section>
            </div>

            <div className="card pad iris-col">
              <h2 className="t-heading">Criteria</h2>
              <section className="iris-control">
                <div className="iris-label"><b>Minimum match score</b><small>Only apply above this fit</small><span className="iris-val num">{local.minMatchScore}%</span></div>
                <input type="range" min={50} max={100} step={5} disabled={locked} value={local.minMatchScore} aria-label="Minimum match score" onChange={e => setLocal({ ...local, minMatchScore: +e.target.value })} onPointerUp={e => save({ minMatchScore: +e.currentTarget.value })} onKeyUp={e => save({ minMatchScore: +e.currentTarget.value })} />
              </section>
              <section className="iris-control">
                <div className="iris-label"><b>Daily limit</b><small>Most applications Iris sends per day</small><span className="iris-val num">{local.dailyLimit}</span></div>
                <input type="range" min={1} max={10} disabled={locked} value={local.dailyLimit} aria-label="Daily limit" onChange={e => setLocal({ ...local, dailyLimit: +e.target.value })} onPointerUp={e => save({ dailyLimit: +e.currentTarget.value })} onKeyUp={e => save({ dailyLimit: +e.currentTarget.value })} />
              </section>
              <section className="iris-control">
                <div className="iris-label"><b>Salary floor</b><small>Skip roles below this amount. 0 means any.</small></div>
                <div className="row gap-8">
                  <select className="select" style={{ width: 104, flexShrink: 0 }} disabled={locked} aria-label="Currency" value={local.salaryCurrency} onChange={e => save({ salaryCurrency: e.target.value as SalaryCurrency })}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
                  <input className="input" type="number" min={0} disabled={locked} aria-label="Salary floor" value={local.salaryFloor} onChange={e => setLocal({ ...local, salaryFloor: Math.max(0, +e.target.value || 0) })} onBlur={e => save({ salaryFloor: Math.max(0, +e.target.value || 0) })} />
                </div>
              </section>
              <section className="iris-control">
                <div className="iris-label"><b>Job locations</b><small>Where Iris looks. Pick one or more.</small></div>
                <div className="ob-pills">{LOCATIONS.map(l => <button key={l.value} disabled={locked} className={`ob-pill ${local.jobLocations.includes(l.value) ? 'on' : ''}`} aria-pressed={local.jobLocations.includes(l.value)} onClick={() => toggleLocation(l.value)}>{l.label}</button>)}</div>
              </section>
              <section className="iris-control">
                <div className="iris-label"><b>Outreach tone</b><small>How Iris sounds to hiring managers</small></div>
                <div className="ob-pills">{TONES.map(t => <button key={t} disabled={locked} className={`ob-pill ${local.outreachTone === t ? 'on' : ''}`} aria-pressed={local.outreachTone === t} onClick={() => save({ outreachTone: t })}>{t}</button>)}</div>
              </section>
              <section className="iris-control iris-inline">
                <div className="iris-label"><b>Pause on weekends</b><small>No applications on Saturday or Sunday</small></div>
                <Switch checked={local.pauseWeekends} onChange={pauseWeekends => { if (!locked) save({ pauseWeekends }); }} label="Pause on weekends" />
              </section>
            </div>
          </div>

          {!locked && (
            <section style={{ marginTop: 28 }}>
              <div className="section-title">
                <h2 className="t-title">What Iris applied to</h2>
                <Link to="/app/iris/report" className="btn outline">View report<ArrowRight /></Link>
              </div>
              <div className="card table-card">
                {apps.length === 0 ? <Empty icon={Send} title="Nothing yet" body="Applications appear here after Iris runs overnight." /> : apps.slice(0, 10).map(a => (
                  <Link key={a.id} to={`/app/applications/${a.id}`} className="app-row">
                    <CompanyLogo name={a.company_name} size="sm" />
                    <div className="grow"><div className="ellipsis" style={{ fontWeight: 500 }}>{a.job_title}</div><div className="t-caption muted ellipsis">{a.company_name}</div></div>
                    <time className="t-caption muted app-when">{timeAgo(a.applied_at)}</time>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {tab === 'about' && (
        <>
          <h2 className="t-title">How it works</h2>
          <div className="iris-steps">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <article key={title} className="card pad">
                <div className="row between"><Icon size={20} /><span className="t-overline muted">0{i + 1}</span></div>
                <h3 className="p-card-title" style={{ marginTop: 14 }}>{title}</h3>
                <p className="t-callout soft" style={{ marginTop: 4 }}>{desc}</p>
              </article>
            ))}
          </div>
          <h2 className="t-title" style={{ marginTop: 36, marginBottom: 12 }}>Frequently asked questions</h2>
          <div className="card faq-card">{FAQS.map(f => <Faq key={f.q} {...f} />)}</div>
        </>
      )}
    </div>
  );
}
