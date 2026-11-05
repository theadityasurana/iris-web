import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, type ComponentType } from 'react';
import {
  Home, BriefcaseBusiness, Send, Mail, Sparkles, User, Bookmark, CreditCard, Settings, LifeBuoy, Gift,
  PanelLeft, ChevronLeft, ChevronRight, ClipboardList, Menu, X, Moon, Sun, LogOut, Compass, Plug, FileText,
} from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useUnreadMail } from '@web/lib/queries';
import { useCredits } from '@web/lib/webBilling';
import { Avatar, Logo } from '@web/ui/bits';
import { FirstApplyShow } from '@web/pages/jobs/FirstApplyShow';

type NavEntry = { to: string; label: string; icon: ComponentType<{ size?: number }>; badge?: 'mail'; end?: boolean };

const WORK: NavEntry[] = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/app/browse', label: 'Browse all jobs', icon: Compass },
  { to: '/app/applications', label: 'Applications', icon: ClipboardList },
  { to: '/app/tracker', label: 'Tracker', icon: Send },
  { to: '/app/inbox', label: 'Inbox', icon: Mail, badge: 'mail' },
  { to: '/app/iris', label: 'Iris auto-apply', icon: Sparkles },
];
const YOU: NavEntry[] = [
  { to: '/app/profile', label: 'Profile', icon: User },
  { to: '/app/resumes', label: 'Resume manager', icon: FileText },
  { to: '/app/saved', label: 'Saved jobs', icon: Bookmark },
  { to: '/app/integrations', label: 'Integrations', icon: Plug },
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
  [/^\/app\/browse/, 'Browse all jobs'],
  [/^\/app\/integrations/, 'Integrations'],
  [/^\/app\/jobs\/search/, 'Search'],
  [/^\/app\/jobs/, 'Jobs'],
  [/^\/app\/applications/, 'Applications'],
  [/^\/app\/tracker/, 'Tracker'],
  [/^\/app\/inbox/, 'Inbox'],
  [/^\/app\/iris/, 'Iris auto-apply'],
  [/^\/app\/resumes/, 'Resume manager'],
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

const APP_STORE = 'https://apps.apple.com/in/app/nextquark/id6761863089';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=app.rork.hireswipe_v3_clone_ceuofke';

function AppleMark() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.37 12.62c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.27-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.88-1.28 1.24-2.52 1.26-2.58-.03-.01-2.4-.92-2.42-3.68zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" /></svg>;
}
function PlayMark() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 2.2 13.4 12 3.6 21.8c-.36-.2-.6-.6-.6-1.06V3.26c0-.46.24-.86.6-1.06zm13.1 6.5-3.3 3.3 3.3 3.3 3.72-2.12c.73-.42.73-1.47 0-1.88L16.7 8.7zM4.63 2.19 16.7 8.7 13.4 12 3.6 2.2c.3-.17.68-.2 1.03-.01zM16.7 15.3 4.63 21.81c-.35.19-.73.16-1.03-.01L13.4 12l3.3 3.3z" /></svg>;
}

function GetTheApp() {
  return (
    <div className="get-app">
      <div className="get-app-label nav-text">Get the mobile app</div>
      <div className="get-app-btns">
        <a href={APP_STORE} target="_blank" rel="noopener" className="get-app-btn" title="Download on the App Store" aria-label="Download on the App Store"><AppleMark /><span className="nav-text">App Store</span></a>
        <a href={PLAY_STORE} target="_blank" rel="noopener" className="get-app-btn" title="Get it on Google Play" aria-label="Get it on Google Play"><PlayMark /><span className="nav-text">Google Play</span></a>
      </div>
    </div>
  );
}

type Theme = 'light' | 'dark';
function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('iris-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* private mode */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const toggle = () => setTheme(current => {
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('iris-theme', next); } catch { /* private mode */ }
    return next;
  });
  return { theme, toggle };
}

function ThemeAndSignOut({ theme, onToggle, onSignOut, busy }: { theme: Theme; onToggle: () => void; onSignOut: () => void; busy: boolean }) {
  const dark = theme === 'dark';
  return (
    <>
      <button className="nav-item" onClick={onToggle} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={dark}>
        {dark ? <Sun size={17} /> : <Moon size={17} />}
        <span className="nav-text">{dark ? 'Light mode' : 'Dark mode'}</span>
      </button>
      <button className="nav-item" onClick={onSignOut} disabled={busy} title="Sign out">
        <LogOut size={17} />
        <span className="nav-text">{busy ? 'Signing out…' : 'Sign out'}</span>
      </button>
    </>
  );
}

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
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const signOut = async () => {
    setSigningOut(true);
    try { await logout(); navigate('/app/sign-in', { replace: true }); }
    finally { setSigningOut(false); }
  };
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
          <GetTheApp />
          <hr className="nav-rule" />
          <NavItems items={ACCOUNT} unread={unread} />
          <ThemeAndSignOut theme={theme} onToggle={toggleTheme} onSignOut={signOut} busy={signingOut} />
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
            <NavItems items={[WORK[2], WORK[4], WORK[6], ...YOU, ...ACCOUNT]} unread={unread} onNavigate={() => setMoreOpen(false)} />
            <hr className="nav-rule" />
            <ThemeAndSignOut theme={theme} onToggle={toggleTheme} onSignOut={signOut} busy={signingOut} />
            <GetTheApp />
          </div>
        </div>
      )}
      <FirstApplyShow />
    </div>
  );
}
