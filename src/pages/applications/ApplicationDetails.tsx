import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, Video, Calendar, ExternalLink, MonitorPlay, SearchX, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { Modal } from '@web/ui/Modal';
import { CompanyLogo, Empty, PageLoader, StatusBadge, formatDate, timeAgo } from '@web/ui/bits';
import { supabase } from '@/lib/supabase';
import { mapApplication } from '@web/lib/queries';

const PLATFORM: Record<string, string> = { google_meet: 'Google Meet', zoom: 'Zoom', microsoft_teams: 'Microsoft Teams' };
const DONE = ['completed', 'applied', 'submitted', 'under_review', 'interviewing', 'interview_scheduled', 'offer', 'rejected'];

function parseTimestamps(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') { try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; } }
  return [];
}

export default function ApplicationDetails() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const toast = useToast();
  const [liveOpen, setLiveOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['application', id],
    enabled: !!userId,
    refetchInterval: q => (q.state.data && !DONE.includes(q.state.data.status) ? 5000 : false),
    queryFn: async () => {
      const { data: row } = await supabase.from('live_application_queue').select('*').eq('id', id).eq('user_id', userId!).maybeSingle();
      if (!row) return null;
      const { data: company } = await supabase.from('companies').select('logo_url, website').ilike('name', row.company_name || '').maybeSingle();
      return { ...mapApplication({ ...row, company_logo_url: company?.logo_url ?? null }), website: company?.website ?? null, status: row.status as string };
    },
  });

  useEffect(() => { if (liveOpen) void refetch(); }, [liveOpen, refetch]);

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="page narrow"><Empty icon={SearchX} title="Application not found" action={<Link to="/app/applications" className="btn">All applications</Link>} /></div>;

  const raw = data.raw;
  const stamps = parseTimestamps(raw.progress_timestamps);
  const submitted = DONE.includes(data.status);
  const liveUrl: string | null = raw.live_url || null;

  const copyOtp = async () => {
    if (!data.verificationOtp) return;
    await navigator.clipboard.writeText(data.verificationOtp).catch(() => {});
    toast('Code copied');
  };

  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate(-1)}><ArrowLeft />Applications</button>

      <header className="row gap-16">
        <CompanyLogo name={data.job.companyName} url={data.job.companyLogo} website={data.website} size="lg" />
        <div className="grow">
          <div className="t-callout muted">{data.job.companyName}</div>
          <h1 className="t-title" style={{ marginTop: 2 }}>{data.job.jobTitle}</h1>
        </div>
      </header>

      <dl className="kv card pad" style={{ marginTop: 20 }}>
        <dt>Status</dt><dd><StatusBadge status={data.status} /></dd>
        <dt>Applied</dt><dd>{formatDate(data.appliedDate, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</dd>
        <dt>Applied by</dt><dd>{data.appliedByIris ? 'Iris auto-apply' : 'You'}</dd>
        {data.job.location && <><dt>Location</dt><dd>{data.job.location}</dd></>}
        {raw.job_url && <><dt>Posting</dt><dd><a className="link" href={raw.job_url} target="_blank" rel="noreferrer">Open original posting</a></dd></>}
      </dl>

      {data.verificationOtp && (
        <div className="card pad section otp">
          <div className="t-overline muted">Verification code received</div>
          <div className="row between" style={{ marginTop: 8 }}>
            <span className="otp-code num">{data.verificationOtp}</span>
            <button className="btn secondary sm" onClick={copyOtp}><Copy />Copy</button>
          </div>
          {data.otpReceivedAt && <p className="t-caption muted" style={{ marginTop: 6 }}>Arrived in your Iris inbox {timeAgo(data.otpReceivedAt)}</p>}
        </div>
      )}

      {(data.interviewDate || data.meetingLink) && (
        <div className="card pad section">
          <div className="t-sub">Interview</div>
          <div className="facts" style={{ marginTop: 10 }}>
            {data.interviewDate && <span><Calendar />{formatDate(data.interviewDate, { weekday: 'short', month: 'short', day: 'numeric' })}{data.interviewTime ? ` at ${data.interviewTime}` : ''}</span>}
            {data.meetingPlatform && <span><Video />{PLATFORM[data.meetingPlatform] ?? data.meetingPlatform}</span>}
          </div>
          {data.meetingLink && <a className="btn" style={{ marginTop: 14 }} href={data.meetingLink} target="_blank" rel="noreferrer"><ExternalLink />Join meeting</a>}
        </div>
      )}

      <div className="action-cards section">
        <button className="action-card" onClick={() => setLiveOpen(true)}>
          <MonitorPlay />
          <div>
            <div className="t-sub">{submitted ? 'Replay the application' : 'Watch Iris apply'}</div>
            <div className="t-caption muted">{submitted ? 'See the form as it was filled in' : 'Live view of the form being filled'}</div>
          </div>
          {!submitted && <span className="badge red" style={{ marginLeft: 'auto' }}>Live</span>}
        </button>
        <Link className="action-card" to={`/app/jobs/${raw.job_id}?hideApply=true`}>
          <FileText />
          <div><div className="t-sub">Job description</div><div className="t-caption muted">The full posting</div></div>
        </Link>
      </div>

      <div className="card pad section">
        <div className="t-sub">Progress</div>
        <ol className="timeline">
          <li className="done"><span className="t-callout">Added to the queue</span><span className="t-caption muted">{formatDate(stamps[0] || data.appliedDate, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></li>
          {stamps.length > 1 && <li className="done"><span className="t-callout">Iris started filling the application</span><span className="t-caption muted">{formatDate(stamps[1], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></li>}
          <li className={submitted ? 'done' : 'current'}>
            <span className="t-callout">{submitted ? 'Application submitted' : 'Submitting'}</span>
            {submitted ? <span className="t-caption muted">{formatDate(raw.updated_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span> : <span className="t-caption muted">This usually takes a few minutes</span>}
          </li>
          {data.status === 'interview_scheduled' && <li className="done"><span className="t-callout">Interview invite detected in your inbox</span></li>}
          {data.status === 'offer' && <li className="done"><span className="t-callout">Offer received</span></li>}
        </ol>
      </div>

      <Modal open={liveOpen} onClose={() => setLiveOpen(false)} title={submitted ? 'Application replay' : 'Watching Iris apply'} wide>
        {liveUrl ? (
          <div className="live-frame"><iframe src={liveUrl} title="Live application" allow="fullscreen" /></div>
        ) : submitted ? (
          <Empty icon={CheckCircle2} title="Submitted" body="This application was completed before a recording was available." />
        ) : (
          <div className="empty"><span className="spinner" style={{ width: 22, height: 22 }} /><p className="t-callout">Waiting for the browser session to start. This page checks every few seconds.</p></div>
        )}
      </Modal>
    </div>
  );
}
