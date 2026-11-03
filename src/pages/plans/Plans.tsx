import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Zap, Star, Crown, Gift } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useSubscription } from '@web/lib/queries';
import { PLAN_CONFIGS } from '@/lib/billing';
import { supabase } from '@/lib/supabase';
import { useToast } from '@web/ui/Toast';
import { useQuery } from '@tanstack/react-query';
import { getReferralStats, createReferralCode } from '@/lib/referral';

type Feature = { label: string; free: string | boolean; starter: string | boolean; pro: string | boolean; ultra: string | boolean };

const FEATURES: Feature[] = [
  { label: 'Applications / month',    free: '10',       starter: '75',        pro: '200',       ultra: '500' },
  { label: 'Job feed & swipe',        free: true,       starter: true,        pro: true,        ultra: true },
  { label: 'Iris auto-apply',         free: false,      starter: true,        pro: true,        ultra: true },
  { label: 'Daily apply limit',       free: false,      starter: 'Up to 5',   pro: 'Up to 10',  ultra: 'Up to 20' },
  { label: 'Resume tailoring',        free: false,      starter: true,        pro: true,        ultra: true },
  { label: 'Mock interviews',         free: false,      starter: false,       pro: '10 / month', ultra: 'Unlimited' },
  { label: 'Iris report',             free: false,      starter: true,        pro: true,        ultra: true },
  { label: 'Proxy email inbox',       free: true,       starter: true,        pro: true,        ultra: true },
  { label: 'Saved jobs',              free: true,       starter: true,        pro: true,        ultra: true },
  { label: 'Application tracking',    free: true,       starter: true,        pro: true,        ultra: true },
  { label: 'Quarterly credit refill', free: false,      starter: true,        pro: true,        ultra: true },
  { label: 'Support',                 free: 'Email',    starter: 'Priority',  pro: 'Priority',  ultra: 'Dedicated' },
];

const ICONS = { starter: Zap, pro: Star, ultra: Crown };

function Cell({ val }: { val: string | boolean }) {
  if (val === true) return <Check size={16} style={{ color: 'var(--brand-ink)', margin: '0 auto' }} />;
  if (val === false) return <X size={14} style={{ color: 'var(--ink-4)', margin: '0 auto' }} />;
  return <span className="t-caption" style={{ color: 'var(--ink-2)' }}>{val}</span>;
}

