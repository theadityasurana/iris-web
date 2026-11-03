import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Trash2, Mail, Shield, FileText, ExternalLink, ChevronRight, ChevronDown, Smartphone, Moon, Sun } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { Avatar } from '@web/ui/bits';
import { useToast } from '@web/ui/Toast';

const FAQS = [
  { q: 'How does Iris auto-apply work?', a: 'Iris runs overnight (12am–8am) and applies to jobs that match your profile and preferences. It fills in application forms using your resume, cover letter, and profile data. You control the daily limit, minimum match score, and which companies to target or block.' },
  { q: 'What counts as a credit?', a: 'One credit = one job application submitted. Free users get 10 credits per month. Paid plans give 75–500 credits per month depending on your tier. Credits reset at the start of each billing cycle.' },
  { q: 'Can I use the web app and mobile app together?', a: 'Yes — they share the same account and database. Swipes, applications, inbox messages, and profile changes sync instantly between web and mobile.' },
  { q: 'How do mock interviews work?', a: 'You enter a role and optional company name, then join a live voice session with an AI interviewer. After the session, Iris generates a detailed report with scores, feedback, and suggested improvements. Available on Pro and Ultra plans.' },
  { q: 'What is my Iris proxy email?', a: 'Iris creates a @nextquark.in email address for you. When Iris applies to jobs, it uses this address so recruiter replies land in your Iris inbox — not your personal inbox. You can forward replies to your real email in Inbox Settings.' },
  { q: 'How do I cancel my subscription?', a: 'Cancel anytime from the Plans page or through the App Store / Google Play subscription settings. You keep access until the end of your billing period. No refunds for partial months.' },
  { q: 'Why does my profile completion matter?', a: 'A complete profile gives Iris more data to tailor applications. Profiles above 80% get significantly better match scores and higher application success rates.' },
  { q: 'How does the referral program work?', a: 'Share your referral code with friends. When they sign up and complete onboarding, you both get bonus free credits. Find your code on the Profile page.' },
  { q: 'Can I see what Iris submitted on my behalf?', a: 'Yes — every application Iris submits appears in your Applications tab with status tracking. You can also view the Iris report for a summary of auto-apply activity.' },
  { q: 'How do I contact support?', a: 'Email support@nextquark.com. We typically respond within 24 hours on business days.' },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="stack gap-2">
      {FAQS.map((faq, i) => (
        <div key={i} className="card" style={{ overflow: 'hidden' }}>
          <button
            className="list-row"
            style={{ width: '100%', textAlign: 'left', fontWeight: open === i ? 600 : 500 }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="grow t-callout">{faq.q}</span>
            <ChevronDown size={16} className="chev" style={{ transform: open === i ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
          </button>
          {open === i && (
            <div className="t-callout" style={{ padding: '0 16px 14px', color: 'var(--ink-2)', lineHeight: 1.6 }}>{faq.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { profile, profileRow, logout, deleteAccount } = useAuth();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleLogout() {
    if (!confirm('Sign out of your account?')) return;
    setLoggingOut(true);
    await logout();
    navigate('/app/sign-in', { replace: true });
  }

  async function handleDelete() {
    if (!confirm('Permanently delete your account and all data? This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure? This deletes everything.')) return;
    setDeleting(true);
    const { success, error } = await deleteAccount();
    if (!success) { toast(error ?? 'Deletion failed', 'error'); setDeleting(false); return; }
    navigate('/app/sign-in', { replace: true });
  }

  return (
    <div className="page settings-page">
      <div className="settings-layout">
        <div className="settings-main">
          <h1 className="t-title" style={{ marginBottom: 20 }}>Settings</h1>

          {/* Account card */}
          {profile && (
            <div className="card pad" style={{ marginBottom: 16 }}>
              <div className="row gap-14">
                <Avatar src={profile.avatar} name={profile.name} size="lg" />
                <div className="grow">
                  <div className="t-sub">{profile.name}</div>
                  <div className="t-callout muted">{profile.email}</div>
                  {profileRow?.subscription_type && profileRow.subscription_type !== 'free' && (
                    <span className="badge green" style={{ marginTop: 6 }}>{profileRow.subscription_type} plan</span>
                  )}
                </div>
                <Link to="/app/profile" className="btn outline sm">Edit profile</Link>
              </div>
            </div>
          )}

          {/* App settings */}
          <div className="card" style={{ marginBottom: 16 }}>
            <Link to="/app/settings/inbox" className="list-row">
              <Mail size={17} style={{ color: 'var(--ink-2)' }} />
              <span className="grow t-callout">Inbox & forwarding</span>
              <ChevronRight size={16} className="chev" />
            </Link>
            <Link to="/app/plans" className="list-row">
              <FileText size={17} style={{ color: 'var(--ink-2)' }} />
              <span className="grow t-callout">Plans & billing</span>
              <ChevronRight size={16} className="chev" />
            </Link>
          </div>

          {/* Download app */}
          <div className="card pad" style={{ marginBottom: 16 }}>
            <div className="t-callout" style={{ fontWeight: 600, marginBottom: 10 }}>Get the mobile app</div>
            <div className="row gap-8">
              <a href="https://apps.apple.com/in/app/nextquark/id6761863089" target="_blank" rel="noopener" className="btn outline sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Smartphone size={14} />App Store
              </a>
              <a href="https://play.google.com/store/apps/details?id=app.rork.hireswipe_v3_clone_ceuofke" target="_blank" rel="noopener" className="btn outline sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Smartphone size={14} />Google Play
              </a>
            </div>
          </div>

          {/* Legal */}
          <div className="card" style={{ marginBottom: 16 }}>
            <a href="https://irisjobs.live/privacy" target="_blank" rel="noopener" className="list-row">
              <Shield size={17} style={{ color: 'var(--ink-2)' }} />
              <span className="grow t-callout">Privacy Policy</span>
              <ExternalLink size={13} className="chev" />
            </a>
            <a href="https://irisjobs.live/terms" target="_blank" rel="noopener" className="list-row">
              <FileText size={17} style={{ color: 'var(--ink-2)' }} />
              <span className="grow t-callout">Terms of Service</span>
              <ExternalLink size={13} className="chev" />
            </a>
            <a href="mailto:support@nextquark.com" className="list-row">
              <Mail size={17} style={{ color: 'var(--ink-2)' }} />
              <span className="grow t-callout">support@nextquark.com</span>
              <ExternalLink size={13} className="chev" />
            </a>
          </div>

          {/* Sign out — prominent */}
          <button
            className="btn block"
            style={{ marginBottom: 10, background: 'var(--surface-2)', color: 'var(--ink)' }}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={16} />{loggingOut ? 'Signing out…' : 'Sign out'}
          </button>

          <button
            className="btn block danger"
            style={{ marginBottom: 32 }}
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={16} />{deleting ? 'Deleting…' : 'Delete account'}
          </button>

          <p className="t-caption muted" style={{ textAlign: 'center', marginBottom: 32 }}>Iris · irisjobs.live</p>
        </div>

        {/* FAQ column */}
        <div className="settings-faq">
          <h2 className="t-sub" style={{ marginBottom: 16 }}>Help & FAQ</h2>
          <FAQ />
        </div>
      </div>
    </div>
  );
}
