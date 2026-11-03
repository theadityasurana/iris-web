import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { AuthLayout, OAuthButtons, OrDivider } from './AuthLayout';

export default function SignIn() {
  const { signInWithEmail } = useAuth();
  const { search } = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setBusy(true);
    setError(null);
    const r = await signInWithEmail(email, password);
    setBusy(false);
    if (!r.success) setError(r.error || 'Could not sign in.');
  };

  return (
    <AuthLayout
      title="Sign in to Iris"
      subtitle="Use the same account you use in the app."
      footer={<>New to Iris? <Link to={`/app/sign-up${search}`} className="link">Create an account</Link></>}
    >
      <OAuthButtons />
      <OrDivider />
      <form className="stack gap-16" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap"><Mail /><input id="email" className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        </div>
        <div className="field">
          <div className="row between"><label htmlFor="password" className="label">Password</label><Link to="/app/forgot-password" className="t-caption link">Forgot password?</Link></div>
          <div className="input-wrap"><Lock /><input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" /></div>
        </div>
        {error && <div className="banner red">{error}</div>}
        <button className="btn lg block" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : 'Sign in'}</button>
      </form>
    </AuthLayout>
  );
}
