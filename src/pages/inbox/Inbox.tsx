import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox as InboxIcon, Star, Send, Archive, PenSquare, Copy, Search, ArrowLeft, Reply, Forward, Trash2, MailOpen, Settings2 } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { Modal, ConfirmModal } from '@web/ui/Modal';
import { Empty, SkeletonRows, Avatar, timeAgo } from '@web/ui/bits';
import { isValidEmail } from '@web/lib/validate';
import {
  getOrCreateProxyEmail, fetchInboundEmails, fetchSentEmails, fetchStarredEmails, fetchThreadMessages,
  computeThreadId, markInboundRead, toggleStarInbound, toggleStarSent, archiveInbound, archiveSent,
  deleteInboundEmail, deleteSentEmail, sendEmailViaResend, forwardEmail, type InboundEmail, type SentEmail,
} from '@/lib/resend';
import { classifyEmail, DEFAULT_CATEGORY_TABS, type CategoryTab, type MailItem } from '@/lib/mail-classify';

type Folder = 'inbox' | 'starred' | 'sent' | 'archived';
const FOLDERS: { key: Folder; label: string; icon: typeof InboxIcon }[] = [
  { key: 'inbox', label: 'Inbox', icon: InboxIcon },
  { key: 'starred', label: 'Starred', icon: Star },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'archived', label: 'Archived', icon: Archive },
];

interface Thread { id: string; latest: MailItem; count: number; unread: boolean; starred: boolean }

const dateOf = (m: MailItem) => (m.kind === 'inbound' ? m.data.received_at : m.data.sent_at);
const threadKey = (m: MailItem) => m.data.thread_id || computeThreadId(m.data.subject);
const who = (m: MailItem) => (m.kind === 'inbound' ? (m.data.from_name || m.data.from_email) : `To: ${m.data.to_email}`);
const snippet = (t?: string | null) => (t || '').replace(/\s+/g, ' ').trim().slice(0, 140);

function groupThreads(items: MailItem[]): Thread[] {
  const map = new Map<string, Thread>();
  for (const m of items) {
    const id = threadKey(m);
    const t = map.get(id);
    const unread = m.kind === 'inbound' && !m.data.is_read;
    const starred = !!m.data.is_starred;
    if (!t) map.set(id, { id, latest: m, count: 1, unread, starred });
    else {
      t.count++;
      t.unread ||= unread;
      t.starred ||= starred;
      if (new Date(dateOf(m)) > new Date(dateOf(t.latest))) t.latest = m;
    }
  }
  return [...map.values()].sort((a, b) => new Date(dateOf(b.latest)).getTime() - new Date(dateOf(a.latest)).getTime());
}

function MailBody({ html, text }: { html?: string | null; text?: string | null }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [h, setH] = useState(200);
  if (!html) return <div className="prose mail-text">{text || '(no content)'}</div>;
  // Sandboxed: no scripts, no same-origin access. Links open in a new tab.
  const doc = `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>body{margin:0;font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1c1c1b;word-break:break-word}img{max-width:100%;height:auto}table{max-width:100%}</style></head><body>${html}</body></html>`;
  return (
    <iframe ref={ref} className="mail-frame" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin" srcDoc={doc} style={{ height: h }} title="Email"
      onLoad={() => { try { const b = ref.current?.contentDocument?.body; if (b) setH(Math.min(4000, b.scrollHeight + 24)); } catch { /* cross-origin */ } }} />
  );
}

