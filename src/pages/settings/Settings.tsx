import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, Eye, EyeOff, LogOut, Mail, Moon, SlidersHorizontal, Smartphone, Sun, Trash2, User, WandSparkles, type LucideIcon } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useFreeSwipes, useEntitlements, useSubscription, useTransactions } from '@web/lib/queries';
import { useWebPlan, webPlanUsable } from '@web/lib/webBilling';
import { ConfirmModal } from '@web/ui/Modal';
import { useToast } from '@web/ui/Toast';
import { Avatar, formatDate } from '@web/ui/bits';
import { getPlanDisplayName } from '@/lib/subscription';

type Sec = 'personal' | 'apply-settings' | 'job-preferences' | 'billing';
const NAV: { key: Sec; label: string; icon: LucideIcon }[] = [
  { key: 'personal', label: 'Personal', icon: User },
  { key: 'apply-settings', label: 'Apply settings', icon: WandSparkles },
  { key: 'job-preferences', label: 'Job preferences', icon: SlidersHorizontal },
  { key: 'billing', label: 'Billing & usage', icon: CreditCard },
];
const STYLES = [
  { value: 'off', label: 'Off', note: 'Sends your resume exactly as uploaded.' },
  { value: 'honest', label: 'Honest', note: 'Reorders and emphasises the experience relevant to each job.' },
  { value: 'aggressive', label: 'Aggressive', note: 'Stretches to match the job requirements as closely as possible.' },
] as const;
const THEME_KEY = 'iris-theme';

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try { const t = localStorage.getItem(THEME_KEY); if (t === 'light' || t === 'dark') return t; } catch { /* private mode */ }
    return 'system';
  });
  useEffect(() => {
    try { if (theme === 'system') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, theme); } catch { /* private mode */ }
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return [theme, setTheme] as const;
}

function Personal() {
  const { profile, email, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [theme, setTheme] = useTheme();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    setDeleting(true);
    const { success, error } = await deleteAccount();
    if (!success) { toast(error ?? 'Deletion failed', 'error'); setDeleting(false); setConfirm(false); return; }
    navigate('/app/sign-in', { replace: true });
  };
  return (
    <>
      <div className="row gap-16" style={{ marginBottom: 20 }}>
        <Avatar src={profile?.avatar} name={profile?.name} size="lg" />
        <div className="grow"><div className="t-overline muted">Full name</div><div className="t-sub" style={{ marginTop: 4 }}>{profile?.name}</div></div>
        <Link to="/app/profile/edit/basic-info" className="btn outline sm">Edit</Link>
      </div>
      <div className="t-overline muted">Login email</div>
      <p style={{ marginTop: 4 }}>{email}</p>
      <p className="t-caption muted">The address you sign in with.</p>

      <section className="p-card" style={{ marginTop: 24 }}>
        <h3 className="p-card-title">Appearance</h3>
        <div className="segmented" role="group" aria-label="Theme" style={{ marginTop: 12 }}>
          <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}><Sun size={14} />Light</button>
          <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}><Moon size={14} />Dark</button>
          <button className={theme === 'system' ? 'on' : ''} onClick={() => setTheme('system')}>System</button>
        </div>
      </section>
      <section className="p-card" style={{ marginTop: 16 }}>
        <h3 className="p-card-title">Get the mobile app</h3>
        <p className="t-callout muted">Same account, same applications.</p>
        <div className="row gap-8 wrap" style={{ marginTop: 12 }}>
          <a className="btn outline sm" href="https://apps.apple.com/in/app/nextquark/id6761863089" target="_blank" rel="noopener"><Smartphone />App Store</a>
          <a className="btn outline sm" href="https://play.google.com/store/apps/details?id=app.rork.hireswipe_v3_clone_ceuofke" target="_blank" rel="noopener"><Smartphone />Google Play</a>
        </div>
      </section>
      <p className="t-caption muted" style={{ marginTop: 20 }}>
        <a className="link" href="https://nextquark.framer.website/privacy" target="_blank" rel="noopener">Privacy</a> · <a className="link" href="https://nextquark.framer.website/terms" target="_blank" rel="noopener">Terms</a> · <a className="link" href="mailto:support@nextquark.com">support@nextquark.com</a>
      </p>
      <ConfirmModal open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} busy={deleting} danger title="Delete your account?" confirmLabel="Delete everything" body="This permanently deletes your Iris account and data on the web and in the app. It can't be undone." />
      <AccountActions onDelete={() => setConfirm(true)} logout={logout} />
    </>
  );
}

