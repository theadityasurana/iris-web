import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Zap, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useEntitlements } from '@web/lib/queries';
import { Switch } from '@web/ui/bits';
import { useToast } from '@web/ui/Toast';
import {
  getIrisEnabled, setIrisEnabled,
  getIrisApplications, getIrisPreferences, saveIrisPreferences,
  DEFAULT_IRIS_PREFS, type IrisPreferences, type SalaryCurrency,
} from '@/lib/iris';
import { timeAgo } from '@web/ui/bits';

const COMPANY_SIZES = ['Any', 'Startup', 'Mid-size', 'Enterprise'] as const;
const TONES = ['Professional', 'Conversational', 'Bold', 'Friendly', 'Assertive', 'Witty'] as const;
const CURRENCIES: SalaryCurrency[] = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD'];
const LOCATIONS = [
  { value: 'india', label: 'India' },
  { value: 'usa', label: 'USA' },
  { value: 'remote', label: 'Remote' },
  { value: 'discover', label: 'Global' },
] as const;

const FEED_LINES = [
  { text: 'Scanning internet for active roles...', type: 'SYS' },
  { text: 'Found 847 new postings in last 2 hours', type: 'SYS' },
  { text: 'Applying → Stripe · Senior Frontend Engineer', type: 'APL' },
  { text: 'Resume tailored · ATS score: 94/100', type: 'SYS' },
  { text: 'Outreach sent → Hiring Manager at Stripe', type: 'OUT' },
  { text: 'Applying → OpenAI · Backend Developer', type: 'APL' },
  { text: 'Scanning Greenhouse, Lever, Ashby portals...', type: 'SYS' },
  { text: 'Match found · Anthropic · ML Engineer · 91%', type: 'SYS' },
  { text: 'Applying → Anthropic · ML Engineer', type: 'APL' },
  { text: 'Resume rewritten for role-specific keywords', type: 'SYS' },
  { text: 'Response received ← Stripe recruiter replied', type: 'OUT' },
  { text: 'Applying → Vercel · Full Stack Developer', type: 'APL' },
  { text: 'Bypassing CAPTCHA · Portal: Workday', type: 'SYS' },
  { text: 'Application submitted successfully', type: 'SYS' },
  { text: 'Applying → Netflix · Product Manager', type: 'APL' },
  { text: 'Cover letter generated · Tone: Professional', type: 'SYS' },
  { text: 'Response received ← OpenAI team responded', type: 'OUT' },
  { text: 'Application batch complete · 6 submitted', type: 'SYS' },
];