function ComposeModal({ open, onClose, from, defaults }: { open: boolean; onClose: () => void; from: string | null; defaults?: { to?: string; subject?: string; forwardId?: string } }) {
  const { userId, profile } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setTo(defaults?.to ?? ''); setSubject(defaults?.subject ?? ''); setBody(''); } }, [open, defaults]);

  const send = async () => {
    if (!from || !userId) return;
    if (!isValidEmail(to)) return toast('Enter a valid recipient', 'error');
    setBusy(true);
    const ok = defaults?.forwardId
      ? await forwardEmail(defaults.forwardId, userId, to.trim(), profile?.name)
      : await sendEmailViaResend(from, to.trim(), subject.trim() || '(no subject)', body, userId, false, undefined, profile?.name);
    setBusy(false);
    if (!ok) return toast('Your message could not be sent', 'error');
    toast(defaults?.forwardId ? 'Forwarded' : 'Sent');
    qc.invalidateQueries({ queryKey: ['mail'] });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={defaults?.forwardId ? 'Forward' : 'New message'} subtitle={from ? `From ${from}` : undefined} wide
      footer={<><button className="btn secondary" onClick={onClose}>Discard</button><button className="btn" onClick={send} disabled={busy || !from}>{busy ? <span className="spinner" /> : <Send />}Send</button></>}>
      <div className="stack gap-12">
        <input className="input" placeholder="To" value={to} onChange={e => setTo(e.target.value)} autoFocus />
        {!defaults?.forwardId && <input className="input" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />}
        {!defaults?.forwardId && <textarea className="textarea" rows={10} placeholder="Write your message" value={body} onChange={e => setBody(e.target.value)} />}
      </div>
    </Modal>
  );
}

function ThreadView({ threadId, proxy, onBack }: { threadId: string; proxy: string | null; onBack: () => void }) {
  const { userId, profile } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [forwardOf, setForwardOf] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: msgs = [], isLoading } = useQuery({
    queryKey: ['mail', 'thread', userId, threadId],
    enabled: !!userId,
    queryFn: () => fetchThreadMessages(userId!, threadId),
  });

  // Opening a thread marks its mail read.
  useEffect(() => {
    const unread = msgs.filter(m => m._kind === 'inbound' && !(m as InboundEmail).is_read);
    if (!unread.length) return;
    Promise.all(unread.map(m => markInboundRead(m.id, true))).then(() => {
      qc.invalidateQueries({ queryKey: ['unread-mail'] });
      qc.invalidateQueries({ queryKey: ['mail', 'list'] });
    });
  }, [msgs, qc]);

  const lastInbound = [...msgs].reverse().find(m => m._kind === 'inbound') as (InboundEmail & { _kind: 'inbound' }) | undefined;
  const subject = msgs[0]?.subject || '(no subject)';
  const starred = msgs.some(m => m.is_starred);
  const refresh = () => { qc.invalidateQueries({ queryKey: ['mail'] }); };

  const toggleStar = async () => {
    await Promise.all(msgs.map(m => (m._kind === 'inbound' ? toggleStarInbound(m.id, !starred) : toggleStarSent(m.id, !starred))));
    refresh();
  };
  const archive = async () => {
    const archived = msgs.every(m => m.is_archived);
    await Promise.all(msgs.map(m => (m._kind === 'inbound' ? archiveInbound(m.id, !archived) : archiveSent(m.id, !archived))));
    toast(archived ? 'Moved to inbox' : 'Archived');
    refresh();
    if (!archived) onBack();
  };
  const remove = async () => {
    await Promise.all(msgs.map(m => (m._kind === 'inbound' ? deleteInboundEmail(m.id) : deleteSentEmail(m.id))));
    setConfirmDelete(false);
    toast('Deleted');
    refresh();
    onBack();
  };
  const sendReply = async () => {
    if (!reply.trim() || !proxy || !lastInbound || !userId) return;
    setSending(true);
    const ok = await sendEmailViaResend(proxy, lastInbound.from_email, `Re: ${subject.replace(/^(Re:\s*)+/i, '')}`, reply.trim(), userId, false, lastInbound.message_id || undefined, profile?.name);
    setSending(false);
    if (!ok) return toast('Your reply could not be sent', 'error');
    setReply('');
    toast('Reply sent');
    refresh();
  };

  return (
    <div className="reader">
      <div className="reader-bar">
        <button className="icon-btn mobile-only" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
        <div className="grow" />
        <button className="icon-btn" onClick={toggleStar} aria-label={starred ? 'Unstar' : 'Star'}><Star fill={starred ? 'currentColor' : 'none'} /></button>
        <button className="icon-btn" onClick={archive} aria-label="Archive"><Archive /></button>
        <button className="icon-btn" onClick={() => setConfirmDelete(true)} aria-label="Delete"><Trash2 /></button>
      </div>
      <h2 className="t-heading reader-subject">{subject}</h2>
      {isLoading ? <SkeletonRows n={2} h={120} /> : (
        <div className="stack gap-12">
          {msgs.map(m => {
            const inbound = m._kind === 'inbound';
            const from = inbound ? ((m as InboundEmail).from_name || (m as InboundEmail).from_email) : 'You';
            return (
              <article key={m.id} className="mail-msg">
                <header className="row gap-12">
                  <Avatar name={from} />
                  <div className="grow">
                    <div className="t-callout" style={{ fontWeight: 600 }}>{from}</div>
                    <div className="t-caption muted ellipsis">{inbound ? (m as InboundEmail).from_email : `to ${(m as SentEmail).to_email}`}</div>
                  </div>
                  <time className="t-caption muted">{timeAgo(inbound ? (m as InboundEmail).received_at : (m as SentEmail).sent_at)}</time>
                  {inbound && <button className="icon-btn" onClick={() => setForwardOf(m.id)} aria-label="Forward"><Forward /></button>}
                </header>
                <div style={{ marginTop: 14 }}>
                  <MailBody html={inbound ? (m as InboundEmail).body_html : null} text={m.body_text} />
                </div>
              </article>
            );
          })}
        </div>
      )}
      {lastInbound && (
        <div className="reply-box">
          <textarea className="textarea" rows={4} placeholder={`Reply to ${lastInbound.from_name || lastInbound.from_email}`} value={reply} onChange={e => setReply(e.target.value)} />
          <div className="row between" style={{ marginTop: 10 }}>
            <span className="t-caption muted">Sent from {proxy}</span>
            <button className="btn" onClick={sendReply} disabled={sending || !reply.trim()}>{sending ? <span className="spinner" /> : <Reply />}Send reply</button>
          </div>
        </div>
      )}
      <ComposeModal open={!!forwardOf} onClose={() => setForwardOf(null)} from={proxy} defaults={forwardOf ? { forwardId: forwardOf } : undefined} />
      <ConfirmModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={remove} title="Delete this conversation?" body="It will be removed from your Iris inbox. This can’t be undone." confirmLabel="Delete" danger />
    </div>
  );
}

