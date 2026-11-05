import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Copy, Mail, MailOpen, Search } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { Empty, SkeletonList, timeAgo } from '@web/ui/bits';
import { ThreadView } from '@web/pages/inbox/Inbox';
import { computeThreadId, fetchInboundEmails, getOrCreateProxyEmail, type InboundEmail } from '@/lib/resend';
import { classifyEmail, type CategoryTab } from '@/lib/mail-classify';

type Stage = 'all' | 'conversation' | 'task' | 'interview' | 'offer' | 'rejected';
const STAGES: { key: Stage; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'conversation', label: 'In conversation' }, { key: 'task', label: 'Task' },
  { key: 'interview', label: 'Interview' }, { key: 'offer', label: 'Offer' }, { key: 'rejected', label: 'Rejected' },
];
const STAGE_OF: Partial<Record<CategoryTab, Stage>> = {
  Primary: 'conversation', Updates: 'conversation', Reminder: 'conversation', Onboarding: 'conversation',
  Assessment: 'task', Interview: 'interview', 'Job Offers': 'offer', Rejection: 'rejected',
};

export default function Tracker() {
  const { userId, profile } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const open = params.get('thread');
  const [stage, setStage] = useState<Stage>('all');
  const [q, setQ] = useState('');

  const { data: proxy = null } = useQuery({
    queryKey: ['proxy-email', userId], enabled: !!userId, staleTime: Infinity,
    queryFn: () => getOrCreateProxyEmail(userId!, profile?.name),
  });
  const { data: mail = [], isLoading } = useQuery({
    queryKey: ['mail', 'tracker', userId], enabled: !!userId, staleTime: 2 * 60_000,
    queryFn: () => fetchInboundEmails(userId!),
  });

  // Only human replies count: promotions, social and OTP mail stay in the Inbox.
  const replies = useMemo(() => mail.filter(m => !m.is_archived).map(data => ({ data, stage: STAGE_OF[classifyEmail({ kind: 'inbound', data })] })).filter((r): r is { data: InboundEmail; stage: Stage } => !!r.stage), [mail]);
  const count = (s: Stage) => s === 'all' ? replies.length : replies.filter(r => r.stage === s).length;
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return replies.filter(r => (stage === 'all' || r.stage === stage) && (!ql || `${r.data.from_name} ${r.data.from_email} ${r.data.subject}`.toLowerCase().includes(ql)));
  }, [replies, stage, q]);
  const select = (id: string | null) => setParams(id ? { thread: id } : {}, { replace: true });

  return (
    <div className="page wide">
      <div className="page-head">
        <div>
          <h1 className="t-title">Tracker</h1>
          <p>Every reply your applications have drawn: interviews, tasks, offers and outcomes.</p>
        </div>
        <div className="input-wrap table-search"><Search /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Company, role, subject" aria-label="Search replies" /></div>
      </div>

      <div className="tracker-top">
        <section className="summary-card">
          <h2 className="t-heading">What came back</h2>
          <div className="summary-stats three">
            <div><b className="num">{count('conversation')}</b><span className="t-overline muted">Active conversations</span></div>
            <div><b className="num">{count('interview')}</b><span className="t-overline muted">Interviews</span></div>
            <div><b className="num">{count('offer')}</b><span className="t-overline muted">Offers</span></div>
          </div>
        </section>
        <section className="card pad inbox-address">
          <div className="row gap-8 t-callout soft"><Mail size={16} />Your application inbox</div>
          <button className="address-copy" disabled={!proxy} onClick={async () => { if (proxy) { await navigator.clipboard.writeText(proxy).catch(() => {}); toast('Address copied'); } }}>
            <span className="ellipsis">{proxy ?? 'Setting up…'}</span><Copy size={15} />
          </button>
          <Link to="/app/inbox" className="btn outline sm" style={{ alignSelf: 'flex-start' }}>Open full inbox</Link>
        </section>
      </div>

      <div className="pill-tabs tracker-tabs" role="group" aria-label="Filter by stage">
        {STAGES.map(s => <button key={s.key} className={stage === s.key ? 'on' : ''} aria-pressed={stage === s.key} onClick={() => setStage(s.key)}>{s.label} <span className="num">{count(s.key)}</span></button>)}
      </div>

      <div className={`card tracker-panes ${open ? 'has-thread' : ''}`}>
        <div className="tracker-list">
          {isLoading ? <SkeletonList n={5} /> : list.length === 0 ? (
            <Empty icon={MailOpen} title={replies.length ? 'Nothing here' : 'No replies yet'} body={replies.length ? undefined : 'When a company writes back, it lands here.'} />
          ) : list.map(({ data: m }) => {
            const id = m.thread_id || computeThreadId(m.subject);
            return (
              <button key={m.id} className={`thread ${!m.is_read ? 'unread' : ''} ${open === id ? 'active' : ''}`} onClick={() => select(id)}>
                <div className="row gap-6">{!m.is_read && <span className="unread-dot" />}<span className="grow ellipsis t-callout who">{m.from_name || m.from_email}</span><time className="t-caption muted">{timeAgo(m.received_at)}</time></div>
                <div className="t-callout ellipsis subj">{m.subject || '(no subject)'}</div>
              </button>
            );
          })}
        </div>
        <div className="tracker-reader">
          {open ? <ThreadView threadId={open} proxy={proxy} onBack={() => select(null)} /> : <div className="reader-empty t-callout muted">Select a thread to read it.</div>}
        </div>
      </div>
    </div>
  );
}
