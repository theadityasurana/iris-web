import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, BookmarkCheck, Check, ExternalLink, Share2, SearchX } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { Empty, PageLoader } from '@web/ui/bits';
import { fetchJobById, isJobSaved, unsaveJob } from '@/lib/jobs';
import { computeMatchScores } from '@/lib/match-scoring';
import { jobShareLink } from '@/constants/links';
import { JobDetail } from './JobParts';
import { useJobActions } from './useJobActions';
import { OutOfCredits } from './OutOfCredits';

export default function JobDetailsPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const hideApply = params.get('hideApply') === 'true';
  const navigate = useNavigate();
  const { userId, profile, swipedJobIds } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const actions = useJobActions();
  const [busy, setBusy] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const j = await fetchJobById(id);
      return j ? computeMatchScores(profile, [j])[0] : null;
    },
  });
  const { data: saved = false } = useQuery({
    queryKey: ['job-saved', userId, id],
    queryFn: () => isJobSaved(userId!, id),
    enabled: !!userId,
  });

  if (isLoading) return <PageLoader />;
  if (!job) {
    return <div className="page narrow"><Empty icon={SearchX} title="This job is no longer available" body="It may have been filled or removed." action={<Link to="/app/jobs" className="btn">Back to jobs</Link>} /></div>;
  }

  const applied = swipedJobIds.includes(job.id) && !saved;

  const onApply = async () => {
    setBusy(true);
    const r = await actions.apply(job);
    setBusy(false);
    if (r === 'applied') toast(`Applying to ${job.companyName}`);
    else if (r === 'failed') toast('Your application could not be queued', 'error');
  };
  const onSave = async () => {
    if (saved) await unsaveJob(userId!, job.id);
    else await actions.save(job);
    qc.invalidateQueries({ queryKey: ['job-saved', userId, id] });
    qc.invalidateQueries({ queryKey: ['saved-jobs', userId] });
    toast(saved ? 'Removed from saved' : 'Saved');
  };
  const onShare = async () => {
    const url = jobShareLink(job.id);
    try {
      if (navigator.share) await navigator.share({ title: `${job.jobTitle} at ${job.companyName}`, url });
      else { await navigator.clipboard.writeText(url); toast('Link copied'); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate(-1)}><ArrowLeft />Back</button>
      <JobDetail job={job} />
      <div className="sticky-actions">
        {job.jobUrl && /^https?:\/\//i.test(job.jobUrl) && (
          <a className="btn outline listing-btn" href={job.jobUrl} target="_blank" rel="noopener noreferrer" aria-label="Open the job listing" title="Open the job listing"><ExternalLink /><span>Open job listing</span></a>
        )}
        <button className="icon-btn" onClick={onShare} aria-label="Share"><Share2 /></button>
        <button className="btn outline" onClick={onSave}>{saved ? <BookmarkCheck /> : <Bookmark />}{saved ? 'Saved' : 'Save'}</button>
        {!hideApply && (
          <button className="btn" onClick={onApply} disabled={busy || applied}>
            {busy ? <span className="spinner" /> : <Check />}{applied ? 'Already in your queue' : 'Apply with Iris'}
          </button>
        )}
      </div>
      <OutOfCredits open={actions.outOfCredits} onClose={() => actions.setOutOfCredits(false)} entitlements={actions.entitlements} resetAt={actions.freeResetAt} />
    </div>
  );
}
