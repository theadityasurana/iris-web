import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { fetchInboxSettings, saveInboxSettings, type InboxSettings } from '@/lib/resend';
import { Switch } from '@web/ui/bits';

export default function InboxSettingsPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [settings, setSettings] = useState<InboxSettings>({ forward_to_email: null, reply_mode: 'in_app' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    if (!userId) return;
    fetchInboxSettings(userId).then(s => { setSettings(s); setLoading(false); });
  }, [userId]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    const ok = await saveInboxSettings(userId, settings);
    setSaving(false);
    showToast(ok ? 'Saved' : 'Failed to save');
  }

  if (loading) return <div className="page narrow"><div className="sk" style={{ height: 200, borderRadius: 16 }} /></div>;

  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate('/app/settings')}><ChevronLeft size={16} />Settings</button>
      <div className="page-head"><h1 className="t-title">Inbox Settings</h1></div>

      <div className="card pad" style={{ marginBottom: 16 }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <div>
            <div className="t-sub">Forward emails</div>
            <div className="t-callout" style={{ color: 'var(--ink-3)' }}>Forward incoming recruiter emails to your personal inbox</div>
          </div>
          <Switch
            checked={settings.reply_mode === 'forward_to_email'}
            onChange={v => setSettings(s => ({ ...s, reply_mode: v ? 'forward_to_email' : 'in_app' }))}
          />
        </div>
        {settings.reply_mode === 'forward_to_email' && (
          <div className="field" style={{ marginTop: 12 }}>
            <label>Forward to email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={settings.forward_to_email ?? ''}
              onChange={e => setSettings(s => ({ ...s, forward_to_email: e.target.value || null }))}
            />
            <span className="hint">Recruiter replies will be forwarded here automatically.</span>
          </div>
        )}
      </div>

      <div className="banner" style={{ marginBottom: 20 }}>
        <span className="grow t-callout">Your Iris inbox address is <strong>@nextquark.in</strong>. Recruiters reply to this address and messages appear in your Iris inbox.</span>
      </div>

      <button className="btn block" disabled={saving} onClick={handleSave}>
        {saving ? <span className="spinner" /> : <Check size={16} />}Save Settings
      </button>

      {toast && <div className="toasts"><div className="toast">{toast}</div></div>}
    </div>
  );
}
