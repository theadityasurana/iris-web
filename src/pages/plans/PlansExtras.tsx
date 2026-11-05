/** The rest of the Plans page, adapted from the mobile app's premium screen. */
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, FileText, Search, Send, Inbox } from 'lucide-react';
import { CompanyLogo } from '@web/ui/bits';
import { freeSwipesPerCycle } from '@/lib/daily-swipes';

const JOBS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const DAYS = [7, 14, 21, 30, 45, 60, 90, 120];
// The app's estimate of minutes per application at each volume.
const MINUTES = [17, 22, 19, 26, 21, 28, 18, 24, 20, 25];
const COMPANIES = ['OpenAI', 'Anthropic', 'Stripe', 'Figma', 'Notion', 'Ramp', 'Datadog', 'Cloudflare', 'Duolingo', 'Pinterest', 'Linear', 'Uber', 'Zepto', 'Groww', 'CRED', 'Postman', 'Perplexity', 'ElevenLabs', 'Supabase', 'Replit'];

function formatTime(mins: number) {
  const h = Math.floor(mins / 60);
  if (h < 1) return `${Math.round(mins)} minutes`;
  if (h < 24) return `${h} hours`;
  const d = Math.floor(h / 24), r = h % 24;
  return r ? `${d} days, ${r} hours` : `${d} days`;
}

export function TimeSaved() {
  const [j, setJ] = useState(1);
  const [d, setD] = useState(3);
  const total = JOBS[j] * DAYS[d] * MINUTES[j];
  return (
    <section className="px-section card px-calc">
      <div>
        <div className="t-overline muted">Time saved</div>
        <h2 className="t-title">What is your search costing you?</h2>
        <p className="soft">Move the sliders to estimate the hours spent filling out forms by hand.</p>
        <label className="px-slider"><span>Applications per day <b className="num">{JOBS[j]}</b></span><input type="range" min={0} max={JOBS.length - 1} value={j} aria-label="Applications per day" onChange={e => setJ(+e.target.value)} /></label>
        <label className="px-slider"><span>Days of searching <b className="num">{DAYS[d]}</b></span><input type="range" min={0} max={DAYS.length - 1} value={d} aria-label="Days of searching" onChange={e => setD(+e.target.value)} /></label>
      </div>
      <div className="px-calc-out">
        <span className="t-overline">Filling forms by hand</span>
        <b>{formatTime(total)}</b>
        <p>{JOBS[j] * DAYS[d]} applications at about {MINUTES[j]} minutes each. With Iris, each one takes a swipe.</p>
      </div>
    </section>
  );
}

export function Hired() {
  const row = useMemo(() => [...COMPANIES, ...COMPANIES], []);
  return (
    <section className="px-section" aria-label="Companies in the Iris feed">
      <div className="t-overline muted px-center">Roles from companies like</div>
      <div className="ia-marquee"><div className="ia-marquee-track">{row.map((c, i) => <span key={i} aria-hidden={i >= COMPANIES.length} title={c}><CompanyLogo name={c} /></span>)}</div></div>
    </section>
  );
}

const STAGES = [
  { icon: Search, tab: 'Find', title: 'Iris finds what fits', body: 'It watches company career pages and ranks new roles against your resume.', rows: [['Senior Frontend Engineer · Stripe', '92%'], ['Product Engineer · Linear', '88%'], ['Data Engineer · Notion', '84%']] },
  { icon: FileText, tab: 'Prep', title: 'Your resume, tuned to the role', body: 'Keywords and requirements come from the job description. Your experience stays yours.', rows: [['Keywords matched', '12 of 14'], ['ATS score', '94 / 100'], ['Tailoring level', 'Honest']] },
  { icon: Send, tab: 'Apply', title: 'Every field, filled in', body: 'Iris completes the company’s own form, attaches your resume and submits.', rows: [['Your details', 'Filled'], ['Resume', 'Attached'], ['Screening questions', 'Answered']] },
  { icon: Inbox, tab: 'Track', title: 'Replies find their application', body: 'Confirmations and recruiter emails land in one inbox, and your tracker updates itself.', rows: [['Stripe', 'Interview'], ['Anthropic', 'Replied'], ['Vercel', 'Received']] },
];

export function Stages() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setI(n => (n + 1) % STAGES.length), 4500);
    return () => clearTimeout(t);
  }, [i, paused]);
  const s = STAGES[i];
  return (
    <section className="px-section" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="t-overline muted">What your credits do</div>
      <h2 className="t-title">One credit, the whole application.</h2>
      <div className="ia-tabs" role="tablist" style={{ marginTop: 16 }}>
        {STAGES.map((x, n) => <button key={x.tab} role="tab" aria-selected={i === n} className={i === n ? 'on' : ''} onClick={() => setI(n)}>{x.tab}{i === n && !paused && <i key={i} style={{ animationDuration: '4500ms' }} />}</button>)}
      </div>
      <article className="px-stage" key={i}>
        <div><s.icon size={26} /><h3 className="t-heading">{s.title}</h3><p>{s.body}</p></div>
        <div className="px-stage-rows" aria-label="Example">{s.rows.map(([a, b]) => <div key={a}><span className="ellipsis">{a}</span><b>{b}</b></div>)}</div>
      </article>
      <p className="t-caption muted" style={{ marginTop: 8 }}>Example data, for illustration</p>
    </section>
  );
}

export function PlansFaq() {
  const items = [
    { q: 'What is a credit?', a: 'One credit is one job application submitted for you. Website plans include the number of applications shown on each plan.' },
    { q: 'Is there a free plan?', a: `Yes. You get ${freeSwipesPerCycle()} free applications to start, with no card required.` },
    { q: 'Can I cancel any time?', a: 'Yes. Open Manage billing to cancel. Your plan and remaining credits stay active until the end of the period you paid for.' },
    { q: 'What is the difference between monthly and quarterly?', a: 'Quarterly costs less per application and gives you three months of credits at once.' },
    { q: 'Do mobile app plans work here?', a: 'Yes. A plan bought in the iOS or Android app also works on the website, but it is managed through the App Store or Google Play.' },
    { q: 'Will recruiters know I used Iris?', a: 'Your application arrives through the company’s normal portal, in your name, with your real details.' },
    { q: 'How does resume tailoring work?', a: 'Iris uses the job description to reword and reorder your resume around what matters for that role, based on your real experience. You choose how far it goes, or switch it off.' },
    { q: 'Does Iris work for remote jobs?', a: 'Yes. You can filter by remote, hybrid or on-site.' },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="px-section">
      <div className="t-overline muted">FAQ</div>
      <h2 className="t-title" style={{ marginBottom: 14 }}>Questions before you upgrade.</h2>
      <div className="card faq-card">
        {items.map((f, i) => (
          <div className="faq-item" key={f.q}>
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}><span>{f.q}</span><ChevronDown size={17} style={{ transform: open === i ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} /></button>
            {open === i && <p className="t-callout soft">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
