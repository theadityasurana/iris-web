import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, subtitle, children, footer, wide }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        {(title || subtitle) && (
          <div className="modal-head">
            <div>
              {title && <h2 className="t-heading">{title}</h2>}
              {subtitle && <p className="t-callout muted" style={{ marginTop: 4 }}>{subtitle}</p>}
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button>
          </div>
        )}
        {children}
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, body, confirmLabel = 'Confirm', danger, busy }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <button className="btn secondary" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'danger' : ''}`} onClick={onConfirm} disabled={busy}>{busy ? <span className="spinner" /> : confirmLabel}</button>
      </>}>
      <div className="t-body soft">{body}</div>
    </Modal>
  );
}
