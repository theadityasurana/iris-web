import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, Loader } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { SkeletonRows, formatDate } from '@web/ui/bits';
import { getInterviewSessions, generateInterviewReport, type InterviewReport } from '@/lib/livekit';

export default function InterviewReport() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['interview-sessions', userId],
    queryFn: () => getInterviewSessions(userId!),
    enabled: !!userId,
  });

  const session = sessions.find(s => s.id === sessionId);
  const [report, setReport] = useState<InterviewReport | null>(session?.report ?? null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!userId || !session) return;
    setGenerating(true);
    const r = await generateInterviewReport(userId, session);
    if (r) setReport(r);
    setGenerating(false);
  };

  if (isLoading) return <div className="page narrow"><SkeletonRows n={5} /></div>;
  if (!session) return (
    <div className="page narrow">
      <div className="empty">
        <div className="t-sub">Session not found</div>
        <Link to="/app/interviews" className="btn secondary sm" style={{ marginTop: 12 }}>Back</Link>
      </div>
    </div>
  );

  const scoreColor = (n: number) => n >= 80 ? 'var(--brand-ink)' : n >= 60 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div className="page narrow">
      <Link to="/app/interviews" className="crumb"><ChevronLeft />Interviews</Link>
      <div className="page-head">
        <div>
          <div className="t-title">{session.jobTitle}</div>
          <div className="t-callout muted">{session.companyName} · {formatDate(session.startedAt)}</div>
        </div>
      </div>

      {!report && (
        <div className="card pad" style={{ marginBottom: 20, textAlign: 'center' }}>
          <div className="t-sub" style={{ marginBottom: 8 }}>No report yet</div>
          <p className="t-callout muted" style={{ marginBottom: 16 }}>Generate an AI analysis of your interview performance.</p>
          <button className="btn brand" onClick={generate} disabled={generating || session.transcript.length === 0}>
            {generating ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : 'Generate report'}
          </button>
          {session.transcript.length === 0 && <p className="t-caption muted" style={{ marginTop: 8 }}>No transcript available for this session.</p>}
        </div>
      )}

      {report && (
        <div className="stack gap-16">
          {/* Overall scores */}
          <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div className="stat">
              <div className="v num" style={{ color: scoreColor(report.overallScore) }}>{report.overallScore}</div>
              <div className="k">Overall</div>
            </div>
            <div className="stat">
              <div className="v num" style={{ color: scoreColor(report.communicationScore) }}>{report.communicationScore}</div>
              <div className="k">Communication</div>
            </div>
            <div className="stat">
              <div className="v num" style={{ color: scoreColor(report.technicalScore) }}>{report.technicalScore}</div>
              <div className="k">Technical</div>
            </div>
          </div>

          {/* Summary */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Summary</div>
            <p className="prose">{report.summary}</p>
          </div>

          {/* Strengths & improvements */}
          <div className="form-grid">
            <div className="card pad">
              <div className="t-sub" style={{ marginBottom: 8, color: 'var(--brand-ink)' }}>Strengths</div>
              <ul className="bullets">
                {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="card pad">
              <div className="t-sub" style={{ marginBottom: 8, color: 'var(--warn)' }}>To improve</div>
              <ul className="bullets">
                {report.improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          {/* Question responses */}
          {report.questionResponses.length > 0 && (
            <div className="card pad">
              <div className="t-sub" style={{ marginBottom: 12 }}>Question feedback</div>
              <div className="stack gap-12">
                {report.questionResponses.map((q, i) => (
                  <div key={i} style={{ paddingBottom: 12, borderBottom: i < report.questionResponses.length - 1 ? '1px solid var(--line)' : 'none' }}>
                    <div className="row gap-8" style={{ marginBottom: 6 }}>
                      <span className="t-caption" style={{ fontWeight: 600 }}>Q{i + 1}: {q.question}</span>
                      <span className={`badge ${q.answerQuality === 'excellent' ? 'green' : q.answerQuality === 'good' ? 'blue' : 'amber'}`} style={{ flexShrink: 0 }}>
                        {q.answerQuality === 'excellent' ? 'Excellent' : q.answerQuality === 'good' ? 'Good' : 'Needs work'}
                      </span>
                    </div>
                    <p className="t-caption muted">{q.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {report.tips.length > 0 && (
            <div className="card pad">
              <div className="t-sub" style={{ marginBottom: 8 }}>Tips for next time</div>
              <ul className="bullets">
                {report.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Transcript */}
      {session.transcript.length > 0 && (
        <div className="section">
          <details>
            <summary className="t-heading" style={{ cursor: 'pointer' }}>Transcript ({session.transcript.length} turns)</summary>
            <div className="stack gap-8" style={{ marginTop: 12 }}>
              {session.transcript.map((t, i) => (
                <div key={i} className="row gap-12" style={{ alignItems: 'flex-start' }}>
                  <span className="t-caption" style={{ fontWeight: 700, width: 70, flexShrink: 0, color: t.speaker === 'ai' ? 'var(--brand-ink)' : 'var(--ink-3)' }}>
                    {t.speaker === 'ai' ? 'Iris' : 'You'}
                  </span>
                  <span className="t-callout">{t.text}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
