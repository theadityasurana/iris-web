import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { companyLogoCandidates } from '@/lib/jobs';

/** Company logo with the app's provider chain, ending in an initial badge. */
export function CompanyLogo({ name, url, website, size }: { name: string; url?: string | null; website?: string | null; size?: 'sm' | 'lg' }) {
  const candidates = useMemo(() => {
    const list = companyLogoCandidates(name || '', url && url.startsWith('http') ? url : null, website);
    if (url && url.startsWith('http') && !list.includes(url)) list.unshift(url);
    return list;
  }, [name, url, website]);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [candidates]);
  const src = candidates[i];
  return (
    <div className={`logo ${size ?? ''}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" onError={() => setI(n => n + 1)}
          onLoad={e => { const img = e.currentTarget; if (img.naturalWidth <= 16 && i < candidates.length) setI(n => n + 1); }} />
      ) : (
        <span className="initial">{(name || '?').trim().charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export function Avatar({ src, name, size }: { src?: string | null; name?: string; size?: 'lg' | 'xl' }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '·';
  if (!src || failed) return <span className={`avatar initials ${size ?? ''}`}>{initials}</span>;
  return <img className={`avatar ${size ?? ''}`} src={src} alt="" onError={() => setFailed(true)} />;
}

export function Empty({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="ico"><Icon /></div>
      <div className="t-sub">{title}</div>
      {body && <p className="t-callout">{body}</p>}
      {action}
    </div>
  );
}

export function SkeletonRows({ n = 5, h = 64 }: { n?: number; h?: number }) {
  return (
    <div className="stack gap-8">
      {Array.from({ length: n }, (_, i) => <div key={i} className="sk" style={{ height: h, borderRadius: 14 }} />)}
    </div>
  );
}

export function Spinner() { return <span className="spinner" aria-label="Loading" />; }

export function PageLoader() {
  return <div className="full-center" style={{ minHeight: '60vh' }}><span className="spinner" style={{ width: 22, height: 22, color: 'var(--ink-3)' }} /></div>;
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="switch" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span />
    </label>
  );
}

const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'In progress', tone: 'amber' },
  processing: { label: 'In progress', tone: 'amber' },
  failed: { label: 'In progress', tone: 'amber' },
  applied: { label: 'Submitted', tone: 'green' },
  submitted: { label: 'Submitted', tone: 'green' },
  completed: { label: 'Completed', tone: 'green' },
  under_review: { label: 'Under review', tone: 'blue' },
  interviewing: { label: 'Interviewing', tone: 'blue' },
  interview_scheduled: { label: 'Interview scheduled', tone: 'blue' },
  offer: { label: 'Offer received', tone: 'green' },
  rejected: { label: 'Not selected', tone: '' },
  withdrawn: { label: 'Withdrawn', tone: '' },
};

export function statusLabel(status: string) { return STATUS[status]?.label ?? 'In progress'; }

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.pending;
  return <span className={`badge ${s.tone}`}><span className="pip" />{s.label}</span>;
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d > 300 ? 'numeric' : undefined });
}

export function formatDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, opts);
}

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', INR: '₹', EUR: '€', GBP: '£', AED: 'AED ', SGD: 'S$', CAD: 'C$', AUD: 'A$' };

export function formatSalary(min: number, max: number, currency = 'USD', period = 'year', raw?: string): string | null {
  if (!min && !max) return raw || null;
  const sym = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  const fmt = (n: number) => {
    if (currency === 'INR' && n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return String(n);
  };
  const per = period === 'hour' ? '/hr' : period === 'month' ? '/mo' : '/yr';
  return min && max && min !== max ? `${sym}${fmt(min)} – ${sym}${fmt(max)}${per}` : `${sym}${fmt(max || min)}${per}`;
}
