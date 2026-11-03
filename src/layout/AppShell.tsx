import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layers, Send, Mail, Sparkles, Mic, User, Bookmark, CreditCard, Settings, LifeBuoy, Moon, Sun, Smartphone } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useEntitlements, useFreeSwipes, useUnreadMail } from '@web/lib/queries';
import { Avatar } from '@web/ui/bits';
import { freeSwipesPerCycle } from '@/lib/daily-swipes';
import { getPlanDisplayName } from '@/lib/subscription';

const PRIMARY = [
  { to: '/app/jobs', label: 'Jobs', icon: Layers },
  { to: '/app/applications', label: 'Applications', icon: Send },
  { to: '/app/inbox', label: 'Inbox', icon: Mail, badge: 'mail' as const },
  { to: '/app/iris', label: 'Iris auto-apply', icon: Sparkles },
  { to: '/app/interviews', label: 'Mock interviews', icon: Mic },
  { to: '/app/profile', label: 'Profile', icon: User },
];
const SECONDARY = [
  { to: '/app/saved', label: 'Saved jobs', icon: Bookmark },
  { to: '/app/plans', label: 'Plans & billing', icon: CreditCard },
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/app/help', label: 'Help', icon: LifeBuoy },
];
const TABS = [
  { to: '/app/jobs', label: 'Jobs', icon: Layers },
  { to: '/app/applications', label: 'Applied', icon: Send },
  { to: '/app/inbox', label: 'Inbox', icon: Mail, badge: 'mail' as const },
  { to: '/app/iris', label: 'Iris', icon: Sparkles },
  { to: '/app/profile', label: 'Profile', icon: User },
];

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('iris-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('iris-theme', theme);
  }, [theme]);
  return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') };
}

function CreditsCard() {
  const e = useEntitlements();
  const { data: free } = useFreeSwipes();
  const limit = e.usesCredits ? Math.max(e.creditsRemaining, 1) : freeSwipesPerCycle();
  const left = e.usesCredits ? e.creditsRemaining : (free?.remaining ?? limit);
  const pct = Math.max(0, Math.min(100, (left / Math.max(limit, 1)) * 100));
  return (
    <Link to="/app/plans" className="credit-card">
      <div className="row between">
        <span className="t-caption muted">{e.paid ? `${getPlanDisplayName(e.plan)} plan` : 'Free plan'}</span>
        {!e.paid && <span className="t-caption" style={{ fontWeight: 600, color: 'var(--brand-ink)' }}>Upgrade</span>}
      </div>
      <div className="row gap-6" style={{ marginTop: 6 }}>
        <span className="t-sub num" style={{ fontWeight: 700 }}>{left}</span>
        <span className="t-caption muted">{e.usesCredits ? 'credits left' : 'applications left'}</span>
      </div>
      <div className="meter" style={{ marginTop: 8 }}><span style={{ width: `${pct}%` }} /></div>
    </Link>
  );
}

function DownloadButtons() {
  return (
    <div className="download-btns">
      <a href="https://apps.apple.com/in/app/nextquark/id6761863089" target="_blank" rel="noopener" className="download-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.37 12.62c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.27-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.88-1.28 1.24-2.52 1.26-2.58-.03-.01-2.4-.92-2.42-3.68zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" /></svg>
        App Store
      </a>
      <a href="https://play.google.com/store/apps/details?id=app.rork.hireswipe_v3_clone_ceuofke" target="_blank" rel="noopener" className="download-btn">
        <Smartphone size={14} />
        Google Play
      </a>
    </div>
  );
}

export function AppShell() {
  const { profile } = useAuth();
  const unread = useUnreadMail();
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/app/jobs" className="brand"><img src="/app/logo.png" alt="" />Iris</Link>
          <nav className="nav-group">
            {PRIMARY.map(({ to, label, icon: Icon, badge }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon />{label}
                {badge === 'mail' && unread > 0 && <span className="count">{unread > 99 ? '99+' : unread}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="nav-label t-overline">More</div>
          <nav className="nav-group">
            {SECONDARY.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon />{label}</NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-foot">
          <DownloadButtons />
          <CreditsCard />
          <div className="sidebar-bottom-row">
            <Link to="/app/profile" className="me">
              <Avatar src={profile?.avatar} name={profile?.name} />
              <div className="who">
                <div className="t-callout" style={{ fontWeight: 600 }}>{profile?.name || 'Your profile'}</div>
                <div className="t-caption muted ellipsis">{profile?.email}</div>
              </div>
            </Link>
            <button className="icon-btn theme-toggle" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <header className="topbar">
        <Link to="/app/jobs" className="brand"><img src="/app/logo.png" alt="" />Iris</Link>
        <div className="row gap-4">
          <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/app/saved" className="icon-btn" aria-label="Saved jobs"><Bookmark size={18} /></Link>
          <Link to="/app/settings" className="icon-btn" aria-label="Settings"><Settings size={18} /></Link>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <nav className="tabbar">
        {TABS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon />{label}
            {badge === 'mail' && unread > 0 && <span className="dot" />}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