export default function Inbox() {
  const { userId, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { threadId } = useParams();
  const openThread = threadId ? decodeURIComponent(threadId) : null;
  const [folder, setFolder] = useState<Folder>('inbox');
  const [category, setCategory] = useState<CategoryTab | 'All'>('All');
  const [q, setQ] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);

  const { data: proxy = null } = useQuery({
    queryKey: ['proxy-email', userId],
    enabled: !!userId,
    staleTime: Infinity,
    queryFn: () => getOrCreateProxyEmail(userId!, profile?.name),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['mail', 'list', userId, folder],
    enabled: !!userId,
    queryFn: async (): Promise<MailItem[]> => {
      if (folder === 'sent') return (await fetchSentEmails(userId!)).filter(m => !m.is_archived).map(d => ({ kind: 'sent', data: d }));
      if (folder === 'starred') {
        const s = await fetchStarredEmails(userId!);
        return [...s.inbound.map(d => ({ kind: 'inbound' as const, data: d })), ...s.sent.map(d => ({ kind: 'sent' as const, data: d }))];
      }
      const inbound = await fetchInboundEmails(userId!);
      return inbound.filter(m => (folder === 'archived' ? m.is_archived : !m.is_archived)).map(d => ({ kind: 'inbound', data: d }));
    },
  });

  const categories = useMemo(() => {
    const counts = new Map<CategoryTab, number>();
    if (folder === 'inbox') for (const m of items) { const c = classifyEmail(m); counts.set(c, (counts.get(c) ?? 0) + 1); }
    return DEFAULT_CATEGORY_TABS.filter(c => counts.has(c)).map(c => ({ c, n: counts.get(c)! }));
  }, [items, folder]);

  const threads = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const filtered = items.filter(m => {
      if (folder === 'inbox' && category !== 'All' && classifyEmail(m) !== category) return false;
      if (!ql) return true;
      const d = m.data as InboundEmail & SentEmail;
      return [d.subject, d.from_email, d.from_name, d.to_email, d.body_text].some(v => (v || '').toLowerCase().includes(ql));
    });
    return groupThreads(filtered);
  }, [items, folder, category, q]);

  const copy = async () => { if (proxy) { await navigator.clipboard.writeText(proxy).catch(() => {}); toast('Address copied'); } };
  const go = (id: string | null) => navigate(id ? `/app/inbox/${encodeURIComponent(id)}` : '/app/inbox');

  return (
    <div className={`mail ${openThread ? 'has-thread' : ''}`}>
      <aside className="mail-folders">
        <button className="btn block" onClick={() => setComposeOpen(true)} disabled={!proxy}><PenSquare />Compose</button>
        <nav className="nav-group" style={{ marginTop: 14 }}>
          {FOLDERS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`nav-item ${folder === key ? 'active' : ''}`} onClick={() => { setFolder(key); setCategory('All'); go(null); }}><Icon />{label}</button>
          ))}
        </nav>
        <div className="proxy-card">
          <div className="t-overline muted">Your Iris address</div>
          <button className="proxy-addr" onClick={copy} title="Copy">{proxy ?? '…'}<Copy size={14} /></button>
          <p className="t-caption muted">Iris applies with this address, so recruiter replies land here.</p>
          <Link to="/app/settings/inbox" className="t-caption link" style={{ display: 'inline-flex', gap: 4, alignItems: 'center', marginTop: 6 }}><Settings2 size={13} />Forwarding</Link>
        </div>
      </aside>

      <section className="mail-list">
        <div className="mail-list-head">
          <div className="mobile-folders segmented">
            {FOLDERS.map(f => <button key={f.key} className={folder === f.key ? 'on' : ''} onClick={() => { setFolder(f.key); setCategory('All'); }}>{f.label}</button>)}
          </div>
          <div className="input-wrap"><Search /><input className="input" placeholder="Search mail" value={q} onChange={e => setQ(e.target.value)} style={{ height: 38 }} /></div>
          {folder === 'inbox' && categories.length > 1 && (
            <div className="cat-tabs">
              <button className={`chip ${category === 'All' ? 'on' : ''}`} onClick={() => setCategory('All')}>All</button>
              {categories.map(({ c, n }) => <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>{c}<span className="num" style={{ opacity: 0.6 }}>{n}</span></button>)}
            </div>
          )}
        </div>
        {isLoading ? <div style={{ padding: 12 }}><SkeletonRows n={7} h={58} /></div> : threads.length === 0 ? (
          <Empty icon={MailOpen} title={q ? 'No matches' : folder === 'inbox' ? 'No mail yet' : `Nothing ${folder === 'sent' ? 'sent' : folder}`}
            body={folder === 'inbox' && !q ? 'Replies from companies you apply to arrive here.' : undefined} />
        ) : (
          <div className="threads">
            {threads.map(t => {
              const d = t.latest.data as InboundEmail & SentEmail;
              return (
                <button key={t.id} className={`thread ${t.unread ? 'unread' : ''} ${openThread === t.id ? 'active' : ''}`} onClick={() => go(t.id)}>
                  <div className="row gap-8">
                    {t.unread && <span className="unread-dot" />}
                    <span className="grow ellipsis t-callout who">{who(t.latest)}{t.count > 1 && <span className="muted"> · {t.count}</span>}</span>
                    {t.starred && <Star size={13} fill="currentColor" className="star" />}
                    <time className="t-caption muted">{timeAgo(dateOf(t.latest))}</time>
                  </div>
                  <div className="t-callout ellipsis subj">{d.subject || '(no subject)'}</div>
                  <div className="t-caption muted ellipsis">{snippet(d.body_text)}</div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mail-reader">
        {openThread ? <ThreadView key={openThread} threadId={openThread} proxy={proxy} onBack={() => go(null)} />
          : <div className="reader-empty"><Empty icon={InboxIcon} title="Select a conversation" body="Pick a message on the left to read it here." /></div>}
      </section>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} from={proxy} />
    </div>
  );
}
