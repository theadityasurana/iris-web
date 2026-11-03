import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Mic, ChevronRight, Clock } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useEntitlements } from '@web/lib/queries';
import { SkeletonRows, formatDate, timeAgo } from '@web/ui/bits';
import { getInterviewSessions } from '@/lib/livekit';

export default function Interviews() {
  const { userId } = useAuth();
  const ent = useEntitlements();
  const [params] = useSearchParams();
  const prefillRole = params.get('role') ?? '';
  const prefillCompany = params.get('company') ?? '';

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['interview-sessions', userId],
    queryFn: () => getInterviewSessions(userId!),
    enabled: !!userId && ent.interviewsPerMonth > 0,
  });

  if (ent.interviewsPerMonth === 0) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="t-title">Mock interviews</h1>
            <p className="t-callout muted" style={{ marginTop: 4 }}>Practice with a real-time AI interviewer before the real thing.</p>
          </div>
          <Link to="/app/plans" className="btn brand"><Mic size={15} />Upgrade</Link>
        </div>
        <div className="iris-upsell-grid">
          {[
            { title: 'Real-time voice interviewer', body: 'Join a live voice session with an AI interviewer. It asks real questions, listens to your answers, and follows up — just like a real interview.' },
            { title: 'Choose your interviewer style', body: 'Pick from Professional, Warm & Friendly, Tough Interviewer, or Technical Lead. Each has a different tone and question style.' },
            { title: 'Detailed performance report', body: 'After each session, Iris generates a report with scores across communication, technical depth, and confidence — with specific suggestions to improve.' },
            { title: 'Practice for any role', body: 'Enter any job title and optional company name. Iris tailors the questions to that specific role and seniority level.' },
            { title: 'Full session history', body: 'Every past session is saved with its transcript and report. Review your progress over time.' },
            { title: 'Available on Pro & Ultra', body: 'Pro plan: 10 mock interviews per month. Ultra plan: unlimited. Upgrade to start practising today.' },
          ].map(({ title, body }) => (
            <div key={title} className="card pad">
              <div className="t-callout" style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
              <p className="t-caption muted">{body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
          <Link to="/app/plans" className="btn brand" style={{ flex: 1, justifyContent: 'center' }}><Mic size={15} />View plans & upgrade</Link>
          <Link to="/app/jobs" className="btn secondary" style={{ flex: 1, justifyContent: 'center' }}>Back to jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <div className="t-title">Mock interviews</div>
          <p className="t-callout muted" style={{ marginTop: 4 }}>Practice with an AI interviewer before the real thing.</p>
        </div>
      </div>

      {/* Start new interview */}
      <StartInterviewCard prefillRole={prefillRole} prefillCompany={prefillCompany} />

      {/* Past sessions */}
      <div className="section">
        <div className="section-head"><div className="t-heading">Past sessions</div></div>
        {isLoading ? (
          <SkeletonRows n={3} />
        ) : sessions.length === 0 ? (
          <div className="empty">
            <div className="ico"><Mic /></div>
            <div className="t-sub">No sessions yet</div>
            <p>Start your first mock interview above.</p>
          </div>
        ) : (
          <div className="list card">
            {sessions.map(s => (
              <Link key={s.id} to={`/app/interviews/${s.id}`} className="list-row">
                <div className="grow stack gap-4">
                  <div className="t-body">{s.jobTitle}</div>
                  <div className="t-caption muted">{s.companyName}</div>
                </div>
                <div className="stack gap-4" style={{ alignItems: 'flex-end' }}>
                  <div className="t-caption muted">{timeAgo(s.startedAt)}</div>
                  {s.report ? (
                    <span className="badge green">Report ready</span>
                  ) : (
                    <span className="badge">{s.transcript.length} turns</span>
                  )}
                </div>
                <ChevronRight size={16} className="chev" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StartInterviewCard({ prefillRole, prefillCompany }: { prefillRole: string; prefillCompany: string }) {
  const [role, setRole] = useState(prefillRole);
  const [company, setCompany] = useState(prefillCompany);
  const [voice, setVoice] = useState('iris-professional');

  const VOICES = [
    { id: 'iris-professional', label: 'Professional' },
    { id: 'iris-warm', label: 'Warm & Friendly' },
    { id: 'iris-strict', label: 'Tough Interviewer' },
    { id: 'iris-technical', label: 'Technical Lead' },
  ];

  const canStart = role.trim().length > 0;

  return (
    <div className="card pad">
      <div className="t-sub" style={{ marginBottom: 16 }}>Start a new session</div>
      <div className="stack gap-12">
        <div className="field">
          <label>Role</label>
          <input className="input" placeholder="e.g. Senior Software Engineer" value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div className="field">
          <label>Company (optional)</label>
          <input className="input" placeholder="e.g. Stripe" value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div className="field">
          <label>Interviewer voice</label>
          <div className="segmented">
            {VOICES.map(v => (
              <button key={v.id} className={voice === v.id ? 'on' : ''} onClick={() => setVoice(v.id)}>{v.label}</button>
            ))}
          </div>
        </div>
        <Link
          to={`/app/interviews/room?role=${encodeURIComponent(role)}&company=${encodeURIComponent(company)}&voice=${voice}`}
          className={`btn brand block ${!canStart ? 'disabled' : ''}`}
          style={{ pointerEvents: canStart ? 'auto' : 'none', opacity: canStart ? 1 : 0.4 }}
        >
          <Mic size={16} /> Start interview
        </Link>
      </div>
    </div>
  );
}
