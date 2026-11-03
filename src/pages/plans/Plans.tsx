import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Star, Crown } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useSubscription } from '@web/lib/queries';
import { PLAN_CONFIGS } from '@/lib/billing';
import { supabase } from '@/lib/supabase';

const FEATURES: Record<string, string[]> = {
  free:    ['10 applications/month', 'Job feed & swipe', 'Basic profile'],
  starter: ['75 applications/month', 'Iris auto-apply', 'Resume tailoring', 'Priority support'],
  pro:     ['200 applications/month', 'Iris auto-apply', 'Mock interviews (10/mo)', 'Resume tailoring', 'Priority support'],
  ultra:   ['500 applications/month', 'Iris auto-apply', 'Mock interviews (unlimited)', 'Resume tailoring', 'Dedicated support'],
};

const ICONS: Record<string, typeof Zap> = { starter: Zap, pro: Star, ultra: Crown };

export default function Plans() {
  const navigate = useNavigate();
  const { userId, profileRow } = useAuth();
  const { data: sub } = useSubscription();
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const currentPlan = sub?.subscription_plan ?? 'free';
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Detect region from profile country or browser locale
  const region = (profileRow?.country_code === 'IN' || navigator.language === 'en-IN') ? 'IN' : 'INTL';

  async function handleCheckout(planId: string) {
    if (!userId) { navigate('/app/sign-in'); return; }
    setLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('dodo-checkout', {
        body: { plan_id: planId, period, user_id: userId, region },
      });
      if (error || !data?.url) throw new Error(error?.message ?? 'Checkout failed');
      window.location.href = data.url;
    } catch (e: any) {
      showToast(e.message ?? 'Could not start checkout');
      setLoading(null);
    }
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <h1 className="t-title">Plans</h1>
          <p className="t-callout" style={{ color: 'var(--ink-3)', marginTop: 4 }}>
            {sub?.credits_remaining != null ? `${sub.credits_remaining} credits remaining this month` : 'Upgrade to apply to more jobs'}
          </p>
        </div>
      </div>

      {/* Period toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <div className="segmented">
          <button className={period === 'monthly' ? 'on' : ''} onClick={() => setPeriod('monthly')}>Monthly</button>
          <button className={period === 'quarterly' ? 'on' : ''} onClick={() => setPeriod('quarterly')}>
            Quarterly <span className="badge green" style={{ marginLeft: 6 }}>Save 20%</span>
          </button>
        </div>
      </div>

      {/* Free plan */}
      <div className="card pad" style={{ marginBottom: 12, opacity: currentPlan === 'free' ? 1 : 0.7 }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <div>
            <div className="t-sub">Free</div>
            <div className="t-callout" style={{ color: 'var(--ink-3)' }}>Always free</div>
          </div>
          {currentPlan === 'free' && <span className="badge green">Current plan</span>}
        </div>
        <div className="stack gap-8">
          {FEATURES.free.map(f => (
            <div key={f} className="row gap-8 t-callout"><Check size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />{f}</div>
          ))}
        </div>
      </div>

      {/* Paid plans */}
      {PLAN_CONFIGS.map(plan => {
        const Icon = ICONS[plan.id] ?? Zap;
        const pricing = plan.pricing[region];
        const price = pricing[period];
        const isCurrent = currentPlan === plan.id;
        return (
          <div key={plan.id} className="card pad" style={{ marginBottom: 12, boxShadow: plan.mostPopular ? 'inset 0 0 0 2px var(--ink)' : undefined }}>
            {plan.mostPopular && (
              <div style={{ marginBottom: 10 }}><span className="badge dark">Most popular</span></div>
            )}
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="row gap-10">
                <Icon size={20} />
                <div>
                  <div className="t-sub">{plan.label}</div>
                  <div className="t-callout" style={{ color: 'var(--ink-3)' }}>{plan.creditsPerMonth} credits/month</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="t-sub">{pricing.currency}{price}</div>
                <div className="t-callout" style={{ color: 'var(--ink-3)' }}>/{period === 'monthly' ? 'mo' : 'qtr'}</div>
              </div>
            </div>
            <div className="stack gap-8" style={{ marginBottom: 16 }}>
              {FEATURES[plan.id]?.map(f => (
                <div key={f} className="row gap-8 t-callout"><Check size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />{f}</div>
              ))}
            </div>
            {isCurrent ? (
              <button className="btn block secondary" disabled>Current plan</button>
            ) : (
              <button className="btn block" disabled={!!loading} onClick={() => handleCheckout(plan.id)}>
                {loading === plan.id ? <span className="spinner" /> : null}
                {loading === plan.id ? 'Redirecting…' : `Get ${plan.label}`}
              </button>
            )}
          </div>
        );
      })}

      <p className="t-callout" style={{ color: 'var(--ink-3)', textAlign: 'center', marginTop: 16 }}>
        Payments processed securely by Dodo Payments. Cancel anytime.
      </p>

      {toast && <div className="toasts"><div className="toast error">{toast}</div></div>}
    </div>
  );
}
