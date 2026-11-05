import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, ExternalLink, Link2, MessageCircle, ShieldCheck, Unlink } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { CompanyLogo } from '@web/ui/bits';
import { Modal } from '@web/ui/Modal';
import { supabase } from '@/lib/supabase';
import { useIntegrations } from '@web/lib/integrations';

type Tab = 'boards' | 'ats' | 'whatsapp';
const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const enc = encodeURIComponent;

interface Board { id: string; name: string; domain: string; tagline: string; search: (role: string) => string }
const BOARDS: Board[] = [
  { id: 'naukri', name: 'Naukri', domain: 'naukri.com', tagline: 'India’s largest job board', search: r => (r ? `https://www.naukri.com/${slug(r)}-jobs` : 'https://www.naukri.com/') },
  { id: 'foundit', name: 'foundit', domain: 'foundit.in', tagline: 'Formerly Monster India', search: r => `https://www.foundit.in/srp/results?query=${enc(r)}` },
  { id: 'hirist', name: 'Hirist.tech', domain: 'hirist.tech', tagline: 'Tech roles in India', search: () => 'https://www.hirist.tech/' },
  { id: 'iimjobs', name: 'IIMJobs', domain: 'iimjobs.com', tagline: 'Management and senior roles', search: () => 'https://www.iimjobs.com/' },
  { id: 'instahyre', name: 'Instahyre', domain: 'instahyre.com', tagline: 'Curated tech hiring', search: () => 'https://www.instahyre.com/' },
  { id: 'cutshort', name: 'Cutshort', domain: 'cutshort.io', tagline: 'Startup and tech jobs', search: () => 'https://cutshort.io/jobs' },
  { id: 'wellfound', name: 'Wellfound', domain: 'wellfound.com', tagline: 'Startup jobs worldwide', search: () => 'https://wellfound.com/jobs' },
  { id: 'linkedin', name: 'LinkedIn', domain: 'linkedin.com', tagline: 'The professional network', search: r => `https://www.linkedin.com/jobs/search/?keywords=${enc(r)}` },
  { id: 'indeed', name: 'Indeed', domain: 'indeed.com', tagline: 'Global job search', search: r => `https://www.indeed.com/jobs?q=${enc(r)}` },
];

const ATS = [
  { name: 'Greenhouse', domain: 'greenhouse.io' },
  { name: 'Lever', domain: 'lever.co' },
  { name: 'Ashby', domain: 'ashbyhq.com' },
  { name: 'SmartRecruiters', domain: 'smartrecruiters.com' },
  { name: 'Workday', domain: 'workday.com' },
  { name: 'iCIMS', domain: 'icims.com' },
  { name: 'Workable', domain: 'workable.com' },
];

function BoardsTab({ role }: { role: string }) {
  const { store, set } = useIntegrations();
  const toast = useToast();
  const [editing, setEditing] = useState<Board | null>(null);
  const [url, setUrl] = useState('');

  const open = (b: Board) => { setUrl(store[`board:${b.id}`]?.settings?.profile_url ?? ''); setEditing(b); };
  const saveProfile = async () => {
    if (!editing) return;
    const v = url.trim();
    let safe = '';
    if (v) {
      try {
        const u = new URL(v.startsWith('http') ? v : `https://${v}`);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('protocol');
        safe = u.toString();
      } catch { return toast('That doesn’t look like a link.', 'error'); }
    }
    const key = `board:${editing.id}`;
    await set(key, store[key]?.status === 'requested' ? 'requested' : safe ? 'linked' : 'off', { profile_url: safe || undefined });
    setEditing(null);
    toast(safe ? `${editing.name} profile saved` : `${editing.name} profile removed`);
  };
  const request = async (b: Board) => {
    const key = `board:${b.id}`;
    const row = store[key];
    if (row?.status === 'requested') {
      await set(key, row.settings?.profile_url ? 'linked' : 'off', row.settings);
      return toast('Request removed');
    }
    await set(key, 'requested', row?.settings ?? {});
    toast(`We’ll tell you when auto-apply reaches ${b.name}`);
  };

  return (
    <>
      <div className="banner"><ShieldCheck /><span className="grow">Auto-apply on these boards isn’t live yet. Search them from here with your target role, save your profile, and vote for the ones you want next. Iris never asks for your passwords to other sites.</span></div>
      <div className="ig-grid">
        {BOARDS.map(b => {
          const row = store[`board:${b.id}`];
          const requested = row?.status === 'requested';
          const profile = row?.settings?.profile_url;
          return (
            <article key={b.id} className="card ig-card">
              <header>
                <CompanyLogo name={b.name} website={b.domain} />
                <div className="grow"><h3>{b.name}</h3><p className="t-caption muted ellipsis">{b.tagline}</p></div>
                {profile && <span className="badge green"><Check size={11} />Profile saved</span>}
              </header>
              <div className="ig-actions">
                <a className="btn sm" href={b.search(role)} target="_blank" rel="noopener noreferrer"><ExternalLink />{role ? `Search “${role.length > 18 ? `${role.slice(0, 18)}…` : role}”` : 'Open'}</a>
                <button className="btn outline sm" onClick={() => open(b)}><Link2 />{profile ? 'Edit' : 'Add profile'}</button>
                <button className={`btn sm ${requested ? 'secondary' : 'ghost'}`} aria-pressed={requested} onClick={() => request(b)}><Bell />{requested ? 'Requested' : 'Request auto-apply'}</button>
              </div>
            </article>
          );
        })}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Your ${editing.name} profile` : ''}>
        <div className="stack gap-12">
          <p className="t-callout soft">Paste the public link to your profile. Just the link, never your password.</p>
          <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder={editing ? `${editing.domain}/your-profile` : ''} aria-label="Profile link" />
          <button className="btn block" onClick={saveProfile}>Save</button>
        </div>
      </Modal>
    </>
  );
}

function AtsTab() {
  return (
    <>
      <header className="ig-head"><h2 className="t-title">ATS platforms</h2><p className="soft">Iris works with these automatically, with nothing for you to set up.</p></header>
      <div className="ig-grid">
        {ATS.map(a => (
          <article key={a.name} className="card ig-card ig-row">
            <CompanyLogo name={a.name} website={a.domain} />
            <div className="grow"><h3>{a.name}</h3><p className="t-caption muted">Enabled</p></div>
            <Check size={18} className="ig-ok" />
          </article>
        ))}
      </div>
    </>
  );
}

async function whatsappApi(method: 'GET' | 'POST' | 'DELETE') {
  const { data } = await supabase.auth.getSession();
  const res = await fetch('/api/whatsapp/link', { method, headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` } });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || 'Something went wrong. Please try again.');
  return out;
}

