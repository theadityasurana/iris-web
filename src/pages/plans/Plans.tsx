import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useSubscription } from '@web/lib/queries';
import { fetchRegion, openBillingPortal, startCheckout, useWebPlan, webPlanUsable } from '@web/lib/webBilling';
import { useToast } from '@web/ui/Toast';
import { formatDate } from '@web/ui/bits';
import { PLAN_CONFIGS } from '@/lib/billing';
import { getPlanDisplayName } from '@/lib/subscription';

const INCLUDED = ['Job feed, search and swipe', 'Applications submitted for you', 'Your own application inbox', 'Application tracking and replies'];

const money = (currency: string, n: number) => `${currency}${Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)}`;

export default function Plans() {
  const { userId } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { data: sub } = useSubscription();
  const { data: webPlan, isLoading: webLoading } = useWebPlan();
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [busy, setBusy] = useState<string | null>(null);
  const { data: region = 'INTL' } = useQuery({ queryKey: ['pricing-region'], queryFn: fetchRegion, staleTime: 60 * 60_000 });

  const returned = params.get('checkout') === 'done';
  useEffect(() => {
    if (!returned) return;
    // The webhook may land a moment after the redirect, so check a few times.
    const timers = [0, 3000, 8000, 15000].map(ms => setTimeout(() => qc.invalidateQueries({ queryKey: ['web-plan', userId] }), ms));
    return () => timers.forEach(clearTimeout);
  }, [returned, qc, userId]);

  const active = webPlanUsable(webPlan) ? webPlan : null;
  const appPlan = sub?.subscription_plan && sub.subscription_plan !== 'free' ? sub.subscription_plan : null;

  const checkout = async (planId: string) => {
    setBusy(planId);
    try { window.location.href = (await startCheckout(planId, period)).url; }
    catch (e: any) { toast(e.message, 'error'); setBusy(null); }
  };
  const manage = async () => {
    setBusy('portal');
    try { window.location.href = (await openBillingPortal()).url; }
    catch (e: any) { toast(e.message, 'error'); setBusy(null); }
  };

  return (
    <div className="page">
      <div className="plans-head">
        <h1 className="t-display">Plans for the website</h1>
        <p className="soft">Apply to more jobs from your browser. Cancel any time.</p>
        <div className="segmented" role="group" aria-label="Billing period" style={{ marginTop: 18 }}>
          <button className={period === 'monthly' ? 'on' : ''} aria-pressed={period === 'monthly'} onClick={() => setPeriod('monthly')}>Monthly</button>
          <button className={period === 'quarterly' ? 'on' : ''} aria-pressed={period === 'quarterly'} onClick={() => setPeriod('quarterly')}>Quarterly</button>
        </div>
      </div>

      {returned && !active && (
        <div className="banner" role="status" style={{ marginBottom: 20 }}>
          <span className="spinner" /><span className="grow">Confirming your payment. This usually takes a few seconds.</span>
          <button className="btn ghost sm" onClick={() => setParams({}, { replace: true })}>Dismiss</button>
        </div>
      )}
      {returned && active && <div className="banner green" role="status" style={{ marginBottom: 20 }}><CheckCircle2 /><span className="grow">You're on {getPlanDisplayName(active.plan)}. {active.credits_remaining} credits are ready to use.</span></div>}

      {active && (
        <section className="card pad current-plan">
          <div>
            <div className="t-overline muted">Your website plan · {active.period}</div>
            <div className="t-title" style={{ marginTop: 6 }}>{getPlanDisplayName(active.plan)}</div>
            <p className="t-callout soft" style={{ marginTop: 6 }}>
              {active.credits_remaining} of {active.credits_limit} credits left
              {active.current_period_end && ` · ${active.status === 'cancelled' ? 'ends' : 'renews'} ${formatDate(active.current_period_end)}`}
            </p>
          </div>
          <button className="btn outline" onClick={manage} disabled={busy === 'portal'}>{busy === 'portal' ? <span className="spinner" /> : 'Manage billing'}</button>
        </section>
      )}
      {appPlan && !active && (
        <div className="banner" style={{ marginBottom: 20 }}><span className="grow">Your {getPlanDisplayName(appPlan)} plan from the mobile app also works here. It is managed through the App Store or Google Play and is separate from website plans.</span></div>
      )}

      <div className="plan-grid">
        {PLAN_CONFIGS.map(plan => {
          const p = plan.pricing[region];
          const price = p[period];
          const credits = plan.creditsPerMonth * (period === 'quarterly' ? 3 : 1);
          const perApp = price / credits;
          const saved = Math.round((1 - p.quarterly / (p.monthly * 3)) * 100);
          const isCurrent = active?.plan === plan.id && active.period === period;
          return (
            <article key={plan.id} className={`plan-card-new ${plan.mostPopular ? 'dark' : ''}`}>
              <div className="row between">
                <h2 className="t-heading">{plan.label}</h2>
                {plan.mostPopular && <span className="plan-flag">Most popular</span>}
              </div>
              <p className="t-callout plan-sub">{credits} applications per {period === 'quarterly' ? 'quarter' : 'month'}</p>
              <div className="plan-price"><b>{money(p.currency, price)}</b><span>/ {period === 'quarterly' ? 'quarter' : 'month'}</span></div>
              <div className="plan-unit">{money(p.currency, Math.round(perApp * 100) / 100)} per application{period === 'quarterly' && saved > 0 ? ` · save ${saved}%` : ''}</div>
              <ul className="plan-list">{INCLUDED.map(f => <li key={f}><Check size={15} />{f}</li>)}</ul>
              <button className={`btn block lg ${plan.mostPopular ? 'invert' : ''}`} disabled={!!busy || webLoading || isCurrent} onClick={() => checkout(plan.id)}>
                {busy === plan.id ? <span className="spinner" /> : isCurrent ? 'Current plan' : `Continue with ${plan.label}`}
              </button>
            </article>
          );
        })}
      </div>

      <p className="t-caption muted" style={{ textAlign: 'center', marginTop: 20 }}>
        Payments are processed securely by Dodo Payments. Have a coupon? Enter it at checkout. Want credits for free? <Link to="/app/free-credits" className="link">Earn them here</Link>.
      </p>
    </div>
  );
}
