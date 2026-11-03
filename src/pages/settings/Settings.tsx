import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Trash2, HelpCircle, Mail, Shield, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { Avatar } from '@web/ui/bits';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, logout, deleteAccount } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string, err = false) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  async function handleLogout() {
    if (!confirm('Sign out of your account?')) return;
    setLoggingOut(true);
    await logout();
    navigate('/app/sign-in', { replace: true });
  }

  async function handleDelete() {
    if (!confirm('Permanently delete your account and all data? This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure?')) return;
    setDeleting(true);
    const { success, error } = await deleteAccount();
    if (!success) { showToast(error ?? 'Deletion failed', true); setDeleting(false); return; }
    navigate('/app/sign-in', { replace: true });
  }

  return (
    <div className="page narrow">
      <div className="page-head"><h1 className="t-title">Settings</h1></div>

      {/* Account */}
      {profile && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="list-row">
            <Avatar src={profile.avatar} name={profile.name} />
            <div className="grow">
              <div className="t-sub">{profile.name}</div>
              <div className="t-callout" style={{ color: 'var(--ink-3)' }}>{profile.email}</div>
            </div>
          </div>
        </div>
      )}

      {/* Inbox */}
      <div className="card" style={{ marginBottom: 16 }}>
        <Link to="/app/settings/inbox" className="list-row">
          <Mail size={18} style={{ color: 'var(--ink-2)' }} />
          <span className="grow t-callout">Inbox settings</span>
          <ChevronRight size={16} className="chev" />
        </Link>
      </div>

      {/* Help & legal */}
      <div className="card" style={{ marginBottom: 16 }}>
        <Link to="/app/help" className="list-row">
          <HelpCircle size={18} style={{ color: 'var(--ink-2)' }} />
          <span className="grow t-callout">Help & FAQ</span>
          <ChevronRight size={16} className="chev" />
        </Link>
        <a href="https://irisjobs.live/privacy" target="_blank" rel="noopener noreferrer" className="list-row">
          <Shield size={18} style={{ color: 'var(--ink-2)' }} />
          <span className="grow t-callout">Privacy Policy</span>
          <ExternalLink size={14} className="chev" />
        </a>
        <a href="https://irisjobs.live/terms" target="_blank" rel="noopener noreferrer" className="list-row">
          <FileText size={18} style={{ color: 'var(--ink-2)' }} />
          <span className="grow t-callout">Terms of Service</span>
          <ExternalLink size={14} className="chev" />
        </a>
        <a href="mailto:support@nextquark.com" className="list-row">
          <Mail size={18} style={{ color: 'var(--ink-2)' }} />
          <span className="grow t-callout">Contact support</span>
          <ExternalLink size={14} className="chev" />
        </a>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ marginBottom: 16 }}>
        <button className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={handleLogout} disabled={loggingOut}>
          <LogOut size={18} style={{ color: 'var(--ink-2)' }} />
          <span className="grow t-callout">{loggingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
        <button className="list-row" style={{ width: '100%', textAlign: 'left', color: 'var(--danger)' }} onClick={handleDelete} disabled={deleting}>
          <Trash2 size={18} />
          <span className="grow t-callout">{deleting ? 'Deleting…' : 'Delete account'}</span>
        </button>
      </div>

      <p className="t-callout" style={{ color: 'var(--ink-4)', textAlign: 'center' }}>Iris · irisjobs.live</p>

      {toast && <div className="toasts"><div className={`toast ${toast.includes('fail') || toast.includes('fail') ? 'error' : ''}`}>{toast}</div></div>}
    </div>
  );
}
