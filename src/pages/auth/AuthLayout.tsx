import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@web/ui/bits';
import { useLocation } from 'react-router-dom';
import { useAuth, APPLE_WEB_ENABLED, type OAuthProvider } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => { document.title = `${title} | Iris`; }, [title]);
  return (
    <div className="auth">
      <div className="auth-form">
        <div className="auth-top">
          <a href="/" className="btn outline sm"><ArrowLeft />Back to home</a>
          <a href="/" className="brand auth-brand"><Logo size={26} />Iris</a>
        </div>
        <div className="auth-body">
          <h1 className="t-title">{title}</h1>
          {subtitle && <p className="t-body muted" style={{ marginTop: 8 }}>{subtitle}</p>}
          <div style={{ marginTop: 28 }}>{children}</div>
        </div>
        {footer && <div className="auth-foot t-callout muted">{footer}</div>}
        <div className="auth-stores">
          <span className="t-overline muted">Or get the app</span>
          <div>
            <a href="https://apps.apple.com/in/app/nextquark/id6761863089" target="_blank" rel="noopener" className="btn outline"><AppleMark />Download on iOS</a>
            <a href="https://play.google.com/store/apps/details?id=app.rork.hireswipe_v3_clone_ceuofke" target="_blank" rel="noopener" className="btn outline"><PlayMark />Get it on Google Play</a>
          </div>
        </div>
      </div>
      <aside className="auth-aside" aria-hidden="true">
        <video src="/media/auth-clouds.mp4" autoPlay muted loop playsInline preload="metadata" poster="/media/auth-clouds-poster.webp" />
        <div className="auth-quote">
          <p className="t-overline">One account, app and web</p>
          <p className="auth-line">Find the job. Iris handles the application.</p>
        </div>
      </aside>
    </div>
  );
}

const PlayMark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 2.2 13.4 12 3.6 21.8c-.36-.2-.6-.6-.6-1.06V3.26c0-.46.24-.86.6-1.06zm13.1 6.5-3.3 3.3 3.3 3.3 3.72-2.12c.73-.42.73-1.47 0-1.88L16.7 8.7zM4.63 2.19 16.7 8.7 13.4 12 3.6 2.2c.3-.17.68-.2 1.03-.01zM16.7 15.3 4.63 21.81c-.35.19-.73.16-1.03-.01L13.4 12l3.3 3.3z" /></svg>
);

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);
const LinkedInMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#0A66C2" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" /></svg>
);
const AppleMark = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.62c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.27-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.88-1.28 1.24-2.52 1.26-2.58-.03-.01-2.4-.92-2.42-3.68zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" /></svg>
);

export function OAuthButtons() {
  const { signInWithOAuth } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const next = new URLSearchParams(location.search).get('next') || '/app/home';

  const go = async (p: OAuthProvider) => {
    setBusy(p);
    const r = await signInWithOAuth(p, next);
    if (!r.success) { toast(r.error || 'Could not start sign in', 'error'); setBusy(null); }
  };

  return (
    <div className="stack gap-8">
      <button className="btn outline lg block" onClick={() => go('google')} disabled={!!busy}>
        {busy === 'google' ? <span className="spinner" /> : <GoogleMark />}Continue with Google
      </button>
      {APPLE_WEB_ENABLED && (
        <button className="btn outline lg block" onClick={() => go('apple')} disabled={!!busy}>
          {busy === 'apple' ? <span className="spinner" /> : <AppleMark />}Continue with Apple
        </button>
      )}
    </div>
  );
}

export function OrDivider() {
  return <div className="or"><span>or</span></div>;
}
