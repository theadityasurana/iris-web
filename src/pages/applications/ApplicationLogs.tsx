import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { useApplications } from '@web/lib/queries';
import { Empty, SkeletonRows, statusLabel } from '@web/ui/bits';

type Entry = { at: string; appId: string; text: string; tone: 'info' | 'ok' | 'warn' };

function stamps(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') { try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; } }
  return [];
}

/** A real activity log, built only from what the queue rows record. */
export default function ApplicationLogs() {
  const navigate = useNavigate();
  const { data: apps = [], isLoading } = useApplications();

  const entries = useMemo(() => {
    const out: Entry[] = [];
    for (const a of apps) {
      const r = a.raw;
      const label = `${a.job.jobTitle} at ${a.job.companyName}`;
      out.push({ at: a.appliedDate, appId: a.id, text: `Queued ${label}${a.appliedByIris ? ' (Iris auto-apply)' : ''}`, tone: 'info' });
      stamps(r.progress_timestamps).slice(1).forEach((t, i) => out.push({ at: t, appId: a.id, text: `${label}: step ${i + 1} completed`, tone: 'info' }));
      if (r.otp_received_at) out.push({ at: r.otp_received_at, appId: a.id, text: `${label}: verification code received`, tone: 'warn' });
      if (a.status !== 'pending' && a.status !== 'processing' && r.updated_at) {
        out.push({ at: r.updated_at, appId: a.id, text: `${label}: ${statusLabel(a.status).toLowerCase()}`, tone: 'ok' });
      }
    }
    return out.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime()).slice(0, 300);
  }, [apps]);

  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate(-1)}><ArrowLeft />Applications</button>
      <div className="page-head"><div><h1 className="t-title">Activity log</h1><p className="t-body muted">Every recorded event across your applications, newest first.</p></div></div>
      {isLoading ? <SkeletonRows n={8} h={40} /> : entries.length === 0 ? (
        <Empty icon={ScrollText} title="No activity yet" body="Apply to a job and its progress is logged here." />
      ) : (
        <div className="log card">
          {entries.map((e, i) => (
            <Link key={i} to={`/app/applications/${e.appId}`} className={`log-row ${e.tone}`}>
              <time className="num">{new Date(e.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
              <span>{e.text}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
