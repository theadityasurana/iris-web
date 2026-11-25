import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '@web/ui/Modal';
import { useToast } from '@web/ui/Toast';
import { startCheckout, useRegion, useWebPlan, webPlanUsable } from '@web/lib/webBilling';
import { PLAN_CONFIGS, TRIAL_PLAN } from '@/lib/billing';
import type { Entitlements } from '@/lib/entitlements';
import { getPlanDisplayName } from '@/lib/subscription';
import { TimeSaved } from '@web/ui/TimeSaved';
import { HiringCarousel } from '@web/ui/HiringCarousel';

const RELEVANT_JOBS = 900 + Math.floor(Math.random() * 900); // fixed per session, 900–1800

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
  const [busy, setBusy] = useState<string | false>(false);
  const { data: webPlan } = useWebPlan();
  const { data: region = 'INTL' } = useRegion();
  const showTrial = !webPlanUsable(webPlan);
  const t = TRIAL_PLAN.pricing[region];
  const trialPrice = `${t.currency}${Number.isInteger(t.price) ? t.price : t.price.toFixed(2)}`;
  const pay = async (plan: string, period: string) => {
    setBusy(plan);
    try { window.location.href = (await startCheckout(plan, period)).url; }
    catch (e: any) { toast(e.message, 'error'); setBusy(false); }
  };
  const startTrial = () => pay(TRIAL_PLAN.id, 'biweekly');
  if (region === 'AF' && !paid) return <AfricaPaywall open={open} onClose={onClose} busy={busy} pay={pay} trialPrice={trialPrice} />;
  return (
    <Modal open={open} onClose={onClose}
      title={paid ? 'You\u2019ve used this month\u2019s credits' : 'You\u2019ve used your free applications'}
      subtitle={paid
        ? `Your ${getPlanDisplayName(entitlements.plan)} credits refill with your next billing cycle. Move up a plan to keep applying today.`
        : left ? `Your free applications come back in ${left}. Upgrade to keep applying now.` : 'Upgrade to keep applying now.'}
      footer={<>
        <button className="btn secondary" onClick={onClose}>Not now</button>
        <Link to="/app/plans" className="btn" onClick={onClose}>See plans</Link>
      </>}>
      <div className="ooc-stats">
        <div className="ooc-stat">
          <b>14,000+</b>
          <span>companies hiring via Iris</span>
        </div>
        <div className="ooc-stat">
          <b>2M+</b>
          <span>live jobs on platform</span>
        </div>
        <div className="ooc-stat">
          <b>{RELEVANT_JOBS.toLocaleString()}</b>
          <span>jobs relevant for you</span>
        </div>
      </div>
      <p className="ooc-proof">80% of paid users land an interview, DSA test, or offer through Iris.</p>
      <HiringCarousel />
      <TimeSaved compact />
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
          <button className="btn outline" onClick={startTrial} disabled={!!busy}>
            {busy === TRIAL_PLAN.id ? <span className="spinner" /> : `Start trial \u00b7 ${trialPrice}`}
          </button>
        </div>
      )}
    </Modal>
  );
}

const usd = (n: number) => `$${n.toFixed(2)}`;

function AfricaPaywall({ open, onClose, busy, pay, trialPrice }: { open: boolean; onClose: () => void; busy: string | false; pay: (plan: string, period: string) => void; trialPrice: string }) {
  return (
    <Modal open={open} onClose={onClose}
      title="Keep Iris applying for you"
      subtitle="Your free application is on its way. Pick a plan and Iris applies to your next matches right away."
      footer={<>
        <button className="btn secondary" onClick={onClose}>Not now</button>
        <Link to="/app/plans" className="btn ghost" onClick={onClose}>Compare plans</Link>
      </>}>
      <div className="af-plans">
        {PLAN_CONFIGS.map(plan => {
          const p = plan.pricing.AF;
          return (
            <div key={plan.id} className={`af-plan ${plan.mostPopular ? 'pop' : ''}`}>
              <div className="grow">
                <div className="t-callout"><b>{plan.label}</b>{plan.mostPopular && <span className="plan-flag">Most popular</span>}</div>
                <div className="t-caption muted">{plan.creditsPerMonth} applications a month · {usd(p.monthly / plan.creditsPerMonth)} each</div>
              </div>
              <button className={`btn ${plan.mostPopular ? '' : 'outline'}`} disabled={!!busy} onClick={() => pay(plan.id, 'monthly')}>
                {busy === plan.id ? <span className="spinner" /> : `${usd(p.monthly)} / mo`}
              </button>
            </div>
          );
        })}
      </div>
      <div className="trial-offer">
        <div>
          <div className="t-callout"><b>Just want to try it?</b></div>
          <div className="t-caption muted">{TRIAL_PLAN.credits} applications for {TRIAL_PLAN.days} days at {trialPrice}. Cancel anytime.</div>
        </div>
        <button className="btn outline" onClick={() => pay(TRIAL_PLAN.id, 'biweekly')} disabled={!!busy}>
          {busy === TRIAL_PLAN.id ? <span className="spinner" /> : `Start trial \u00b7 ${trialPrice}`}
        </button>
      </div>
    </Modal>
  );
}
