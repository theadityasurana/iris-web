import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, FileText, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';

export default function Resumes() {
  const navigate = useNavigate();
  const { profile, uploadResume, saveProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  async function handleFile(file: File) {
    if (!file) return;
    setUploading(true);
    const url = await uploadResume(file);
    setUploading(false);
    if (url) showToast('Resume uploaded');
    else showToast('Upload failed');
  }

  async function handleRemove() {
    if (!confirm('Remove your resume?')) return;
    await saveProfile({ resumeUrl: undefined });
    showToast('Removed');
  }

  const resumeUrl = profile?.resumeUrl;
  const fileName = resumeUrl ? decodeURIComponent(resumeUrl.split('/').pop()?.split('?')[0] ?? 'Resume') : null;

  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
      <div className="page-head"><h1 className="t-title">Resume</h1></div>

      {resumeUrl ? (
        <div className="card pad" style={{ marginBottom: 20 }}>
          <div className="row gap-12">
            <FileText size={32} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
            <div className="grow">
              <div className="t-sub ellipsis">{fileName}</div>
              <div className="t-callout" style={{ color: 'var(--ink-3)' }}>Active resume</div>
            </div>
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="icon-btn"><ExternalLink size={16} /></a>
            <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={handleRemove}><Trash2 size={16} /></button>
          </div>
        </div>
      ) : (
        <div className="empty" style={{ border: '2px dashed var(--line)', borderRadius: 16, marginBottom: 20 }}>
          <div className="ico"><FileText /></div>
          <div className="t-sub">No resume uploaded</div>
          <p>Upload a PDF or Word document</p>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

      <button className="btn block" disabled={uploading} onClick={() => fileRef.current?.click()}>
        {uploading ? <span className="spinner" /> : <Upload size={16} />}
        {uploading ? 'Uploading…' : resumeUrl ? 'Replace Resume' : 'Upload Resume'}
      </button>

      <p className="t-callout" style={{ color: 'var(--ink-3)', marginTop: 12, textAlign: 'center' }}>
        PDF, DOC, or DOCX · max 10 MB
      </p>

      {toast && <div className="toasts"><div className="toast">{toast}</div></div>}
    </div>
  );
}