function AccountActions({ onDelete, logout }: { onDelete: () => void; logout: () => Promise<void> }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <div className="account-actions">
      <button className="nav-item" disabled={busy} onClick={async () => { setBusy(true); await logout(); navigate('/app/sign-in', { replace: true }); }}><LogOut size={17} />{busy ? 'Signing out…' : 'Sign out'}</button>
      <button className="nav-item danger-text" onClick={onDelete}><Trash2 size={17} />Delete account</button>
    </div>
  );
}

function ApplySettings() {
  const { profileRow, userId, saveProfile, refetchProfile } = useAuth();
  const toast = useToast();
  const [level, setLevel] = useState<string>(profileRow?.resume_optimization_level ?? 'honest');
  const [show, setShow] = useState(false);
  const pick = async (value: typeof STYLES[number]['value']) => {
    const before = level;
    setLevel(value);
    if (!await saveProfile({ resumeOptimizationLevel: value } as any)) { setLevel(before); toast('Could not save. Please try again.', 'error'); } else if (userId) void refetchProfile();
  };
  const email = profileRow?.proxy_email ?? profileRow?.email;
  const password: string = profileRow?.application_password ?? '';
  return (
    <>
      <div className="t-overline muted">Apply style</div>
      <div className="style-switch" role="group" aria-label="Apply style">
        {STYLES.map(s => <button key={s.value} className={level === s.value ? 'on' : ''} aria-pressed={level === s.value} onClick={() => pick(s.value)}>{s.label}</button>)}
      </div>
      <p className="t-callout soft" style={{ marginTop: 8 }}>{STYLES.find(s => s.value === level)?.note}</p>
      <section className="p-card" style={{ marginTop: 24 }}>
        <div className="t-overline muted">Apply email</div>
        <p className="mono-accent">{email}</p>
        <p className="t-callout muted">Applications go out from this address, and replies land in your Tracker.</p>
        <Link to="/app/settings/inbox" className="btn outline sm" style={{ marginTop: 12 }}><Mail />Inbox and forwarding</Link>
        {password && (
          <>
            <div className="t-overline muted" style={{ marginTop: 20 }}>Job board password</div>
            <div className="row gap-8" style={{ marginTop: 8 }}>
              <code className="pw-field grow ellipsis">{show ? password : '•'.repeat(12)}</code>
              <button className="icon-btn" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff /> : <Eye />}</button>
            </div>
            <p className="t-caption muted" style={{ marginTop: 6 }}>One password, used to sign in to gated job boards like Workday.</p>
          </>
        )}
      </section>
    </>
  );
}

function JobPreferences() {
  const { profile } = useAuth();
  const Chips = ({ label, items, to }: { label: string; items?: string[]; to: string }) => (
    <div className="pref-row">
      <div className="row between"><span className="t-overline muted">{label}</span><Link to={to} className="t-caption link">Edit</Link></div>
      <div className="chips" style={{ marginTop: 8 }}>{items?.length ? items.map(i => <span key={i} className="chip static">{i}</span>) : <em className="t-callout muted">Not set</em>}</div>
    </div>
  );
  return (
    <>
      <section className="p-card">
        <div className="t-overline muted">How we match</div>
        <dl className="match-list">
          <div><dt>Title</dt><dd>how close the role is to your targets</dd></div>
          <div><dt>Skills</dt><dd>how many the role asks for</dd></div>
          <div><dt>Location</dt><dd>whether it's where you want to work</dd></div>
          <div><dt>Experience</dt><dd>whether your years fit the band</dd></div>
        </dl>
        <div className="t-overline muted" style={{ marginTop: 18 }}>Score bands</div>
        <div className="bands">
          <div><span>85%+</span><b>Best match</b></div><div><span>70–84%</span><b>Top pick</b></div>
          <div><span>60–69%</span><b>Strong fit</b></div><div><span>Below 60%</span><b>Worth applying</b></div>
        </div>
      </section>
      <Chips label="Target titles" items={profile?.desiredRoles} to="/app/profile/edit/desiredroles" />
      <Chips label="Locations" items={[profile?.location, ...(profile?.preferredCities ?? [])].filter((x): x is string => !!x)} to="/app/profile/edit/preferredcities" />
      <Chips label="Work mode" items={profile?.workModePreferences} to="/app/profile/edit/workmodeprefs" />
      <Chips label="Job type" items={profile?.jobPreferences} to="/app/profile/edit/jobtypeprefs" />
    </>
  );
}

