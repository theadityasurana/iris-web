import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@web/auth/AuthProvider';
import { PageLoader } from '@web/ui/bits';
import { AuthLayout } from './AuthLayout';

/** OAuth redirect target. supabase-js exchanges the ?code= itself (detectSessionInUrl). */
export default function AuthCallback() {
  const { session, isLoading, isOnboardingComplete, profileRow } = useAuth();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const providerError = params.get('error_description') || params.get('error');
  const next = params.get('next');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 12000);
    return () => clearTimeout(t);
  }, []);

  if (providerError || (timedOut && !session)) {
    return (
      <AuthLayout title="Sign in didn’t finish" subtitle={providerError || 'We couldn’t complete sign in. Please try again.'}>
        <Link to="/app/sign-in" className="btn lg block">Back to sign in</Link>
      </AuthLayout>
    );
  }
  if (isLoading || !session || !profileRow) return <PageLoader />;
  const dest = !isOnboardingComplete ? '/app/onboarding' : next && next.startsWith('/app/') ? next : '/app/home';
  return <Navigate to={dest} replace />;
}
