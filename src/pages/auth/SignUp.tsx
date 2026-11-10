import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { isValidEmail } from '@web/lib/validate';
import { AuthLayout, OAuthButtons, OrDivider } from './AuthLayout';

export default function SignUp() {
  const { signUpWithEmail } = useAuth();
  const { search } = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name.');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    setBusy(true);
    setError(null);
    const r = await signUpWithEmail(email, password, name);
    setBusy(false);
    if (!r.success) setError(r.error || 'Could not create your account.');
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Your first 10 applications are free. No card needed."
      footer={<>Already have an account? <Link to={`/app/sign-in${search}`} className="link">Sign in</Link></>}
    >
      <OAuthButtons />
      <OrDivider />
      <form className="stack gap-16" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <div className="input-wrap"><User /><input id="name" className="input" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" /></div>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap"><Mail /><input id="email" className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="input-wrap"><Lock /><input id="password" className="input" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
        </div>
        {error && <div className="banner red">{error}</div>}
        <button className="btn lg block" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : 'Create account'}</button>
        <p className="t-caption muted" style={{ textAlign: 'center' }}>
          By continuing you agree to the <a className="link" href="/terms/" target="_blank" rel="noreferrer">Terms</a> and <a className="link" href="/privacy/" target="_blank" rel="noreferrer">Privacy Policy</a>.
        </p>
      </form>
    </AuthLayout>
  );
}
