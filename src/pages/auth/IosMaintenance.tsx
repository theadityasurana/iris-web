import { Link } from 'react-router-dom';
import { AuthLayout } from '@web/pages/auth/AuthLayout';

/** Shown in place of the App Store while the iOS app is under maintenance. */
export default function IosMaintenance() {
  return (
    <AuthLayout
      title="The iOS app is under maintenance"
      subtitle="We're working on the iPhone app and it'll be back soon. Until then, Iris works fully in your browser with the same account."
      showStores={false}
    >
      <Link to="/app/sign-up" className="btn lg block">Continue on web</Link>
    </AuthLayout>
  );
}