function Billing() {
  const { data: sub } = useSubscription();
  const ent = useEntitlements();
  const { data: free } = useFreeSwipes();
  const { data: web } = useWebPlan();
  const { data: tx = [], isLoading } = useTransactions();
  const active = webPlanUsable(web) ? web : null;
  const planName = active ? getPlanDisplayName(active.plan) : ent.paid ? getPlanDisplayName(ent.plan) : 'Free';
  const used = active ? active.credits_limit - active.credits_remaining : null;
  const appLeft = ent.usesCredits ? ent.creditsRemaining : free?.remaining;
  return (
    <>
      <section className="plan-hero">
        <div className="t-overline muted">Your plan{active ? ` · ${active.period}` : ''}</div>
        <div className="plan-hero-name">{planName}</div>
        <p className="t-callout soft">{active || ent.paid ? 'Thanks for backing Iris.' : 'Upgrade to let your agent apply to more jobs.'}</p>
        {active?.current_period_end && <p className="t-callout soft">{active.status === 'cancelled' ? 'Ends' : 'Renews'} {formatDate(active.current_period_end)}</p>}
        {!active && sub?.subscription_end_date && ent.paid && <p className="t-callout soft">Managed in the mobile app. Renews {formatDate(sub.subscription_end_date)}</p>}
        <Link to="/app/plans" className="btn" style={{ marginTop: 16 }}>{active || ent.paid ? 'View plans' : 'Upgrade'}</Link>
      </section>
      <section className="p-card" style={{ marginTop: 16 }}>
        <div className="t-callout soft" style={{ marginBottom: 10 }}>What’s included</div>
        <ul className="plan-list included">
          <li><Check size={15} />Job feed, search and swipe</li>
          <li><Check size={15} />Applications submitted for you</li>
          <li><Check size={15} />Your own application inbox</li>
          <li><Check size={15} />Application tracking and replies</li>
          {ent.iris && <li><Check size={15} />Iris auto-apply overnight</li>}
        </ul>
      </section>
      <section className="p-card" style={{ marginTop: 16 }}>
        <div className="t-callout soft">Applications this cycle</div>
        {active ? (
          <>
            <div className="usage-big num">{used} of {active.credits_limit} used</div>
            <div className="meter usage-meter"><span style={{ width: `${Math.min(100, (used! / Math.max(active.credits_limit, 1)) * 100)}%` }} /></div>
          </>
        ) : <div className="usage-big num">{appLeft ?? '–'} left</div>}
      </section>
      <section className="p-card" style={{ marginTop: 16 }}>
        <h3 className="t-heading">Billing history</h3>
        <p className="t-callout muted">Recent plan and credit activity from your account.</p>
        {isLoading ? <div className="sk" style={{ height: 56, marginTop: 14, borderRadius: 12 }} /> : tx.length === 0 ? <div className="dashed-empty">Nothing yet.</div> : (
          <div className="list lined" style={{ marginTop: 10 }}>
            {tx.slice(0, 12).map((t: any, i: number) => (
              <div key={t.id ?? i} className="row between gap-12" style={{ padding: '10px 0', borderTop: i ? '1px solid var(--line)' : 0 }}>
                <span className="t-callout ellipsis">{t.description ?? t.type ?? 'Activity'}</span>
                <span className="t-caption muted">{formatDate(t.created_at ?? t.date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const TITLES: Record<Sec, [string, string]> = {
  personal: ['Personal', 'Your own details.'],
  'apply-settings': ['Apply settings', 'How Iris applies on your behalf.'],
  'job-preferences': ['Job preferences', 'What your feed is matched against.'],
  billing: ['Billing & usage', 'What you have used this cycle, and your plan.'],
};

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('s');
  const sec: Sec = NAV.some(n => n.key === raw) ? (raw as Sec) : 'personal';
  return (
    <div className="page">
      <div className="page-head"><div><h1 className="t-title">Account</h1><p>The complete record of every setting on your account.</p></div></div>
      <div className="account-layout">
        <nav className="account-nav" aria-label="Account sections">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`nav-item ${sec === key ? 'active' : ''}`} aria-current={sec === key ? 'page' : undefined} onClick={() => setParams({ s: key }, { replace: true })}><Icon size={17} />{label}</button>
          ))}
        </nav>
        <div className="account-body">
          <h2 className="t-heading">{TITLES[sec][0]}</h2>
          <p className="t-callout soft" style={{ margin: '2px 0 20px' }}>{TITLES[sec][1]}</p>
          {sec === 'personal' && <Personal />}
          {sec === 'apply-settings' && <ApplySettings />}
          {sec === 'job-preferences' && <JobPreferences />}
          {sec === 'billing' && <Billing />}
        </div>
      </div>
    </div>
  );
}
