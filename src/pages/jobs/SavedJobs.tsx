import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Trash2 } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { CompanyLogo, Empty, SkeletonRows } from '@web/ui/bits';
import { supabase } from '@/lib/supabase';
import { mapSupabaseJobToJob, unsaveJob } from '@/lib/jobs';
import { computeMatchScores } from '@/lib/match-scoring';
import { matchTone } from './JobParts';

export default function SavedJobs() {
  const { userId, profile } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['saved-jobs', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('saved_jobs').select('job_id').eq('user_id', userId!);
      const ids = (data ?? []).map(d => d.job_id);
      if (!ids.length) return [];
      const { data: rows } = await supabase.from('jobs').select('*').in('id', ids);
      return computeMatchScores(profile, (rows ?? []).map(mapSupabaseJobToJob));
    },
  });

  const remove = async (jobId: string) => {
    await unsaveJob(userId!, jobId);
    qc.invalidateQueries({ queryKey: ['saved-jobs', userId] });
    toast('Removed from saved');
  };

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <h1 className="t-title">Saved jobs</h1>
          <p className="t-body muted">Jobs you saved from the feed. Open one to apply.</p>
        </div>
      </div>
      {isLoading ? <SkeletonRows /> : jobs.length === 0 ? (
        <Empty icon={Bookmark} title="Nothing saved yet" body="Save a job from the feed with the bookmark button or the up arrow key." action={<Link to="/app/jobs" className="btn">Browse jobs</Link>} />
      ) : (
        <div className="list lined card">
          {jobs.map(j => (
            <div key={j.id} className="list-row">
              <Link to={`/app/jobs/${j.id}`} className="row gap-14 grow" style={{ gap: 14 }}>
                <CompanyLogo name={j.companyName} url={j.companyLogo} />
                <div className="grow">
                  <div className="t-sub ellipsis">{j.jobTitle}</div>
                  <div className="t-callout muted ellipsis">{j.companyName} · {j.location}</div>
                </div>
              </Link>
              {j.matchScore > 0 && <span className={`badge ${matchTone(j.matchScore)}`}>{j.matchScore}%</span>}
              <button className="icon-btn" onClick={() => remove(j.id)} aria-label="Remove"><Trash2 /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
