/** Resume files, stored and read the same way as the mobile app's resume manager. */
import { supabase } from '@/lib/supabase';

const BUCKET = 'resumes';

export interface ResumeFile { path: string; fileName: string; name: string; uploadedAt: string | null; mime: string | null }
export type ResumeKind = 'pdf' | 'docx' | 'other';

/** "Jane_CV.pdf_1790000000" → "Jane CV", and "1790000000.pdf" → "Resume". */
export function displayName(fileName: string): string {
  const stem = decodeURIComponent(fileName).replace(/_\d{10,}$/, '').replace(/\.[a-z0-9]+$/i, '').replace(/^\d{10,}$/, '');
  return stem.replace(/[_-]+/g, ' ').trim() || 'Resume';
}

export function kindOf(fileName: string, mime?: string | null): ResumeKind {
  const n = fileName.toLowerCase().replace(/_\d{10,}$/, '');
  if (mime === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (mime?.includes('wordprocessingml') || n.endsWith('.docx')) return 'docx';
  return 'other';
}

/** The storage path inside a stored resume link, or null if it isn't one of ours. */
export function pathFromUrl(url?: string | null): string | null {
  const m = (url || '').match(/\/resumes\/([^?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function listResumes(userId: string): Promise<ResumeFile[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(userId, { sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  return (data ?? []).filter(f => f.id && f.name !== '.emptyFolderPlaceholder').map(f => ({
    path: `${userId}/${f.name}`,
    fileName: f.name,
    name: displayName(f.name),
    uploadedAt: f.created_at ?? null,
    mime: (f.metadata as { mimetype?: string } | null)?.mimetype ?? null,
  }));
}

export async function downloadResume(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw error ?? new Error('download');
  return data;
}

export async function signedResumeUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function deleteResume(path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return !error;
}

export const resumeLink = (path: string) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
