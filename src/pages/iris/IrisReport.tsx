import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useEntitlements } from '@web/lib/queries';
import { SkeletonRows, timeAgo, formatDate } from '@web/ui/bits';
import { getIrisApplications } from '@/lib/iris';
import { loadCachedReportData } from '@/lib/iris-report-data';
import { supabase } from '@/lib/supabase';

export default function IrisReport() {
  const { userId } = useAuth();
  const ent = useEntitlements();

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['iris-applications', userId],
    queryFn: () => getIrisApplications(userId!),
    enabled: !!userId && ent.iris,
  });

  const { data: reportMap } = useQuery({
    queryKey: ['iris-report-data', userId],
    queryFn: () => loadCachedReportData(userId!),
    enabled: !!userId && ent.iris,
  });

  if (!ent.iris) {
    return (
      <div className="page narrow">
        <div className="empty" style={{ paddingTop: 80 }}>
          <div className="ico"><Lock /></div>
          <div className="t-title">Iris report</div>
          <p>Upgrade to a paid plan to access Iris auto-apply and reports.</p>
          <Link to="/app/plans" className="btn brand" style={{ marginTop: 16 }}>View plans</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <Link to="/app/iris" className="crumb"><ChevronLeft />Iris</Link>
      <div className="page-head">
        <div className="t-title">Iris report</div>
      </div>

      {isLoading ? (
        <SkeletonRows n={5} />
      ) : apps.length === 0 ? (
        <div className="empty">
          <div className="ico"><Lock /></div>
          <div className="t-sub">No applications yet</div>
          <p>Enable Iris auto-apply and come back tomorrow to see your report.</p>
        </div>
      ) : (
        <div className="stack gap-12">
          {apps.map(app => {
            const report = reportMap?.get(app.id);
            const atsScore = report?.ats_score ?? null;
            const fitScore = report?.fit_score ?? null;
            const fitLabel = report?.fit_label ?? null;
            const keywords = report?.ats_keywords ?? [];
            const matched = keywords.filter(k => k.matched).length;
            const total = keywords.length;

            return (
              <div key={app.id} className="card pad">
                <div className="row gap-12 between" style={{ marginBottom: 12 }}>
                  <div className="stack gap-4">
                    <div className="t-sub">{app.job_title}</div>
                    <div className="t-caption muted">{app.company_name}</div>
                    <div className="t-caption muted">{timeAgo(app.applied_at)}</div>
                  </div>
                  {fitLabel && (
                    <span className={`badge ${fitLabel === 'Strong Fit' ? 'green' : fitLabel === 'Good Fit' ? 'blue' : 'amber'}`}>
                      {fitLabel}
                    </span>
                  )}
                </div>

                {report ? (
                  <>
                    <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
                      <div className="stat">
                        <div className="v num">{fitScore !== null ? `${fitScore}%` : '—'}</div>
                        <div className="k">Fit score</div>
                      </div>
                      <div className="stat">
                        <div className="v num">{atsScore !== null ? atsScore : '—'}</div>
                        <div className="k">ATS score</div>
                      </div>
                      <div className="stat">
                        <div className="v num">{total > 0 ? `${matched}/${total}` : '—'}</div>
                        <div className="k">Keywords</div>
                      </div>
                    </div>

                    {/* Fit breakdown bars */}
                    {report.fit_skills > 0 && (
                      <div className="stack gap-8" style={{ marginBottom: 16 }}>
                        {[
                          { label: 'Skills', value: report.fit_skills },
                          { label: 'Experience', value: report.fit_experience },
                          { label: 'Keywords', value: report.fit_keywords },
                          { label: 'Role alignment', value: report.fit_role_alignment },
                        ].map(({ label, value }) => (
                          <div key={label} className="row gap-8" style={{ alignItems: 'center' }}>
                            <span className="t-caption muted" style={{ width: 110, flexShrink: 0 }}>{label}</span>
                            <div style={{ flex: 1, height: 4, background: 'var(--line-strong)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${value}%`, height: '100%', background: 'var(--ink)', borderRadius: 2 }} />
                            </div>
                            <span className="t-caption num" style={{ width: 36, textAlign: 'right' }}>{value}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ATS keywords */}
                    {keywords.length > 0 && (
                      <div className="chips">
                        {keywords.map(k => (
                          <span key={k.keyword} className={`chip static ${k.matched ? '' : ''}`} style={{ color: k.matched ? 'var(--brand-ink)' : 'var(--danger)', opacity: k.matched ? 1 : 0.7 }}>
                            {k.matched ? '✓' : '✗'} {k.keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Interview prep */}
                    {report.interview_prep && report.interview_prep.length > 0 && (
                      <details style={{ marginTop: 16 }}>
                        <summary className="t-caption" style={{ cursor: 'pointer', color: 'var(--ink-2)' }}>Interview prep ({report.interview_prep.length} questions)</summary>
                        <div className="stack gap-12" style={{ marginTop: 12 }}>
                          {report.interview_prep.slice(0, 2).map((q: any, i: number) => (
                            <div key={i} className="card flat" style={{ padding: 14 }}>
                              <div className="t-caption" style={{ fontWeight: 600, marginBottom: 8 }}>Q{i + 1}: {q.question}</div>
                              {['situation', 'task', 'action', 'result'].map(k => q[k] && (
                                <div key={k} className="row gap-8" style={{ marginBottom: 4 }}>
                                  <span className="t-caption" style={{ fontWeight: 700, color: 'var(--brand-ink)', width: 14 }}>{k[0].toUpperCase()}</span>
                                  <span className="t-caption muted">{q[k]}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                ) : (
                  <div className="t-caption muted">Report generating…</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
