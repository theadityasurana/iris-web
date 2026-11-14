import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink, FileText, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useApplications, useEntitlements } from '@web/lib/queries';
import { useWebPlan, webPlanTier, webPlanUsable } from '@web/lib/webBilling';
import { PLAN_FEATURES } from '@/lib/entitlements';
import { deleteResume, listResumes, pathFromUrl, resumeLink, signedResumeUrl, type ResumeFile } from '@web/lib/resumes';
import { ConfirmModal } from '@web/ui/Modal';
import { ResumePreview } from '@web/ui/ResumePreview';
import { useToast } from '@web/ui/Toast';
import { Empty, formatDate } from '@web/ui/bits';

const MAX_BYTES = 5 * 1024 * 1024;
const LIVE = new Set(['pending', 'processing']);

export default function Resumes() {
  const { userId, profile, uploadResume, saveProfile } = useAuth();
  const ent = useEntitlements();
  const toast = useToast();
  const qc = useQueryClient();
  const apps = useApplications();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [over, setOver] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ResumeFile | null>(null);

  const { data: files = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['resumes', userId],
    enabled: !!userId,
    queryFn: () => listResumes(userId!),
    staleTime: 60_000,
  });

  const activePath = pathFromUrl(profile?.resumeUrl);
  const { data: webPlan } = useWebPlan();
  const limit = Math.max(ent.resumes ?? 1, webPlanUsable(webPlan) ? PLAN_FEATURES[webPlanTier(webPlan.plan)].resumes : 1);
  const atLimit = files.length >= limit;
  // On a one-resume plan the only sensible action is to swap it.
  const replacing = limit === 1 && files.length === 1 ? files[0] : null;
  useEffect(() => {
    if (selected && files.some(f => f.path === selected)) return;
    setSelected(files.find(f => f.path === activePath)?.path ?? files[0]?.path ?? null);
  }, [files, activePath, selected]);
  const current = useMemo(() => files.find(f => f.path === selected) ?? null, [files, selected]);

  const inUse = (f: ResumeFile) => (apps.data ?? []).some(a => LIVE.has(a.status) && pathFromUrl(a.raw.resume_url) === f.path);
  const refresh = () => qc.invalidateQueries({ queryKey: ['resumes', userId] });

  async function upload(file?: File | null) {
    if (!file) return;
    if (file.size > MAX_BYTES) return toast('That file is over 5 MB. Please upload a smaller one.', 'error');
    if (!/\.(pdf|docx?)$/i.test(file.name)) return toast('Please upload a PDF or Word file.', 'error');
    if (atLimit && !replacing) return toast(`Your plan includes ${limit} resume${limit === 1 ? '' : 's'}. Delete one to add another.`, 'error');
    setUploading(true);
    const url = await uploadResume(file);
    setUploading(false);
    if (!url) return toast('Upload failed. Please try again.', 'error');
    setSelected(pathFromUrl(url));
    // The new file is in place first, so a failure here can't leave someone with no resume.
    if (replacing && !inUse(replacing)) await deleteResume(replacing.path);
    refresh();
    toast(replacing ? 'Resume replaced' : 'Resume added and set as your default');
  }

  async function open(f: ResumeFile) {
    const url = await signedResumeUrl(f.path);
    if (url) window.open(url, '_blank', 'noopener');
    else toast('Could not open this file. Please try again.', 'error');
  }

  async function makeDefault(f: ResumeFile) {
    if (await saveProfile({ resumeUrl: resumeLink(f.path) })) toast(`${f.name} is now your default`);
    else toast('Could not update. Please try again.', 'error');
  }

  async function confirmRemove() {
    const f = removing;
    setRemoving(null);
    if (!f) return;
    if (await deleteResume(f.path)) { toast('Resume deleted'); refresh(); }
    else toast('Could not delete. Please try again.', 'error');
  }

  function askRemove(f: ResumeFile) {
    if (f.path === activePath) return toast('Choose another default before deleting this resume.', 'error');
    if (inUse(f)) return toast('An application in progress is using this resume. Try again once it finishes.', 'error');
    setRemoving(f);
  }

  return (
    <div className="page wide rm">
      <div className="page-head">
        <div>
          <h1 className="t-title">Resume manager</h1>
          <p>See your resumes, and choose which one Iris applies with.</p>
        </div>
        <button className="btn" disabled={uploading || (atLimit && !replacing)} onClick={() => input.current?.click()}>
          {uploading ? <span className="spinner" /> : <Upload />}{uploading ? 'Uploading…' : replacing ? 'Replace resume' : 'Add resume'}
        </button>
      </div>
      <input ref={input} type="file" hidden accept=".pdf,.doc,.docx" onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />

      {isLoading ? (
        <div className="rm-grid" role="status" aria-label="Loading resumes"><div className="sk" style={{ height: 180, borderRadius: 22 }} /><div className="sk" style={{ height: 520, borderRadius: 22 }} /></div>
      ) : isError ? (
        <div className="card"><Empty icon={FileText} title="We couldn’t load your resumes" body="Check your connection and try again." action={<button className="btn" onClick={() => refetch()}>Try again</button>} /></div>
      ) : files.length === 0 ? (
        <button type="button" className={`ob-drop ${over ? 'over' : ''}`} onClick={() => input.current?.click()}
          onDragOver={(e: DragEvent) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files?.[0]); }}>
          <Upload /><b>Upload your resume</b><span className="t-callout muted">Drag it here, or click to choose. PDF or Word, up to 5 MB.</span>
        </button>
      ) : (
        <div className="rm-grid">
          <aside className="rm-list">
            <div className="t-overline muted rm-count">{files.length > limit ? `${files.length} resumes` : `${files.length} of ${limit} used`}</div>
            {files.map(f => {
              const isDefault = f.path === activePath;
              return (
                <article key={f.path} className={`card rm-item ${f.path === selected ? 'on' : ''}`}>
                  <button className="rm-open" aria-pressed={f.path === selected} onClick={() => setSelected(f.path)}>
                    <FileText size={20} />
                    <span className="grow"><b className="ellipsis">{f.name}</b><small>{f.uploadedAt ? `Added ${formatDate(f.uploadedAt)}` : 'Resume'}</small></span>
                    {isDefault && <span className="badge green"><Check size={11} />Default</span>}
                  </button>
                  <div className="rm-actions">
                    {!isDefault && <button className="btn outline sm" onClick={() => makeDefault(f)}>Set as default</button>}
                    <button className="icon-btn" title="Open in a new tab" aria-label={`Open ${f.name}`} onClick={() => open(f)}><ExternalLink size={16} /></button>
                    {!isDefault && <button className="icon-btn danger-text" title="Delete" aria-label={`Delete ${f.name}`} onClick={() => askRemove(f)}><Trash2 size={16} /></button>}
                  </div>
                </article>
              );
            })}
            {atLimit && !replacing && <p className="t-caption muted">Your plan includes {limit} resume{limit === 1 ? '' : 's'}. Delete one to add another.</p>}
          </aside>
          <section className="rm-preview" aria-label="Resume preview">
            {current && <ResumePreview path={current.path} fileName={current.fileName} mime={current.mime} onOpen={() => open(current)} />}
          </section>
        </div>
      )}
      <ConfirmModal open={!!removing} onClose={() => setRemoving(null)} onConfirm={confirmRemove} title="Delete this resume?" body={removing ? `${removing.name} will be removed from your account.` : ''} confirmLabel="Delete" danger />
    </div>
  );
}
