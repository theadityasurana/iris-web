import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useSubscription } from '@web/lib/queries';
import { fetchRegion, openBillingPortal, startCheckout, useWebPlan, webPeriodName, webPlanName, webPlanUsable } from '@web/lib/webBilling';
import { useToast } from '@web/ui/Toast';
import { formatDate } from '@web/ui/bits';
import { PLAN_CONFIGS, TRIAL_PLAN } from '@/lib/billing';
import { getPlanDisplayName } from '@/lib/subscription';
import { Hired, PlansFaq, Stages, TimeSaved } from '@web/pages/plans/PlansExtras';

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

  const checkout = async (planId: string, planPeriod: string = period) => {
    setBusy(planId);
    try { window.location.href = (await startCheckout(planId, planPeriod)).url; }
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
        <div className="px-low">Apply for as low as {region === 'IN' ? '₹4' : 'under $0.10'} per application</div>
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
      {returned && active && <div className="banner green" role="status" style={{ marginBottom: 20 }}><CheckCircle2 /><span className="grow">You're on {webPlanName(active.plan)}. {active.credits_remaining} credits are ready to use.</span></div>}

      {active && (
        <section className="card pad current-plan">
          <div>
            <div className="t-overline muted">Your website plan · {webPeriodName(active.period)}</div>
            <div className="t-title" style={{ marginTop: 6 }}>{webPlanName(active.plan)}</div>
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

      {(() => {
        const t = TRIAL_PLAN.pricing[region];
        const isCurrent = active?.plan === 'trial';
        return (
          <section className="trial-strip" aria-label="Trial plan">
            <div>
              <div className="t-overline muted">Trial plan</div>
              <h2 className="t-heading" style={{ marginTop: 4 }}>Want to try Iris first? Start at {money(t.currency, t.price)}.</h2>
              <p className="t-callout soft" style={{ marginTop: 4 }}>
                {TRIAL_PLAN.credits} applications every {TRIAL_PLAN.days} days · {money(t.currency, Math.round((t.price / TRIAL_PLAN.credits) * 100) / 100)} per application. Renews every {TRIAL_PLAN.days} days, cancel any time.
              </p>
            </div>
            <button className="btn outline lg" disabled={!!busy || webLoading || isCurrent} onClick={() => checkout(TRIAL_PLAN.id, 'biweekly')}>
              {busy === TRIAL_PLAN.id ? <span className="spinner" /> : isCurrent ? 'Current plan' : 'Start a trial'}
            </button>
          </section>
        );
      })()}

      <Hired />
      <section className="px-section" aria-label="Compare plans">
        <div className="t-overline muted">Compare</div>
        <h2 className="t-title" style={{ marginBottom: 14 }}>Find the right plan.</h2>
        <div className="card px-table-wrap"><table className="px-table">
          <thead><tr><th scope="col">Per {period === 'quarterly' ? 'quarter' : 'month'}</th>{PLAN_CONFIGS.map(pl => <th key={pl.id} scope="col">{pl.label}</th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">Price</th>{PLAN_CONFIGS.map(pl => <td key={pl.id}>{money(pl.pricing[region].currency, pl.pricing[region][period])}</td>)}</tr>
            <tr><th scope="row">Applications</th>{PLAN_CONFIGS.map(pl => <td key={pl.id}>{pl.creditsPerMonth * (period === 'quarterly' ? 3 : 1)}</td>)}</tr>
            <tr><th scope="row">Per application</th>{PLAN_CONFIGS.map(pl => <td key={pl.id}>{money(pl.pricing[region].currency, Math.round((pl.pricing[region][period] / (pl.creditsPerMonth * (period === 'quarterly' ? 3 : 1))) * 100) / 100)}</td>)}</tr>
            {INCLUDED.map(f => <tr key={f}><th scope="row">{f}</th>{PLAN_CONFIGS.map(pl => <td key={pl.id}><Check size={16} aria-label="Included" /></td>)}</tr>)}
          </tbody>
        </table></div>
      </section>
      <TimeSaved />
      <Stages />
      <PlansFaq />

      <p className="t-caption muted" style={{ textAlign: 'center', marginTop: 28 }}>
        Payments are processed securely by Dodo Payments. Have a coupon? Enter it at checkout. Want credits for free? <Link to="/app/free-credits" className="link">Earn them here</Link>.
      </p>
    </div>
  );
}
