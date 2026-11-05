/**
 * The "About Iris" tab, adapted from the mobile app's screen (rork app/iris.tsx):
 * live activity terminal, inbox preview, value-prop and feature carousels, company
 * marquee, ATS coverage, sample report, how it works, comparison, numbers and FAQ.
 *
 * Sample content is labelled as a sample. Figures match the landing page.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Eye, FileText, Link2, Moon, Send, SlidersHorizontal, Upload, X, Zap, type LucideIcon } from 'lucide-react';
import { CompanyLogo } from '@web/ui/bits';

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const FEED = [
  { text: 'Scanning career pages for active roles', type: 'SYS' },
  { text: 'Match found · Stripe · Senior Frontend Engineer · 91%', type: 'SYS' },
  { text: 'Resume tailored · ATS score 94/100', type: 'SYS' },
  { text: 'Applying → Stripe · Senior Frontend Engineer', type: 'APL' },
  { text: 'Outreach sent → hiring manager at Stripe', type: 'OUT' },
  { text: 'Scanning Greenhouse, Lever and Ashby portals', type: 'SYS' },
  { text: 'Match found · Anthropic · ML Engineer · 91%', type: 'SYS' },
  { text: 'Applying → Anthropic · ML Engineer', type: 'APL' },
  { text: 'Cover letter written · tone: professional', type: 'SYS' },
  { text: 'Reply received ← Stripe recruiter', type: 'OUT' },
  { text: 'Interview prep ready for the Stripe role', type: 'SYS' },
  { text: 'Applying → Figma · Design Engineer', type: 'APL' },
  { text: 'Application batch complete · 6 submitted', type: 'SYS' },
];

const VALUE_PROPS = [
  { head: 'While you sleep,', accent: 'we apply.', body: 'Portal applications plus direct outreach to hiring managers, so your application does not simply vanish into an ATS.', tags: ['Direct outreach', 'Pause anytime', 'Runs overnight'] },
  { head: 'Get interviews.', accent: 'Not application fatigue.', body: 'Not five hundred blind applications. The right role, at the right company, at the right time.', tags: ['Quality over quantity', 'Targeted applications'] },
  { head: 'Every new job,', accent: 'as it appears.', body: 'Iris keeps watching company career pages. When a matching role goes up, it goes on your list.', tags: ['Career pages watched', 'Early applicant advantage'] },
  { head: 'Only apply when', accent: 'it’s worth it.', body: 'Iris scores every role against your resume before it spends a credit, and you set the minimum score.', tags: ['Smart matching', 'No wasted credits'] },
  { head: 'Show up tailored,', accent: 'not generic.', body: 'Your resume is tuned to the job description and its keywords, using only your real experience.', tags: ['ATS-ready', 'Cover letters', 'Keyword-matched'] },
  { head: 'Your concierge,', accent: 'around the clock.', body: 'Iris scans, matches, tailors and submits, then leaves you a report of everywhere you were pitched.', tags: ['Daily reports', 'Full activity log'] },
];

const FEATURES: { icon: LucideIcon; label: string; title: string; desc: string }[] = [
  { icon: FileText, label: 'ATS', title: 'ATS-optimised resumes', desc: 'Each resume is rewritten around the keywords and requirements of that specific job.' },
  { icon: Zap, label: 'Portals', title: 'The major portals covered', desc: 'Greenhouse, Lever, Ashby and SmartRecruiters roles flow straight into your feed.' },
  { icon: Send, label: 'Outreach', title: 'Personalised outreach', desc: 'Messages reference the company’s recent work and your own experience, in the tone you pick.' },
  { icon: Moon, label: 'Always on', title: 'Always on', desc: 'A role posted at 2am does not wait for your morning. Early applications get seen first.' },
  { icon: Eye, label: 'Logs', title: 'Full transparency', desc: 'Every application is logged with its resume version, score and current status.' },
];

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Upload, title: 'Upload your resume', desc: 'Iris reads your experience and builds a tailored version for each role.' },
  { icon: SlidersHorizontal, title: 'Set your criteria', desc: 'Target roles, match score, salary floor, company size and blocked companies.' },
  { icon: Link2, title: 'Connect your inbox', desc: 'Replies and verification codes land in your Iris inbox and on the right application.' },
  { icon: Moon, title: 'Wake up to results', desc: 'Applications sent, outreach delivered and your report waiting for you.' },
];

const DIFF = [
  ['Mass-blast your resume to hundreds of jobs', 'Applies only above the match score you set'],
  ['Generic template cover letters', 'Rewrites your resume for each specific role'],
  ['Your application disappears into an ATS', 'Reaches out to the hiring manager as well'],
  ['No idea what happened after applying', 'A full log of each application, score and reply'],
];

const NUMBERS = [
  { value: 750, suffix: 'K+', label: 'jobs live right now' },
  { value: 140, suffix: 'K+', label: 'swipes since March 2026' },
  { value: 39, suffix: 'K+', label: 'applications sent by AI' },
];

const COMPANIES = ['OpenAI', 'Google', 'Meta', 'Apple', 'Amazon', 'Microsoft', 'Anthropic', 'Stripe', 'Vercel', 'Netflix', 'Spotify', 'Figma', 'Notion', 'Airbnb', 'Coinbase', 'Discord', 'Nvidia', 'Shopify', 'Datadog', 'Razorpay', 'Swiggy', 'Flipkart'];
const DOMAINS: Record<string, string> = { Datadog: 'datadoghq.com', Notion: 'notion.so' };
const ATS = ['Greenhouse', 'Lever', 'Ashby', 'SmartRecruiters', 'Company career pages'];

const REPORTS = [
  { company: 'Stripe', role: 'Senior Frontend Engineer', fit: 4.6, ats: 91, bars: [['Skills', 94], ['Experience', 88], ['ATS keywords', 91], ['Role alignment', 87]], keywords: [['React', 1], ['TypeScript', 1], ['GraphQL', 1], ['Design systems', 1], ['Figma', 0]], prep: 'Describe a time you built a component library used across several teams.' },
  { company: 'Google', role: 'SDE-3, Cloud Infrastructure', fit: 4.2, ats: 87, bars: [['Skills', 89], ['Experience', 82], ['ATS keywords', 87], ['Role alignment', 90]], keywords: [['Go', 1], ['Kubernetes', 1], ['gRPC', 1], ['Terraform', 0], ['SRE', 0]], prep: 'Design a distributed task scheduler that handles 1M jobs a day.' },
  { company: 'Anthropic', role: 'ML Engineer', fit: 4.8, ats: 93, bars: [['Skills', 96], ['Experience', 90], ['ATS keywords', 93], ['Role alignment', 94]], keywords: [['Python', 1], ['PyTorch', 1], ['LLMs', 1], ['Transformers', 1], ['JAX', 0]], prep: 'How would you evaluate an LLM for hallucinations at scale?' },
] as const;

const FAQS = [
  { q: 'How is Iris different from other job tools?', a: 'Other tools mass-apply your resume everywhere and hope something sticks. Iris only applies when a role clears the match score you set, and never to companies you block.' },
  { q: 'What exactly does Iris do?', a: 'Upload your resume and tell Iris what you want. It scans openings, ranks them against your profile, tailors your materials, applies and reports back.' },
  { q: 'Where does Iris find jobs?', a: 'Company career pages and the applicant tracking systems behind them, including Greenhouse, Lever, Ashby and SmartRecruiters.' },
  { q: 'Will my applications sound robotic?', a: 'Iris uses your real experience and reshapes it for each role. You choose how far it goes, from your original resume to a stronger tailoring.' },
  { q: 'How many applications does Iris send per day?', a: 'Up to the daily limit you choose in Controls, from 1 to 10. Each one uses a credit.' },
  { q: 'Do I need to upload a resume?', a: 'Yes. Your resume is how Iris understands your strengths and fills in applications. PDF or DOCX both work.' },
  { q: 'Can I see what Iris sent?', a: 'Yes. Every application appears under Applications, and replies land in your Tracker.' },
  { q: 'Which plans include Iris?', a: 'Starter, Pro and Ultra plans bought in the Iris mobile app.' },
];

/** Reveals a section once it scrolls into view. */
function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion() || !('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <section ref={ref} className={`ia-section ia-reveal ${on ? 'on' : ''} ${className}`}>{children}</section>;
}

