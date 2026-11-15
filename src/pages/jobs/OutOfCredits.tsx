import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@web/ui/Modal';
import { useToast } from '@web/ui/Toast';
import { fetchRegion, startCheckout, useWebPlan, webPlanUsable } from '@web/lib/webBilling';
import { TRIAL_PLAN } from '@/lib/billing';
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
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { data: webPlan } = useWebPlan();
  const { data: region = 'INTL' } = useQuery({ queryKey: ['pricing-region'], queryFn: fetchRegion, staleTime: 60 * 60_000 });
  // Offer the trial to anyone not already on a website plan.
  const showTrial = !webPlanUsable(webPlan);
  const t = TRIAL_PLAN.pricing[region];
  const trialPrice = `${t.currency}${Number.isInteger(t.price) ? t.price : t.price.toFixed(2)}`;
  const startTrial = async () => {
    setBusy(true);
    try { window.location.href = (await startCheckout(TRIAL_PLAN.id, 'biweekly')).url; }
    catch (e: any) { toast(e.message, 'error'); setBusy(false); }
  };
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
      </ul>
      {showTrial && (
        <div className="trial-offer">
          <div>
            <div className="t-callout"><b>Not ready for a full plan?</b></div>
            <div className="t-caption muted">Try Iris for {TRIAL_PLAN.days} days for {trialPrice}. Renews every {TRIAL_PLAN.days} days, cancel anytime.</div>
          </div>
          <button className="btn outline" onClick={startTrial} disabled={busy}>
            {busy ? <span className="spinner" /> : `Start trial · ${trialPrice}`}
          </button>
        </div>
      )}
    </Modal>
  );
}
