import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, FileText, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';

export default function Resumes() {
  const navigate = useNavigate();
  const { profile, uploadResume, saveProfile } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const url = await uploadResume(file);
    setUploading(false);
    if (url) toast('Resume uploaded');
    else toast('Upload failed', 'error');
  }

  async function handleRemove() {
    if (!confirm('Remove your resume?')) return;
    await saveProfile({ resumeUrl: undefined });
    toast('Removed');
  }

  const resumeUrl = profile?.resumeUrl;
  const fileName = resumeUrl
    ? decodeURIComponent(resumeUrl.split('/').pop()?.split('?')[0] ?? 'Resume')
    : null;
  const isPdf = fileName?.toLowerCase().endsWith('.pdf');
  const previewUrl = resumeUrl && isPdf
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(resumeUrl)}`
    : null;

  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
      <div className="page-head"><h1 className="t-title">Resume</h1></div>

      {resumeUrl ? (
        <>
          <div className="card pad" style={{ marginBottom: 16 }}>
            <div className="row gap-12">
              <FileText size={28} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
              <div className="grow">
                <div className="t-sub ellipsis">{fileName}</div>
                <div className="t-caption muted">Active resume</div>
              </div>
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="icon-btn" title="Open"><ExternalLink size={16} /></a>
              <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={handleRemove} title="Remove"><Trash2 size={16} /></button>
            </div>
          </div>

          {previewUrl && (
            <div className="card" style={{ marginBottom: 16, overflow: 'hidden', borderRadius: 'var(--r-4)' }}>
              <iframe
                src={previewUrl}
                title="Resume preview"
                style={{ width: '100%', height: 600, border: 0, display: 'block' }}
              />
            </div>
          )}
        </>
      ) : (
        <div className="empty" style={{ border: '2px dashed var(--line)', borderRadius: 16, marginBottom: 20 }}>
          <div className="ico"><FileText /></div>
          <div className="t-sub">No resume uploaded</div>
          <p>Upload a PDF or Word document. Iris uses it to fill in applications.</p>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

      <button className="btn block" disabled={uploading} onClick={() => fileRef.current?.click()}>
        {uploading ? <span className="spinner" /> : <Upload size={16} />}
        {uploading ? 'Uploading…' : resumeUrl ? 'Replace resume' : 'Upload resume'}
      </button>

      <p className="t-caption muted" style={{ marginTop: 10, textAlign: 'center' }}>
        PDF, DOC, or DOCX · max 10 MB
      </p>
    </div>
  );
}
