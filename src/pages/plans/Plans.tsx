import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Coffee, ShieldCheck, Sparkles, Tag } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useSubscription } from '@web/lib/queries';
import { useCredits, useRegion, openBillingPortal, startCheckout, useWebPlan, webPeriodName, webPlanName, webPlanUsable } from '@web/lib/webBilling';
import { useToast } from '@web/ui/Toast';
import { formatDate } from '@web/ui/bits';
import { PLAN_CONFIGS, TRIAL_PLAN } from '@/lib/billing';
import { getPlanDisplayName } from '@/lib/subscription';
import { Hired, PlansFaq, Stages, TimeSaved } from '@web/pages/plans/PlansExtras';
import '@web/styles/plans-revamp.css';
import { getPromoCode } from '@web/lib/promo';

const INCLUDED = ['Job feed, search and swipe', 'Applications submitted for you', 'Your own application inbox', 'Application tracking and replies'];

/**
 * Outcome estimate shown on each plan ("75 applications ≈ 3 interviews").
 * Assumption, not measured data: about 1 interview per 25 applications.
 * Change this one number to update every card and the footnote.
 */
const INTERVIEWS_PER_APPLICATION = 1 / 25;
const interviewsFor = (applications: number) => Math.max(1, Math.round(applications * INTERVIEWS_PER_APPLICATION));

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
  const { data: region = 'INTL' } = useRegion();
  const [promo] = useState(getPromoCode);
  const { left: creditsLeft } = useCredits();

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
      <header className="pl-hero">
        <div className="pl-hero-art" aria-hidden="true" />
        <div className="pl-pill"><span className="pl-blink" />Every minute, someone on Iris lands an interview</div>
        <h1 className="pl-title">Get to your next interview <em>faster.</em></h1>
        <p className="pl-sub">Every plan is a stack of applications Iris sends for you, tailored to each role. Pick how many shots you want this month.</p>
        <div className="pl-coffee"><Coffee size={16} />Less than a coffee for each shot at an interview: from <b>{region === 'IN' ? '₹4' : region === 'AF' ? 'under $0.05' : 'under $0.10'}</b> per application</div>
        <div className="segmented pl-seg" role="group" aria-label="Billing period">
          <button className={period === 'monthly' ? 'on' : ''} aria-pressed={period === 'monthly'} onClick={() => setPeriod('monthly')}>Monthly</button>
          <button className={period === 'quarterly' ? 'on' : ''} aria-pressed={period === 'quarterly'} onClick={() => setPeriod('quarterly')}>Quarterly <span className="pl-save">save more</span></button>
        </div>
        <div className="pl-trust"><span><ShieldCheck size={14} />Secure checkout</span><span><Check size={14} />Cancel any time</span>{promo ? <span className="pl-applied"><Tag size={14} />Code <b>{promo}</b> applied automatically at checkout</span> : <span><Tag size={14} />Use <b>IRIS10</b> for 10% off</span>}</div>
      </header>

      {returned && !active && (
        <div className="banner" role="status" style={{ marginBottom: 20 }}>
          <span className="spinner" /><span className="grow">Confirming your payment. This usually takes a few seconds.</span>
          <button className="btn ghost sm" onClick={() => setParams({}, { replace: true })}>Dismiss</button>
        </div>
      )}
      {returned && active && <div className="banner green" role="status" style={{ marginBottom: 20 }}><CheckCircle2 /><span className="grow">You're on {webPlanName(active.plan)}. {creditsLeft.toLocaleString()} credits are ready to use, in the app and on the website.</span></div>}

      {active && (
        <section className="card pad current-plan">
          <div>
            <div className="t-overline muted">Your website plan · {webPeriodName(active.period)}</div>
            <div className="t-title" style={{ marginTop: 6 }}>{webPlanName(active.plan)}</div>
            <p className="t-callout soft" style={{ marginTop: 6 }}>
              {creditsLeft.toLocaleString()} credits left
              {active.current_period_end && ` · ${active.status === 'cancelled' ? 'ends' : 'renews'} ${formatDate(active.current_period_end)}`}
            </p>
          </div>
          <button className="btn outline" onClick={manage} disabled={busy === 'portal'}>{busy === 'portal' ? <span className="spinner" /> : 'Manage billing'}</button>
        </section>
      )}
      {appPlan && !active && (
        <div className="banner" style={{ marginBottom: 20 }}><span className="grow">Your {getPlanDisplayName(appPlan)} plan from the mobile app also works here. It is managed through the App Store or Google Play and is separate from website plans.</span></div>
      )}

      <div className="pl-grid">
        {PLAN_CONFIGS.map(plan => {
          const p = plan.pricing[region];
          const price = p[period];
          const credits = plan.creditsPerMonth * (period === 'quarterly' ? 3 : 1);
          const perApp = price / credits;
          const saved = Math.round((1 - p.quarterly / (p.monthly * 3)) * 100);
          const isCurrent = active?.plan === plan.id && active.period === period;
          const per = period === 'quarterly' ? 'quarter' : 'month';
          return (
            <article key={plan.id} className={`pl-card ${plan.mostPopular ? 'pop' : ''}`}>
              {plan.mostPopular && <span className="pl-flag">Most popular</span>}
              <h2 className="pl-name">{plan.label}</h2>
              <div className="pl-per"><b>{money(p.currency, Math.round(perApp * 100) / 100)}</b><span>per application</span></div>
              <div className="pl-billed">{money(p.currency, price)} billed per {per}{period === 'quarterly' && saved > 0 ? <em> · save {saved}%</em> : null}</div>
              <div className="pl-outcome">
                <Sparkles size={18} />
                <div><b>{credits} applications ≈ {interviewsFor(credits)} interviews*</b><span>sent for you, tailored to each role</span></div>
              </div>
              <ul className="pl-list">{INCLUDED.map(f => <li key={f}><Check size={15} />{f}</li>)}</ul>
              <button className="pl-btn" disabled={!!busy || webLoading || isCurrent} onClick={() => checkout(plan.id)}>
                {busy === plan.id ? <span className="spinner" /> : isCurrent ? 'Current plan' : `Get ${plan.label}`}
              </button>
            </article>
          );
        })}
      </div>
      <p className="pl-foot">*Estimate, based on about 1 interview for every {Math.round(1 / INTERVIEWS_PER_APPLICATION)} applications. Results vary by role and profile.</p>

      {(() => {
        const t = TRIAL_PLAN.pricing[region];
        const isCurrent = active?.plan === 'trial';
        return (
          <section className="trial-strip pl-trial" aria-label="Trial plan">
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