const COMPANIES = [
  { name: 'OpenAI', domain: 'openai.com' }, { name: 'Google', domain: 'google.com' },
  { name: 'Meta', domain: 'meta.com' }, { name: 'Apple', domain: 'apple.com' },
  { name: 'Amazon', domain: 'amazon.com' }, { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Anthropic', domain: 'anthropic.com' }, { name: 'Stripe', domain: 'stripe.com' },
  { name: 'Vercel', domain: 'vercel.com' }, { name: 'Netflix', domain: 'netflix.com' },
  { name: 'Spotify', domain: 'spotify.com' }, { name: 'Figma', domain: 'figma.com' },
  { name: 'Notion', domain: 'notion.so' }, { name: 'Airbnb', domain: 'airbnb.com' },
  { name: 'Nvidia', domain: 'nvidia.com' }, { name: 'Shopify', domain: 'shopify.com' },
  { name: 'Razorpay', domain: 'razorpay.com' }, { name: 'Swiggy', domain: 'swiggy.com' },
];

const FAQS = [
  { q: 'How is Iris different from other job tools?', a: 'Other tools mass-apply your resume everywhere. Iris is selective — she only applies when there\'s a genuine fit (85%+). Every application is tailored, timed, and targeted.' },
  { q: 'What exactly does Iris do?', a: 'Iris scans millions of openings daily, ranks them against your profile, customizes your resume and cover letter, and submits applications while you sleep.' },
  { q: 'Where does Iris find jobs?', a: 'Greenhouse, Ashby, Lever, LinkedIn, Indeed, company career pages, and 15+ more ATSes. If a role exists online, Iris finds it.' },
  { q: 'Will my applications sound robotic?', a: 'Never. Iris uses your real experience and rewrites it to match each specific role. She mirrors the job description and highlights what matters most.' },
  { q: 'Will recruiters know I\'m using Iris?', a: 'No. Every application goes through the company\'s actual job portal, just like you\'d do manually. No watermark, no metadata, no trace.' },
  { q: 'How do I cancel?', a: 'Cancel anytime from Plans & Billing or through the App Store / Google Play. You keep access until the end of your billing period.' },
];

function AgentTerminal() {
  const [lines, setLines] = useState<typeof FEED_LINES>([]);
  const [status, setStatus] = useState('Scanning 1.4M jobs across the internet...');
  const [statusIdx, setStatusIdx] = useState(0);
  const idxRef = useRef(0);
  const STATUSES = [
    'Scanning 1.4M jobs across the internet...',
    'Finding roles that match your profile...',
    'Tailoring your resume for each application...',
    'Submitting to company portals...',
    'Sending outreach to hiring managers...',
  ];
  useEffect(() => {
    const t = setInterval(() => {
      setLines(prev => {
        const next = [...prev, FEED_LINES[idxRef.current % FEED_LINES.length]];
        idxRef.current++;
        return next.slice(-20);
      });
    }, 220);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setStatusIdx(i => (i + 1) % STATUSES.length), 3000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { setStatus(STATUSES[statusIdx]); }, [statusIdx]);
  const now = new Date();
  const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  return (
    <div style={{ background: '#0D1117', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginTop: 16 }}>
      <div style={{ background: '#161B22', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 11, color: '#636366', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{status}</span>
      </div>
      <div style={{ padding: 10, height: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#636366', fontFamily: 'monospace', flexShrink: 0 }}>{ts}</span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 4px', borderRadius: 3, flexShrink: 0,
              color: l.type === 'APL' ? '#00FF41' : l.type === 'OUT' ? '#58A6FF' : '#F59E0B',
              background: l.type === 'APL' ? 'rgba(0,255,65,0.1)' : l.type === 'OUT' ? 'rgba(88,166,255,0.1)' : 'rgba(245,158,11,0.1)',
            }}>{l.type}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanyMarquee() {
  const [x, setX] = useState(0);
  const W = COMPANIES.length * 60;
  useEffect(() => {
    let frame: number;
    let pos = 0;
    const tick = () => { pos = (pos + 0.4) % W; setX(pos); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [W]);
  const doubled = [...COMPANIES, ...COMPANIES];
  return (
    <div style={{ overflow: 'hidden', marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 10, transform: `translateX(-${x}px)`, width: doubled.length * 60 }}>
        {doubled.map((c, i) => (
          <div key={i} style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`} alt={c.name} width={26} height={26} style={{ objectFit: 'contain' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--line)' }}>
      <button className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpen(o => !o)}>
        <span className="grow t-callout" style={{ fontWeight: 550 }}>{q}</span>
        <ChevronDown size={15} className="chev" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
      </button>
      {open && <div className="t-callout muted" style={{ padding: '0 16px 14px', lineHeight: 1.6 }}>{a}</div>}
    </div>
  );
}

export default function Iris() {
  const { userId } = useAuth();
  const ent = useEntitlements();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<'controls' | 'about'>('controls');

  const { data: enabled = false } = useQuery({
    queryKey: ['iris-enabled', userId],
    queryFn: () => getIrisEnabled(userId!),
    enabled: !!userId && ent.iris,
  });

  const { data: apps = [] } = useQuery({
    queryKey: ['iris-applications', userId],
    queryFn: () => getIrisApplications(userId!),
    enabled: !!userId && ent.iris && enabled,
    refetchInterval: 30_000,
  });

  const { data: prefs } = useQuery({
    queryKey: ['iris-preferences', userId],
    queryFn: () => getIrisPreferences(userId!),
    enabled: !!userId && ent.iris,
  });

  const [local, setLocal] = useState<IrisPreferences>(DEFAULT_IRIS_PREFS);
  const [saving, setSaving] = useState(false);
  const [watchlistInput, setWatchlistInput] = useState('');
  const [blockedInput, setBlockedInput] = useState('');

  useEffect(() => {
    if (prefs) setLocal({ ...DEFAULT_IRIS_PREFS, ...prefs });
  }, [prefs]);

  const toggleMutation = useMutation({
    mutationFn: (v: boolean) => setIrisEnabled(userId!, v),
    onMutate: (v) => {
      qc.setQueryData(['iris-enabled', userId], v);
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['iris-enabled', userId] });
    },
  });

  const save = async (patch: Partial<IrisPreferences>) => {
    if (!userId) return;
    setSaving(true);
    const merged = { ...local, ...patch };
    setLocal(merged);
    await saveIrisPreferences(userId, patch);
    qc.invalidateQueries({ queryKey: ['iris-preferences', userId] });
    setSaving(false);
    toast('Preferences saved');
  };

  if (!ent.iris) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="t-title">Iris auto-apply</h1>
            <p className="t-callout muted" style={{ marginTop: 4 }}>Your personal job concierge. Applies overnight while you sleep.</p>
          </div>
          <Link to="/app/plans" className="btn brand"><Zap size={15} />Upgrade</Link>
        </div>
        <div className="segmented" style={{ marginBottom: 20 }}>
          <button className={tab === 'controls' ? 'on' : ''} onClick={() => setTab('controls')}>Controls</button>
          <button className={tab === 'about' ? 'on' : ''} onClick={() => setTab('about')}>About Iris</button>
        </div>
        {tab === 'controls' && (
          <>
            <div style={{ padding: '40px 0 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Zap size={24} style={{ color: 'var(--ink-3)' }} />
              </div>
              <div className="t-sub" style={{ marginBottom: 8 }}>Iris auto-apply is locked</div>
              <p className="t-callout muted" style={{ maxWidth: 320, margin: '0 auto 20px' }}>Available on Starter, Pro, and Ultra plans. Upgrade to let Iris apply to jobs overnight on your behalf.</p>
              <Link to="/app/plans" className="btn brand"><Zap size={15} />View plans</Link>
            </div>
            <div className="iris-upsell-grid">
              {[
                { title: 'Applies while you sleep', body: 'Iris runs 12am–8am and submits applications to jobs that match your profile and minimum match score.' },
                { title: 'Fully tailored', body: 'Every application uses your resume, cover letter, and profile data — tailored to the specific job description.' },
                { title: 'You stay in control', body: 'Set a daily limit, minimum match score, watchlist companies to prioritise, and blocked companies to skip.' },
                { title: 'Pause anytime', body: 'Toggle Iris on or off instantly. Pause on weekends, set salary floors, and choose your outreach tone.' },
                { title: 'Full activity report', body: 'See every application Iris submitted, with status tracking and a weekly Iris report.' },
                { title: 'Starter, Pro & Ultra', body: 'Starter: 75 credits/mo · Pro: 200 credits/mo · Ultra: 500 credits/mo. All plans include Iris.' },
              ].map(({ title, body }) => (
                <div key={title} className="card pad">
                  <div className="t-callout" style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
                  <p className="t-caption muted">{body}</p>
                </div>
              ))}
            </div>
          </>
        )}
        {tab === 'about' && (
          <div className="stack gap-20">
            <div>
              <div className="t-overline muted" style={{ marginBottom: 8 }}>LIVE AGENT FEED</div>
              <AgentTerminal />
            </div>
            <div className="card pad">
              <div className="t-overline muted" style={{ marginBottom: 6 }}>WHERE IRIS USERS GET HIRED</div>
              <div className="t-sub" style={{ marginBottom: 4 }}>Your next offer is already out there.</div>
              <p className="t-caption muted" style={{ marginBottom: 0 }}>Iris users have landed roles at some of the most competitive companies in the world.</p>
              <CompanyMarquee />
              <p className="t-caption muted" style={{ marginTop: 10, textAlign: 'center', fontStyle: 'italic' }}>+ 80,000 more companies</p>
            </div>
            <div className="card pad">
              <div className="t-overline muted" style={{ marginBottom: 8 }}>THE IRIS DIFFERENCE</div>
              <div className="stack gap-0">
                {[
                  { others: 'Mass-blast your resume to hundreds of jobs', iris: 'Only applies when there\'s a genuine match (85%+ fit)' },
                  { others: 'Generic template cover letters', iris: 'AI-rewrites your resume for each specific role' },
                  { others: 'Application disappears into ATS', iris: 'Finds and emails the hiring manager directly' },
                  { others: 'No idea what happened after applying', iris: 'Full log of every application, score, and response' },
                ].map((row, i, arr) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : undefined }}>
                    <div className="row gap-6 t-caption" style={{ color: 'var(--ink-4)' }}><span style={{ color: 'var(--danger)', flexShrink: 0 }}>✗</span>{row.others}</div>
                    <div className="row gap-6 t-caption" style={{ color: 'var(--ink-2)' }}><span style={{ color: 'var(--brand-ink)', flexShrink: 0 }}>✓</span>{row.iris}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="t-overline muted" style={{ marginBottom: 8 }}>HOW IT WORKS</div>
              <div className="stack gap-0 card">
                {[
                  { n: '01', title: 'Upload resume', desc: 'AI extracts your experience and builds tailored versions for every role.' },
                  { n: '02', title: 'Set criteria', desc: 'Target roles, salary floors, company sizes, and blocked companies.' },
                  { n: '03', title: 'Enable Iris', desc: 'Toggle on. Iris runs overnight and applies to matching roles.' },
                  { n: '04', title: 'Wake up to results', desc: 'Applications sent, outreach delivered, report waiting in your inbox.' },
                ].map((s, i, arr) => (
                  <div key={i} className="list-row" style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : undefined }}>
                    <span className="t-caption muted" style={{ fontWeight: 700, width: 28, flexShrink: 0 }}>{s.n}</span>
                    <div className="grow">
                      <div className="t-callout" style={{ fontWeight: 600 }}>{s.title}</div>
                      <div className="t-caption muted">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="t-overline muted" style={{ marginBottom: 8 }}>FAQ</div>
              <div className="card">
                {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/app/plans" className="btn brand" style={{ flex: 1, justifyContent: 'center' }}><Zap size={15} />View plans & upgrade</Link>
              <Link to="/app/jobs" className="btn secondary" style={{ flex: 1, justifyContent: 'center' }}>Keep swiping</Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <div className="t-title">Iris auto-apply</div>
          <p className="t-callout muted" style={{ marginTop: 4 }}>Iris applies to matching jobs overnight while you sleep.</p>
        </div>
        <Link to="/app/iris/report" className="btn secondary sm">View report</Link>
      </div>

      {/* Status card */}
      <div className="card pad" style={{ marginBottom: 20 }}>
        <div className="row between gap-12">
          <div className="stack gap-4">
            <div className="row gap-8">
              <span className={`badge ${enabled ? 'green' : ''}`}>
                <span className="pip" />
                {enabled ? 'Active' : 'Paused'}
              </span>
            </div>
            <div className="t-callout muted">
              {enabled ? `Up to ${local.dailyLimit} application${local.dailyLimit !== 1 ? 's' : ''} per day` : 'Enable to auto-apply overnight'}
            </div>
          </div>
          <Switch
            checked={enabled}
            onChange={(v) => toggleMutation.mutate(v)}
            label="Toggle Iris"
          />
        </div>
        {enabled && apps.length > 0 && (
          <div className="stats" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginTop: 16 }}>
            <div className="stat"><div className="v num">{apps.length}</div><div className="k">Applied</div></div>
            <div className="stat"><div className="v num">{local.minMatchScore}%</div><div className="k">Min match</div></div>
            <div className="stat"><div className="v num">{local.watchlist.length || '—'}</div><div className="k">Watchlist</div></div>
            <div className="stat"><div className="v num">{local.blocked.length || '—'}</div><div className="k">Blocked</div></div>
          </div>
        )}
      </div>

      {/* Recent applications */}
      {enabled && apps.length > 0 && (
        <div className="section">
          <div className="section-head"><div className="t-heading">Recent applications</div></div>
          <div className="list card">
            {apps.slice(0, 5).map(app => (
              <div key={app.id} className="list-row">
                <div className="grow stack gap-4">
                  <div className="t-body">{app.job_title}</div>
                  <div className="t-caption muted">{app.company_name}</div>
                </div>
                <div className="t-caption muted">{timeAgo(app.applied_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="section">
        <div className="section-head">
          <div className="t-heading">Preferences</div>
          {saving && <span className="t-caption muted">Saving…</span>}
        </div>

        <div className="stack gap-12">
          {/* Watchlist */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Watchlist</div>
            <div className="t-caption muted" style={{ marginBottom: 10 }}>Auto-apply the moment these companies post</div>
            <div className="chips" style={{ marginBottom: 10 }}>
              {local.watchlist.map(c => (
                <button key={c} className="chip static" onClick={() => save({ watchlist: local.watchlist.filter(x => x !== c) })}>
                  {c} <X size={12} className="x" />
                </button>
              ))}
            </div>
            <div className="row gap-8">
              <input
                className="input"
                placeholder="Add company…"
                value={watchlistInput}
                onChange={e => setWatchlistInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && watchlistInput.trim()) {
                    save({ watchlist: [...local.watchlist, watchlistInput.trim()] });
                    setWatchlistInput('');
                  }
                }}
                style={{ flex: 1 }}
              />
              <button className="btn secondary sm" onClick={() => {
                if (watchlistInput.trim()) {
                  save({ watchlist: [...local.watchlist, watchlistInput.trim()] });
                  setWatchlistInput('');
                }
              }}>Add</button>
            </div>
          </div>

          {/* Blocked */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Blocked companies</div>
            <div className="t-caption muted" style={{ marginBottom: 10 }}>Never apply to these companies</div>
            <div className="chips" style={{ marginBottom: 10 }}>
              {local.blocked.map(c => (
                <button key={c} className="chip static" onClick={() => save({ blocked: local.blocked.filter(x => x !== c) })}>
                  {c} <X size={12} className="x" />
                </button>
              ))}
            </div>
            <div className="row gap-8">
              <input
                className="input"
                placeholder="Block company…"
                value={blockedInput}
                onChange={e => setBlockedInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && blockedInput.trim()) {
                    save({ blocked: [...local.blocked, blockedInput.trim()] });
                    setBlockedInput('');
                  }
                }}
                style={{ flex: 1 }}
              />
              <button className="btn secondary sm" onClick={() => {
                if (blockedInput.trim()) {
                  save({ blocked: [...local.blocked, blockedInput.trim()] });
                  setBlockedInput('');
                }
              }}>Add</button>
            </div>
          </div>

          {/* Min match score */}
          <div className="card pad">
            <div className="row between" style={{ marginBottom: 8 }}>
              <div className="t-sub">Min. match score</div>
              <span className="t-body num">{local.minMatchScore}%</span>
            </div>
            <div className="t-caption muted" style={{ marginBottom: 12 }}>Only apply when fit exceeds this threshold</div>
            <input
              type="range" min={50} max={100} step={5}
              value={local.minMatchScore}
              onChange={e => setLocal(p => ({ ...p, minMatchScore: +e.target.value }))}
              onMouseUp={() => save({ minMatchScore: local.minMatchScore })}
              onTouchEnd={() => save({ minMatchScore: local.minMatchScore })}
              style={{ width: '100%', accentColor: 'var(--ink)' }}
            />
            <div className="row between"><span className="t-caption muted">50%</span><span className="t-caption muted">100%</span></div>
          </div>

          {/* Company size */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Company size</div>
            <div className="segmented">
              {COMPANY_SIZES.map(s => (
                <button key={s} className={local.companySize === s ? 'on' : ''} onClick={() => save({ companySize: s })}>{s}</button>
              ))}
            </div>
          </div>

          {/* Salary floor */}
          <div className="card pad">
            <div className="row between" style={{ marginBottom: 8 }}>
              <div className="t-sub">Salary floor</div>
              <div className="row gap-8">
                <select className="select" style={{ width: 90, height: 32 }} value={local.salaryCurrency} onChange={e => save({ salaryCurrency: e.target.value as SalaryCurrency })}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <span className="t-body num">{local.salaryFloor === 0 ? 'Any' : `${Math.round(local.salaryFloor / 1000)}k`}</span>
              </div>
            </div>
            <div className="t-caption muted" style={{ marginBottom: 12 }}>Skip roles below this amount</div>
            <input
              type="range" min={0} max={500000} step={5000}
              value={local.salaryFloor}
              onChange={e => setLocal(p => ({ ...p, salaryFloor: +e.target.value }))}
              onMouseUp={() => save({ salaryFloor: local.salaryFloor })}
              onTouchEnd={() => save({ salaryFloor: local.salaryFloor })}
              style={{ width: '100%', accentColor: 'var(--ink)' }}
            />
            <div className="row between"><span className="t-caption muted">0</span><span className="t-caption muted">500k</span></div>
          </div>

          {/* Daily limit */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Daily limit</div>
            <div className="segmented">
              {[1, 2, 3, 5, 10].map(n => (
                <button key={n} className={local.dailyLimit === n ? 'on' : ''} onClick={() => save({ dailyLimit: n })}>{n}</button>
              ))}
            </div>
          </div>

          {/* Pause weekends */}
          <div className="card pad">
            <div className="row between">
              <div>
                <div className="t-sub">Pause on weekends</div>
                <div className="t-caption muted">No applications Saturday or Sunday</div>
              </div>
              <Switch checked={local.pauseWeekends} onChange={v => save({ pauseWeekends: v })} />
            </div>
          </div>

          {/* Job locations */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Job locations</div>
            <div className="chips">
              {LOCATIONS.map(({ value, label }) => {
                const on = local.jobLocations.includes(value as any);
                return (
                  <button
                    key={value}
                    className={`chip ${on ? 'on' : ''}`}
                    onClick={() => {
                      const next = on
                        ? local.jobLocations.filter(l => l !== value)
                        : [...local.jobLocations, value as any];
                      save({ jobLocations: (next.length === 0 ? ['india'] : next) as IrisPreferences['jobLocations'] });
                    }}
                  >{label}</button>
                );
              })}
            </div>
          </div>

          {/* Outreach tone */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Outreach tone</div>
            <div className="t-caption muted" style={{ marginBottom: 10 }}>How Iris sounds to hiring managers</div>
            <div className="chips">
              {TONES.map(t => (
                <button key={t} className={`chip ${local.outreachTone === t ? 'on' : ''}`} onClick={() => save({ outreachTone: t })}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