function useAutoAdvance(count: number, ms: number) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || reduceMotion()) return;
    const t = setTimeout(() => setActive(a => (a + 1) % count), ms);
    return () => clearTimeout(t);
  }, [active, paused, count, ms]);
  return { active, setActive, hover: { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), onFocus: () => setPaused(true), onBlur: () => setPaused(false) }, paused };
}

function CarouselTabs({ labels, active, onPick, ms, paused }: { labels: string[]; active: number; onPick: (i: number) => void; ms: number; paused: boolean }) {
  return (
    <div className="ia-tabs" role="tablist">
      {labels.map((l, i) => (
        <button key={l} role="tab" aria-selected={active === i} className={active === i ? 'on' : ''} onClick={() => onPick(i)}>
          {l}
          {active === i && !paused && <i key={active} style={{ animationDuration: `${ms}ms` }} />}
        </button>
      ))}
    </div>
  );
}

function Terminal() {
  const [lines, setLines] = useState(() => FEED.slice(0, 5).map((l, i) => ({ ...l, id: i })));
  const n = useRef(5);
  useEffect(() => {
    if (reduceMotion()) return;
    const t = setInterval(() => {
      setLines(prev => [...prev.slice(-5), { ...FEED[n.current % FEED.length], id: n.current }]);
      n.current++;
    }, 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ia-term" aria-label="Example of Iris activity">
      <div className="ia-term-bar"><span /><span /><span /><b>iris agent</b><em>sample activity</em></div>
      <div className="ia-term-body" aria-hidden="true">
        {lines.map(l => <div key={l.id} className="ia-term-line"><span className={`ia-tag ${l.type}`}>{l.type}</span>{l.text}</div>)}
        <div className="ia-term-cursor" />
      </div>
    </div>
  );
}

function InboxPreview() {
  const mail = [
    { from: 'Stripe Recruiting', subject: 'Interview request: Senior Frontend Engineer', tag: 'Interview' },
    { from: 'Anthropic Talent', subject: 'Thanks for applying. Next steps inside', tag: 'Reply' },
    { from: 'Vercel Hiring', subject: 'Your application was received', tag: 'Confirmed' },
  ];
  const { active } = useAutoAdvance(mail.length, 2600);
  return (
    <div className="ia-inbox" aria-label="Example of replies arriving in your inbox">
      <div className="ia-inbox-head"><span className="t-overline muted">Your inbox, the next morning</span><span className="t-caption muted">Sample</span></div>
      {mail.map((m, i) => (
        <div key={m.from} className={`ia-mail ${active === i ? 'on' : ''}`}>
          <CompanyLogo name={m.from.split(' ')[0]} size="sm" />
          <div className="grow"><b className="ellipsis">{m.from}</b><span className="ellipsis">{m.subject}</span></div>
          <span className="badge green">{m.tag}</span>
        </div>
      ))}
    </div>
  );
}

function Rise({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLElement>(null);
  const [n, setN] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion() || !('IntersectionObserver' in window)) return;
    setN(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1300);
        setN(Math.round(value * (1 - (1 - p) ** 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <b ref={ref} className="num">{n}{suffix}</b>;
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}><span>{q}</span><ChevronDown size={17} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} /></button>
      {open && <p className="t-callout soft">{a}</p>}
    </div>
  );
}

export function IrisAbout() {
  const vp = useAutoAdvance(VALUE_PROPS.length, 5000);
  const feat = useAutoAdvance(FEATURES.length, 4000);
  const how = useAutoAdvance(STEPS.length, 4500);
  const [report, setReport] = useState(0);
  const prop = VALUE_PROPS[vp.active];
  const feature = FEATURES[feat.active];
  const step = STEPS[how.active];
  const r = REPORTS[report];

  return (
    <div className="ia">
      <section className="ia-lead">
        <div className="ia-lead-copy">
          <h2 className="ia-big">Meet your job agent. <em>It never clocks off.</em></h2>
          <dl className="ia-mini">
            <div><dd>750K+</dd><dt>jobs live</dt></div>
            <div><dd>Your call</dd><dt>minimum match</dt></div>
            <div><dd>1 to 10</dd><dt>applications a day</dt></div>
          </dl>
        </div>
        <Terminal />
      </section>

      <Reveal className="ia-two">
        <InboxPreview />
        <div className="ia-prop" {...vp.hover}>
          <CarouselTabs labels={['Overnight', 'Interviews', 'Instantly', 'Selective', 'Tailored', '24/7']} active={vp.active} onPick={vp.setActive} ms={5000} paused={vp.paused} />
          <div className="ia-prop-card" key={vp.active}>
            <h3>{prop.head} <em>{prop.accent}</em></h3>
            <p>{prop.body}</p>
            <div className="ia-chips">{prop.tags.map(t => <span key={t}>{t}</span>)}</div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="t-overline muted ia-center">Currently watching</div>
        <div className="ia-marquee" aria-label="Companies Iris watches">
          <div className="ia-marquee-track">
            {[...COMPANIES, ...COMPANIES].map((c, i) => <span key={i} aria-hidden={i >= COMPANIES.length} title={c}><CompanyLogo name={c} website={DOMAINS[c]} /></span>)}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="card ia-ats">
          <div>
            <div className="t-overline muted">Where Iris looks</div>
            <h3 className="t-title">Career pages, at the source.</h3>
            <p className="soft">Iris pulls roles from the applicant tracking systems companies post to, so you see them directly instead of through reposts.</p>
          </div>
          <div className="ia-chips big">{ATS.map(a => <span key={a}>{a}</span>)}</div>
        </div>
      </Reveal>

      <Reveal>
        <header className="ia-head"><div className="t-overline muted">Sample Iris report</div><h3 className="t-title">What lands in your report.</h3></header>
        <div className="pill-tabs ia-report-tabs" role="tablist">
          {REPORTS.map((x, i) => <button key={x.company} role="tab" aria-selected={report === i} className={report === i ? 'on' : ''} onClick={() => setReport(i)}>{x.company}</button>)}
        </div>
        <article className="card ia-report" key={r.company}>
          <header>
            <CompanyLogo name={r.company} size="lg" />
            <div className="grow"><b className="t-heading">{r.role}</b><div className="t-caption muted">{r.company} · sample data</div></div>
            <div className="ia-score"><b className="num">{r.ats}</b><span className="t-overline muted">ATS score</span></div>
            <div className="ia-score"><b className="num">{r.fit}</b><span className="t-overline muted">Fit / 5</span></div>
          </header>
          <div className="ia-report-grid">
            <div>{r.bars.map(([label, v]) => <div key={label} className="ia-bar"><span>{label}</span><div><i style={{ width: `${v}%` }} /></div><b className="num">{v}</b></div>)}</div>
            <div>
              <div className="t-overline muted">Keywords</div>
              <div className="ia-kw">{r.keywords.map(([k, hit]) => <span key={k} className={hit ? 'hit' : ''}>{hit ? <Check size={12} /> : <X size={12} />}{k}</span>)}</div>
              <div className="t-overline muted" style={{ marginTop: 18 }}>Interview prep</div>
              <p className="ia-prep">“{r.prep}”</p>
            </div>
          </div>
        </article>
      </Reveal>

      <Reveal className="ia-two">
        <div {...feat.hover}>
          <header className="ia-head"><div className="t-overline muted">Why Iris wins</div><h3 className="t-title">The Iris difference.</h3></header>
          <CarouselTabs labels={FEATURES.map(f => f.label)} active={feat.active} onPick={feat.setActive} ms={4000} paused={feat.paused} />
          <div className="card ia-feature" key={feat.active}><feature.icon size={26} /><h4 className="t-heading">{feature.title}</h4><p className="soft">{feature.desc}</p></div>
        </div>
        <div {...how.hover}>
          <header className="ia-head"><div className="t-overline muted">How it works</div><h3 className="t-title">Four steps to your next offer.</h3></header>
          <CarouselTabs labels={['Upload', 'Criteria', 'Connect', 'Results']} active={how.active} onPick={how.setActive} ms={4500} paused={how.paused} />
          <div className="card ia-feature" key={how.active}><step.icon size={26} /><span className="ia-step-no">0{how.active + 1}</span><h4 className="t-heading">{step.title}</h4><p className="soft">{step.desc}</p></div>
        </div>
      </Reveal>

      <Reveal>
        <header className="ia-head"><div className="t-overline muted">Side by side</div><h3 className="t-title">Others, and Iris.</h3></header>
        <div className="card ia-diff">
          <div className="ia-diff-row head"><span>Others</span><span>Iris</span></div>
          {DIFF.map(([o, i]) => <div key={o} className="ia-diff-row"><span><X size={15} />{o}</span><span><Check size={15} />{i}</span></div>)}
        </div>
      </Reveal>

      <Reveal>
        <header className="ia-head ia-center"><div className="t-overline muted">By the numbers</div></header>
        <div className="ia-numbers">{NUMBERS.map(n => <div key={n.label}><Rise value={n.value} suffix={n.suffix} /><span>{n.label}</span></div>)}</div>
      </Reveal>

      <Reveal>
        <header className="ia-head"><div className="t-overline muted">Questions</div><h3 className="t-title">Everything you need to know about <em>Iris.</em></h3></header>
        <div className="card faq-card">{FAQS.map(f => <Faq key={f.q} {...f} />)}</div>
      </Reveal>
    </div>
  );
}