function PhoneMock() {
  return (
    <div className="wa-phone" aria-hidden="true">
      <div className="wa-top"><img src="/logo.webp" alt="" width={26} height={26} /><div><b>Iris</b><small>Example conversation</small></div></div>
      <div className="wa-chat">
        <div className="wa-msg me">JOBS</div>
        <div className="wa-msg">Your latest matches:<br /><br /><b>Product Manager</b> at Razorpay<br />Bengaluru<br /><br /><b>Senior Analyst</b> at Swiggy<br />Remote, India</div>
        <div className="wa-msg me">STOP</div>
        <div className="wa-msg">You are disconnected. You will not get any more messages from Iris here.</div>
      </div>
    </div>
  );
}

function WhatsAppTab() {
  const toast = useToast();
  const qc = useQueryClient();
  const { store, set } = useIntegrations();
  const { userId } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp-link', userId],
    queryFn: () => whatsappApi('GET'),
    retry: false,
    refetchInterval: code ? 5000 : false,
  });
  const live = !!data?.live;
  const connected = data?.link?.status === 'connected';
  const requested = store.whatsapp?.status === 'requested';
  useEffect(() => { if (connected) setCode(null); }, [connected]);

  const start = async () => {
    setBusy(true);
    try { setCode((await whatsappApi('POST')).code); }
    catch (e: any) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };
  const disconnect = async () => {
    setBusy(true);
    try { await whatsappApi('DELETE'); qc.invalidateQueries({ queryKey: ['whatsapp-link', userId] }); toast('WhatsApp disconnected'); }
    catch (e: any) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="wa">
      <div className="wa-copy">
        <div className="t-overline muted">{live ? 'WhatsApp' : 'Coming soon'}</div>
        <h2 className="t-display">Your job search, <em>on WhatsApp.</em></h2>
        <p className="soft">Send a message and get your latest matches back, with a link to apply. Reply STOP any time to disconnect.</p>
        {isLoading ? <div className="sk" style={{ height: 54, width: 240, borderRadius: 99, marginTop: 24 }} /> : !live ? (
          <>
            <button className="btn lg" style={{ marginTop: 24 }} aria-pressed={requested} onClick={() => { set('whatsapp', requested ? 'off' : 'requested'); toast(requested ? 'Removed from the list' : 'We’ll tell you when it’s ready'); }}>
              {requested ? <><Check />You’re on the list</> : <><Bell />Notify me</>}
            </button>
            <p className="t-caption muted" style={{ marginTop: 10 }}>WhatsApp isn’t switched on yet. The conversation here is an example.</p>
          </>
        ) : connected ? (
          <div className="wa-state">
            <span className="badge green"><Check size={12} />Connected</span>
            <span className="t-callout soft">+{data.link.wa_phone}</span>
            <button className="btn outline sm" disabled={busy} onClick={disconnect}><Unlink />Disconnect</button>
          </div>
        ) : code ? (
          <div className="wa-code">
            <div className="fc-code num">{code}</div>
            <a className="btn lg block" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${data.number}?text=${enc(`LINK ${code}`)}`}><MessageCircle />Send code on WhatsApp</a>
            <p className="t-caption muted">Valid for 30 minutes. This page updates once we receive it.</p>
          </div>
        ) : (
          <button className="btn lg" style={{ marginTop: 24 }} disabled={busy} onClick={start}><MessageCircle />Connect WhatsApp</button>
        )}
      </div>
      <PhoneMock />
    </div>
  );
}

export default function Integrations() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('boards');
  const role = useMemo(() => profile?.desiredRoles?.[0] ?? '', [profile]);
  return (
    <div className="page ig">
      <div className="page-head">
        <div>
          <h1 className="t-title">Integrations</h1>
          <p>Where Iris finds jobs, where it applies, and where it reaches you.</p>
        </div>
      </div>
      <div className="pill-tabs ig-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'boards'} className={tab === 'boards' ? 'on' : ''} onClick={() => setTab('boards')}>Job boards</button>
        <button role="tab" aria-selected={tab === 'ats'} className={tab === 'ats' ? 'on' : ''} onClick={() => setTab('ats')}>ATS platforms</button>
        <button role="tab" aria-selected={tab === 'whatsapp'} className={tab === 'whatsapp' ? 'on' : ''} onClick={() => setTab('whatsapp')}>WhatsApp</button>
      </div>
      {tab === 'boards' && <BoardsTab role={role} />}
      {tab === 'ats' && <AtsTab />}
      {tab === 'whatsapp' && <WhatsAppTab />}
    </div>
  );
}
