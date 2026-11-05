import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@web/auth/AuthProvider';
import { useRemoteConfigBootstrap } from '@web/lib/queries';
import { AppShell } from '@web/layout/AppShell';
import { PageLoader } from '@web/ui/bits';

const SignIn = lazy(() => import('@web/pages/auth/SignIn'));
const SignUp = lazy(() => import('@web/pages/auth/SignUp'));
const ForgotPassword = lazy(() => import('@web/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@web/pages/auth/ResetPassword'));
const AuthCallback = lazy(() => import('@web/pages/auth/AuthCallback'));
const Onboarding = lazy(() => import('@web/pages/onboarding/Onboarding'));
const FirstJob = lazy(() => import('@web/pages/onboarding/FirstJob'));
const BrowseJobs = lazy(() => import('@web/pages/browse/BrowseJobs'));
const Integrations = lazy(() => import('@web/pages/integrations/Integrations'));

const Home = lazy(() => import('@web/pages/home/Home'));
const Search = lazy(() => import('@web/pages/jobs/Search'));
const Tracker = lazy(() => import('@web/pages/applications/Tracker'));
const Jobs = lazy(() => import('@web/pages/jobs/Jobs'));
const JobDetailsPage = lazy(() => import('@web/pages/jobs/JobDetailsPage'));
const SavedJobs = lazy(() => import('@web/pages/jobs/SavedJobs'));
const CompanyPage = lazy(() => import('@web/pages/jobs/CompanyPage'));
const Applications = lazy(() => import('@web/pages/applications/Applications'));
const ApplicationDetails = lazy(() => import('@web/pages/applications/ApplicationDetails'));
const ApplicationLogs = lazy(() => import('@web/pages/applications/ApplicationLogs'));
const Inbox = lazy(() => import('@web/pages/inbox/Inbox'));
const Iris = lazy(() => import('@web/pages/iris/Iris'));
const IrisReport = lazy(() => import('@web/pages/iris/IrisReport'));
const Profile = lazy(() => import('@web/pages/profile/Profile'));
const EditSection = lazy(() => import('@web/pages/profile/EditSection'));
const Resumes = lazy(() => import('@web/pages/profile/Resumes'));
const ProfilePreview = lazy(() => import('@web/pages/profile/ProfilePreview'));
const Plans = lazy(() => import('@web/pages/plans/Plans'));
const FreeCredits = lazy(() => import('@web/pages/plans/FreeCredits'));
const Settings = lazy(() => import('@web/pages/settings/Settings'));
const Help = lazy(() => import('@web/pages/settings/Help'));
const InboxSettingsPage = lazy(() => import('@web/pages/settings/InboxSettingsPage'));

/** Signed-out users go to sign-in; signed-in users without onboarding go to onboarding. */
function RequireUser({ children }: { children: ReactNode }) {
  const { isLoading, session, isOnboardingComplete, profileRow } = useAuth();
  const location = useLocation();
  if (isLoading || (session && !profileRow)) return <PageLoader />;
  if (!session) return <Navigate to={`/app/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (!isOnboardingComplete) return <Navigate to="/app/onboarding" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isLoading, session, isOnboardingComplete, profileRow } = useAuth();
  const location = useLocation();
  if (isLoading || (session && !profileRow)) return <PageLoader />;
  if (session) {
    const next = new URLSearchParams(location.search).get('next');
    const safeNext = next && next.startsWith('/app/') ? next : '/app/home';
    return <Navigate to={isOnboardingComplete ? safeNext : '/app/onboarding'} replace />;
  }
  return <>{children}</>;
}

const firstJobPending = () => { try { return sessionStorage.getItem('iris_show_first_job') === '1'; } catch { return false; } };

function OnboardingGate({ children }: { children: ReactNode }) {
  const { isLoading, session, isOnboardingComplete, profileRow } = useAuth();
  if (isLoading || (session && !profileRow)) return <PageLoader />;
  if (!session) return <Navigate to="/app/sign-in" replace />;
  if (isOnboardingComplete) return <Navigate to={firstJobPending() ? '/app/first-job' : '/app/home'} replace />;
  return <>{children}</>;
}

export function App() {
  useRemoteConfigBootstrap();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/app/sign-in" element={<GuestOnly><SignIn /></GuestOnly>} />
        <Route path="/app/sign-up" element={<GuestOnly><SignUp /></GuestOnly>} />
        <Route path="/app/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
        <Route path="/app/reset-password" element={<ResetPassword />} />
        <Route path="/app/auth/callback" element={<AuthCallback />} />
        <Route path="/app/onboarding" element={<OnboardingGate><Onboarding /></OnboardingGate>} />

        <Route path="/app/first-job" element={<RequireUser><FirstJob /></RequireUser>} />

        <Route element={<RequireUser><AppShell /></RequireUser>}>
          <Route path="/app/home" element={<Home />} />
          <Route path="/app/jobs" element={<Jobs />} />
          <Route path="/app/browse" element={<BrowseJobs />} />
          <Route path="/app/integrations" element={<Integrations />} />
          <Route path="/app/jobs/search" element={<Search />} />
          <Route path="/app/tracker" element={<Tracker />} />
          <Route path="/app/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/app/saved" element={<SavedJobs />} />
          <Route path="/app/companies/:name" element={<CompanyPage />} />
          <Route path="/app/applications" element={<Applications />} />
          <Route path="/app/applications/logs" element={<ApplicationLogs />} />
          <Route path="/app/applications/:id" element={<ApplicationDetails />} />
          <Route path="/app/inbox" element={<Inbox />} />
          <Route path="/app/inbox/:threadId" element={<Inbox />} />
          <Route path="/app/iris" element={<Iris />} />
          <Route path="/app/iris/report" element={<IrisReport />} />
          <Route path="/app/profile" element={<Profile />} />
          <Route path="/app/profile/edit/:section" element={<EditSection />} />
          <Route path="/app/resumes" element={<Resumes />} />
          <Route path="/app/profile/resumes" element={<Navigate to="/app/resumes" replace />} />
          <Route path="/app/profile/preview" element={<ProfilePreview />} />
          <Route path="/app/plans" element={<Plans />} />
          <Route path="/app/free-credits" element={<FreeCredits />} />
          <Route path="/app/settings" element={<Settings />} />
          <Route path="/app/settings/inbox" element={<InboxSettingsPage />} />
          <Route path="/app/help" element={<Help />} />
        </Route>

        <Route path="/app" element={<Navigate to="/app/home" replace />} />
        <Route path="*" element={<Navigate to="/app/home" replace />} />
      </Routes>
    </Suspense>
  );
}
