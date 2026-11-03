import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Layers, Send, Mail, Sparkles, Mic, User, Bookmark, CreditCard, Settings, LifeBuoy } from 'lucide-react';
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

function CreditsCard() {
  const e = useEntitlements();
  const { data: free } = useFreeSwipes();
  const limit = e.usesCredits ? Math.max(e.creditsRemaining, 1) : freeSwipesPerCycle();
  const left = e.usesCredits ? e.creditsRemaining : (free?.remaining ?? limit);
  const pct = Math.max(0, Math.min(100, (left / Math.max(limit, 1)) * 100));
  return (
    <Link to="/app/plans" className="credit-card">
      <div className="row">
        <span className="t-caption muted">{e.paid ? `${getPlanDisplayName(e.plan)} plan` : 'Free plan'}</span>
        {!e.paid && <span className="t-caption" style={{ fontWeight: 600 }}>Upgrade</span>}
      </div>
      <div className="row" style={{ marginTop: 6, gap: 6 }}>
        <span className="t-sub num">{left}</span>
        <span className="t-callout muted">{e.usesCredits ? 'credits left' : 'free applications left'}</span>
      </div>
      {!e.usesCredits && <div className="meter"><span style={{ width: `${pct}%` }} /></div>}
    </Link>
  );
}

export function AppShell() {
  const { profile } = useAuth();
  const unread = useUnreadMail();
  const { pathname } = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="shell">
      <aside className="sidebar">
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
        <div className="sidebar-foot">
          <CreditsCard />
          <Link to="/app/profile" className="me">
            <Avatar src={profile?.avatar} name={profile?.name} />
            <div className="who">
              <div className="t-callout" style={{ fontWeight: 600 }}>{profile?.name || 'Your profile'}</div>
              <div className="t-caption muted">{profile?.email}</div>
            </div>
          </Link>
        </div>
      </aside>

      <header className="topbar">
        <Link to="/app/jobs" className="brand"><img src="/app/logo.png" alt="" />Iris</Link>
        <div className="row gap-4">
          <Link to="/app/saved" className="icon-btn" aria-label="Saved jobs"><Bookmark /></Link>
          <Link to="/app/settings" className="icon-btn" aria-label="Settings"><Settings /></Link>
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