export default function Plans() {
  const navigate = useNavigate();
  const { userId, profileRow } = useAuth();
  const { data: sub } = useSubscription();
  const toast = useToast();
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const currentPlan = sub?.subscription_plan ?? 'free';
  const region = (profileRow?.country_code === 'IN' || navigator.language === 'en-IN') ? 'IN' : 'INTL';

  const { data: referralStats, refetch: refetchReferral } = useQuery({
    queryKey: ['referral-stats', userId],
    queryFn: () => getReferralStats(userId!),
    enabled: !!userId,
  });

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
      toast(e.message ?? 'Could not start checkout', 'error');
      setLoading(null);
    }
  }

  async function handleGetReferral() {
    if (!userId) return;
    if (!referralStats?.referralCode) {
      const name = profileRow?.full_name || 'User';
      await createReferralCode(userId, name);
      await refetchReferral();
    }
  }

  return (
    <div className="page plans-page">
      <div className="page-head">
        <div>
          <h1 className="t-title">Plans & billing</h1>
          <p className="t-callout muted" style={{ marginTop: 4 }}>
            {sub?.credits_remaining != null
              ? `${sub.credits_remaining} credits remaining · ${currentPlan !== 'free' ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) + ' plan' : 'Free plan'}`
              : 'Upgrade to apply to more jobs with Iris'}
          </p>
        </div>
        <div className="segmented">
          <button className={period === 'monthly' ? 'on' : ''} onClick={() => setPeriod('monthly')}>Monthly</button>
          <button className={period === 'quarterly' ? 'on' : ''} onClick={() => setPeriod('quarterly')}>
            Quarterly <span className="badge green" style={{ marginLeft: 6 }}>–20%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="plans-grid">
        {/* Free */}
        <div className={`card pad plan-card ${currentPlan === 'free' ? 'plan-current' : ''}`}>
          <div className="plan-card-head">
            <div className="t-sub">Free</div>
            <div className="t-display" style={{ marginTop: 8 }}>$0</div>
            <div className="t-caption muted">forever</div>
          </div>
          <div className="stack gap-6" style={{ marginTop: 16, flex: 1 }}>
            {['10 applications/month', 'Job feed & swipe', 'Proxy email inbox', 'Application tracking', 'Saved jobs'].map(f => (
              <div key={f} className="row gap-8 t-callout"><Check size={13} style={{ color: 'var(--brand-ink)', flexShrink: 0 }} />{f}</div>
            ))}
          </div>
          <button className="btn block secondary" style={{ marginTop: 20 }} disabled>
            {currentPlan === 'free' ? 'Current plan' : 'Free'}
          </button>
        </div>

        {PLAN_CONFIGS.map(plan => {
          const Icon = ICONS[plan.id as keyof typeof ICONS] ?? Zap;
          const pricing = plan.pricing[region];
          const price = pricing[period];
          const isCurrent = currentPlan === plan.id;
          return (
            <div key={plan.id} className={`card pad plan-card ${isCurrent ? 'plan-current' : ''} ${plan.mostPopular ? 'plan-popular' : ''}`}>
              {plan.mostPopular && <div className="plan-popular-badge">Most popular</div>}
              <div className="plan-card-head">
                <div className="row gap-8"><Icon size={18} /><span className="t-sub">{plan.label}</span></div>
                <div className="t-display" style={{ marginTop: 8 }}>{pricing.currency}{price}</div>
                <div className="t-caption muted">/{period === 'monthly' ? 'month' : 'quarter'}</div>
                {period === 'quarterly' && (
                  <div className="t-caption" style={{ color: 'var(--brand-ink)', marginTop: 4 }}>
                    {pricing.currency}{(pricing.monthly * 3 - pricing.quarterly).toFixed(0)} saved vs monthly
                  </div>
                )}
              </div>
              <div className="stack gap-6" style={{ marginTop: 16, flex: 1 }}>
                <div className="row gap-8 t-callout"><Check size={13} style={{ color: 'var(--brand-ink)', flexShrink: 0 }} /><strong>{plan.creditsPerMonth} applications/month</strong></div>
                {FEATURES.filter(f => f[plan.id as keyof Feature] && f[plan.id as keyof Feature] !== false && f.label !== 'Applications / month').map(f => {
                  const val = f[plan.id as keyof Feature];
                  return (
                    <div key={f.label} className="row gap-8 t-callout">
                      <Check size={13} style={{ color: 'var(--brand-ink)', flexShrink: 0 }} />
                      {typeof val === 'string' ? `${f.label}: ${val}` : f.label}
                    </div>
                  );
                })}
              </div>
              {isCurrent ? (
                <button className="btn block secondary" style={{ marginTop: 20 }} disabled>Current plan</button>
              ) : (
                <button className="btn block" style={{ marginTop: 20 }} disabled={!!loading} onClick={() => handleCheckout(plan.id)}>
                  {loading === plan.id ? <span className="spinner" /> : <Icon size={15} />}
                  {loading === plan.id ? 'Redirecting…' : `Get ${plan.label}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Full comparison table */}
      <div className="section">
        <div className="t-sub" style={{ marginBottom: 16 }}>Full comparison</div>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="plans-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Starter</th>
                <th className="plans-table-popular">Pro</th>
                <th>Ultra</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map(f => (
                <tr key={f.label}>
                  <td className="t-callout">{f.label}</td>
                  <td style={{ textAlign: 'center' }}><Cell val={f.free} /></td>
                  <td style={{ textAlign: 'center' }}><Cell val={f.starter} /></td>
                  <td style={{ textAlign: 'center', background: 'var(--surface-2)' }}><Cell val={f.pro} /></td>
                  <td style={{ textAlign: 'center' }}><Cell val={f.ultra} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral */}
      <div className="card pad" style={{ marginTop: 20 }}>
        <div className="row gap-12">
          <Gift size={20} style={{ color: 'var(--brand-ink)', flexShrink: 0 }} />
          <div className="grow">
            <div className="t-callout" style={{ fontWeight: 600 }}>Refer friends, earn free credits</div>
            <div className="t-caption muted">Share your code — you both get bonus credits when they sign up.</div>
          </div>
        </div>
        {referralStats?.referralCode ? (
          <div className="row gap-10" style={{ marginTop: 12 }}>
            <code style={{ flex: 1, padding: '8px 14px', borderRadius: 'var(--r-2)', background: 'var(--surface-2)', fontWeight: 700, fontSize: 18, letterSpacing: '0.1em', textAlign: 'center' }}>
              {referralStats.referralCode}
            </code>
            <button className="btn secondary" onClick={() => { navigator.clipboard.writeText(referralStats.referralCode!); }}>Copy</button>
          </div>
        ) : (
          <button className="btn outline sm" style={{ marginTop: 12 }} onClick={handleGetReferral}>Get my referral code</button>
        )}
        {referralStats && (
          <div className="row gap-20" style={{ marginTop: 12 }}>
            <div className="stat" style={{ flex: 1 }}><div className="v">{referralStats.totalReferrals ?? 0}</div><div className="k">Referrals</div></div>
            <div className="stat" style={{ flex: 1 }}><div className="v">{referralStats.totalSwipesEarned ?? 0}</div><div className="k">Bonus credits earned</div></div>
          </div>
        )}
      </div>

      <p className="t-caption muted" style={{ textAlign: 'center', marginTop: 20 }}>
        Payments processed securely by Dodo Payments · Cancel anytime · No refunds for partial months
      </p>
    </div>
  );
}
