import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQS = [
  { q: 'How does Iris auto-apply work?', a: 'Iris runs overnight (12am–8am) and automatically applies to jobs that match your profile and preferences. It uses your saved resume, cover letter, and portal credentials to submit applications on your behalf.' },
  { q: 'What are application credits?', a: 'Each application submitted (by you or Iris) uses one credit. Credits reset monthly. Free accounts get 10 credits/month; paid plans get 75–500. The website Trial plan gives 30 credits every 14 days.' },
  { q: 'Can I use Iris on both web and mobile?', a: 'Yes. Your account syncs across the Iris web app (irisjobs.live) and the iOS/Android app. Jobs you swipe, applications, and profile data are shared.' },
  { q: 'How do I cancel my subscription?', a: 'Web subscriptions can be cancelled from your Dodo Payments billing portal. Mobile subscriptions are managed through the App Store or Google Play. Your access continues until the end of the billing period.' },
  { q: 'What is my Iris email address?', a: 'When you complete onboarding, Iris creates a @nextquark.in proxy email for you. Recruiters who reply to your applications land in your Iris inbox. You can forward these to your personal email in Inbox Settings.' },
  { q: 'How do I contact support?', a: 'Email support@nextquark.com. We typically respond within 24 hours on business days.' },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--line)' }}>
      <button className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpen(o => !o)}>
        <span className="grow t-callout" style={{ fontWeight: 550 }}>{q}</span>
        <ChevronDown size={16} className="chev" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
      </button>
      {open && <p className="prose" style={{ padding: '0 16px 16px', color: 'var(--ink-2)' }}>{a}</p>}
    </div>
  );
}

export default function Help() {
  const navigate = useNavigate();
  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate('/app/settings')}><ChevronLeft size={16} />Account</button>
      <div className="page-head"><h1 className="t-title">Help & FAQ</h1></div>
      <div className="card" style={{ marginBottom: 24 }}>
        {FAQS.map(f => <FAQ key={f.q} {...f} />)}
      </div>
      <div className="card pad" style={{ textAlign: 'center' }}>
        <div className="t-sub" style={{ marginBottom: 8 }}>Still need help?</div>
        <a href="mailto:support@nextquark.com" className="btn">Email support</a>
      </div>
    </div>
  );
}
