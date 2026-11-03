import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MailCheck } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { isValidEmail } from '@web/lib/validate';
import { AuthLayout } from './AuthLayout';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    setBusy(true);
    const r = await resetPassword(email);
    setBusy(false);
    if (!r.success) return setError(r.error || 'Could not send the reset link.');
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle={<>We sent a reset link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. It expires in an hour.</>}
        footer={<Link to="/app/sign-in" className="link">Back to sign in</Link>}>
        <div className="banner green"><MailCheck />Open the link on this device to choose a new password.</div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your account email and we'll send you a link."
      footer={<Link to="/app/sign-in" className="link">Back to sign in</Link>}>
      <form className="stack gap-16" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap"><Mail /><input id="email" className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        </div>
        {error && <div className="banner red">{error}</div>}
        <button className="btn lg block" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : 'Send reset link'}</button>
      </form>
    </AuthLayout>
  );
}
