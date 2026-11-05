/**
 * Shows a resume inside the page. PDFs are drawn with pdf.js and Word files are
 * converted in the browser, so the file never goes to a third-party viewer.
 */
import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { downloadResume, kindOf } from '@web/lib/resumes';

const MAX_PAGES = 8;
const TIMEOUT_MS = 25_000;

type Props = { file?: File | null; path?: string | null; fileName: string; mime?: string | null; onOpen?: () => void };
type State = 'loading' | 'ready' | 'error' | 'unsupported';

async function drawPdf(data: ArrayBuffer, host: HTMLElement, isCurrent: () => boolean) {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data }).promise;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(host.clientWidth, 280);
  for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGES); n++) {
    if (!isCurrent()) return;
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (width / base.width) * dpr });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.className = 'rp-page';
    canvas.setAttribute('aria-label', `Page ${n}`);
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    if (isCurrent()) host.appendChild(canvas);
  }
}

export function ResumePreview({ file, path, fileName, mime, onOpen }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>('loading');
  const [html, setHtml] = useState<string | null>(null);
  const kind = kindOf(fileName, mime ?? file?.type);

  useEffect(() => {
    let current = true;
    const el = host.current;
    if (el) el.replaceChildren();
    setHtml(null);
    if (kind === 'other') { setState('unsupported'); return; }
    if (!file && !path) { setState('error'); return; }
    setState('loading');
    const timer = setTimeout(() => { if (current) { current = false; setState('error'); } }, TIMEOUT_MS);
    (async () => {
      const blob: Blob = file ?? await downloadResume(path!);
      const data = await blob.arrayBuffer();
      if (kind === 'pdf') {
        await drawPdf(data, el!, () => current);
      } else {
        const mammoth = await import('mammoth/mammoth.browser');
        const out = await mammoth.convertToHtml({ arrayBuffer: data });
        if (current) setHtml(`<!doctype html><meta charset="utf-8"><style>body{font:14px/1.5 -apple-system,'Segoe UI',sans-serif;color:#23201b;background:#fff;margin:32px;overflow-wrap:break-word}img{max-width:100%}</style>${out.value}`);
      }
      if (current) { clearTimeout(timer); setState('ready'); }
    })().catch(e => {
      console.error('[resume preview]', e);
      if (current) { clearTimeout(timer); setState('error'); }
    });
    return () => { current = false; clearTimeout(timer); };
  }, [file, path, kind]);

  return (
    <div className="rp" aria-busy={state === 'loading'}>
      {state === 'loading' && <div className="rp-note" role="status"><span className="spinner" /><span>Loading preview…</span></div>}
      {(state === 'error' || state === 'unsupported') && (
        <div className="rp-note">
          <FileText size={26} />
          <span>{state === 'unsupported' ? 'Older .doc files can’t be previewed here.' : 'We couldn’t show a preview of this file.'}</span>
          {onOpen && <button className="btn outline sm" onClick={onOpen}>Open the file</button>}
        </div>
      )}
      <div ref={host} className="rp-pages" />
      {html && <iframe className="rp-doc" title="Resume preview" sandbox="" srcDoc={html} />}
    </div>
  );
}
