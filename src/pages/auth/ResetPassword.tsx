import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { PageLoader } from '@web/ui/bits';
import { AuthLayout } from './AuthLayout';

/** Landing page for Supabase's password-recovery link (the session comes from the URL). */
export default function ResetPassword() {
  const { session, isLoading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <PageLoader />;
  if (!session) {
    return (
      <AuthLayout title="Link expired" subtitle="This reset link is no longer valid. Request a new one."
        footer={<Link to="/app/sign-in" className="link">Back to sign in</Link>}>
        <Link to="/app/forgot-password" className="btn lg block">Send a new link</Link>
      </AuthLayout>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The passwords don’t match.');
    setBusy(true);
    const r = await updatePassword(password);
    setBusy(false);
    if (!r.success) return setError(r.error || 'Could not update your password.');
    toast('Password updated');
    navigate('/app/jobs', { replace: true });
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="You’ll use it to sign in on the web and in the app.">
      <form className="stack gap-16" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="pw">New password</label>
          <div className="input-wrap"><Lock /><input id="pw" className="input" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></div>
        </div>
        <div className="field">
          <label htmlFor="pw2">Confirm password</label>
          <div className="input-wrap"><Lock /><input id="pw2" className="input" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
        </div>
        {error && <div className="banner red">{error}</div>}
        <button className="btn lg block" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : 'Update password'}</button>
      </form>
    </AuthLayout>
  );
}
