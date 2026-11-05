import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, type ComponentType } from 'react';
import {
  Home, BriefcaseBusiness, Send, Mail, Sparkles, User, Bookmark, CreditCard, Settings, LifeBuoy, Gift,
  PanelLeft, ChevronLeft, ChevronRight, ClipboardList, Menu, X,
} from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useUnreadMail } from '@web/lib/queries';
import { useCredits } from '@web/lib/webBilling';
import { Avatar, Logo } from '@web/ui/bits';

type NavEntry = { to: string; label: string; icon: ComponentType<{ size?: number }>; badge?: 'mail'; end?: boolean };

const WORK: NavEntry[] = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/app/applications', label: 'Applications', icon: ClipboardList },
  { to: '/app/tracker', label: 'Tracker', icon: Send },
  { to: '/app/inbox', label: 'Inbox', icon: Mail, badge: 'mail' },
  { to: '/app/iris', label: 'Iris auto-apply', icon: Sparkles },
];
const YOU: NavEntry[] = [
  { to: '/app/profile', label: 'Profile', icon: User },
  { to: '/app/saved', label: 'Saved jobs', icon: Bookmark },
];
const ACCOUNT: NavEntry[] = [
  { to: '/app/settings', label: 'Account', icon: Settings },
  { to: '/app/plans', label: 'Plans', icon: CreditCard },
  { to: '/app/free-credits', label: 'Free credits', icon: Gift },
  { to: '/app/help', label: 'Help', icon: LifeBuoy },
];
const TABS: NavEntry[] = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/app/applications', label: 'Applied', icon: ClipboardList },
  { to: '/app/inbox', label: 'Inbox', icon: Mail, badge: 'mail' },
];

const TITLES: [RegExp, string][] = [
  [/^\/app\/home/, 'Home'],
  [/^\/app\/jobs\/search/, 'Search'],
  [/^\/app\/jobs/, 'Jobs'],
  [/^\/app\/applications/, 'Applications'],
  [/^\/app\/tracker/, 'Tracker'],
  [/^\/app\/inbox/, 'Inbox'],
  [/^\/app\/iris/, 'Iris auto-apply'],
  [/^\/app\/profile/, 'Profile'],
  [/^\/app\/saved/, 'Saved jobs'],
  [/^\/app\/settings/, 'Account'],
  [/^\/app\/plans/, 'Plans'],
  [/^\/app\/free-credits/, 'Free credits'],
  [/^\/app\/help/, 'Help'],
  [/^\/app\/companies/, 'Company'],
];

const COLLAPSE_KEY = 'iris-sidebar-collapsed';
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

function CreditsPill() {
  const { left, noun } = useCredits();
  return (
    <Link to="/app/plans" className="credits-pill" aria-label={`${left} ${noun} left. View plans`}>
      <span className="credits-num num">{left}</span>
      <span className="credits-label">{noun} left</span>
    </Link>
  );
}

function NavItems({ items, unread, onNavigate }: { items: NavEntry[]; unread: number; onNavigate?: () => void }) {
  return (
    <nav className="nav-group">
      {items.map(({ to, label, icon: Icon, badge }) => (
        <NavLink key={to} to={to} title={label} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icon size={17} />
          <span className="nav-text">{label}</span>
          {badge === 'mail' && unread > 0 && <span className="count">{unread > 99 ? '99+' : unread}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell() {
  const { profile } = useAuth();
  const unread = useUnreadMail();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [moreOpen, setMoreOpen] = useState(false);
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? 'Iris';

  useEffect(() => { window.scrollTo(0, 0); setMoreOpen(false); }, [pathname]);
  useEffect(() => { document.title = `${title} | Iris`; }, [title]);

  const toggleCollapsed = () => setCollapsed(c => {
    try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* private mode */ }
    return !c;
  });

  return (
    <div className={`shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Main">
        <Link to="/app/home" className="brand"><Logo /><span className="nav-text">Iris</span></Link>
        <NavItems items={WORK} unread={unread} />
        <hr className="nav-rule" />
        <NavItems items={YOU} unread={unread} />
        <div className="sidebar-foot">
          <hr className="nav-rule" />
          <NavItems items={ACCOUNT} unread={unread} />
          <button className="nav-item" onClick={toggleCollapsed} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            <span className="nav-text">Collapse</span>
          </button>
          <Link to="/app/profile" className="me" title={profile?.name || 'Your profile'}>
            <Avatar src={profile?.avatar} name={profile?.name} />
            <span className="nav-text ellipsis">{profile?.name || 'Your profile'}</span>
          </Link>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <button className="icon-btn boxed desktop-only" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <PanelLeft size={17} />
          </button>
          <Link to="/app/home" className="brand mobile-only" aria-label="Iris home"><Logo /></Link>
          <span className="topbar-title">{title}</span>
          <CreditsPill />
        </header>
        <main className="main"><Outlet /></main>
      </div>

      <nav className="tabbar" aria-label="Primary">
        {TABS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={21} />{label}
            {badge === 'mail' && unread > 0 && <span className="dot" />}
          </NavLink>
        ))}
        <button className={moreOpen ? 'active' : ''} onClick={() => setMoreOpen(o => !o)} aria-expanded={moreOpen}>
          {moreOpen ? <X size={21} /> : <Menu size={21} />}More
        </button>
      </nav>

      {moreOpen && (
        <div className="more-sheet-wrap" onClick={() => setMoreOpen(false)}>
          <div className="more-sheet" onClick={e => e.stopPropagation()}>
            <NavItems items={[WORK[3], WORK[5], ...YOU, ...ACCOUNT]} unread={unread} onNavigate={() => setMoreOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
