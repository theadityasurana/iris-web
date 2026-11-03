import { Link } from 'react-router-dom';
import { Modal } from '@web/ui/Modal';
import type { Entitlements } from '@/lib/entitlements';
import { getPlanDisplayName } from '@/lib/subscription';

function countdown(resetAt: number) {
  const ms = resetAt - Date.now();
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

export function OutOfCredits({ open, onClose, entitlements, resetAt }: { open: boolean; onClose: () => void; entitlements: Entitlements; resetAt: number }) {
  const left = countdown(resetAt);
  const paid = entitlements.paid;
  return (
    <Modal open={open} onClose={onClose}
      title={paid ? 'You’ve used this month’s credits' : 'You’ve used your free applications'}
      subtitle={paid
        ? `Your ${getPlanDisplayName(entitlements.plan)} credits refill with your next billing cycle. Move up a plan to keep applying today.`
        : left ? `Your free applications come back in ${left}. Upgrade to keep applying now.` : 'Upgrade to keep applying now.'}
      footer={<>
        <button className="btn secondary" onClick={onClose}>Not now</button>
        <Link to="/app/plans" className="btn" onClick={onClose}>See plans</Link>
      </>}>
      <ul className="bullets" style={{ marginTop: 0 }}>
        <li>75 to 500 applications a month</li>
        <li>Iris auto-apply works through your matches every morning</li>
        <li>Mock interviews with a voice interviewer on Pro and Ultra</li>
      </ul>
    </Modal>
  );
}
