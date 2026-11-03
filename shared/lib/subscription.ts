import { supabase } from './supabase';
import type { PlanId, BillingPeriod, PricingRegion } from './billing';
import { PRODUCT_ENTITLEMENTS, FREE_CREDITS_PER_MONTH } from './billing';

export type { PlanId, BillingPeriod, PricingRegion };

// ─── Types ────────────────────────────────────────────────────────────────────

/** Legacy binary type — kept for backward compat with existing queries */
export type SubscriptionType = 'free' | 'premium';

export interface SubscriptionData {
  subscription_type: SubscriptionType;
  subscription_plan: PlanId;
  billing_period: BillingPeriod;
  pricing_region: PricingRegion;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  /** credits_remaining — primary credit balance field */
  credits_remaining: number;
  credits_limit: number;
  google_play_purchase_token?: string | null;
  subscription_status?: string | null;
  /**
   * The paid plan this user had until it lapsed (end date passed, payment
   * failed, or expired by the server job); null while paid or never paid.
   */
  lapsed_plan?: PlanId | null;
}

export interface TransactionRecord {
  id: string;
  user_id: string;
  subscription_type: string;
  subscription_plan?: string | null;
  billing_period?: string | null;
  pricing_region?: string | null;
  amount: number;
  payment_id: string | null;
  order_id: string | null;
  status: 'completed' | 'failed' | 'pending' | 'abandoned';
  coupon_code: string | null;
  created_at: string;
}

// ─── Credit limits per plan ───────────────────────────────────────────────────

export const PLAN_CREDIT_LIMITS: Record<PlanId, number> = {
  free: FREE_CREDITS_PER_MONTH,
  starter: 75,
  pro: 200,
  ultra: 500,
};

/** Legacy map — kept for webhook backward compat */
export const SUBSCRIPTION_LIMITS: Record<string, number> = {
  free: FREE_CREDITS_PER_MONTH,
  premium: 200, // legacy premium → pro equivalent
  starter: 75,
  pro: 200,
  ultra: 500,
};

export const RESUME_LIMITS: Record<string, number> = {
  free: 1,
  starter: 3,
  pro: 5,
  ultra: 5,
  premium: 5,
};

export const FREE_MONTHLY_SWIPE_LIMIT = FREE_CREDITS_PER_MONTH;

// ─── Payment attempt tracking ─────────────────────────────────────────────────

export async function recordPaymentAttempt(
  userId: string,
  subscriptionType: string,
  amount: number,
  paymentLinkId?: string,
  subscriptionId?: string,
  plan?: PlanId,
  billingPeriod?: BillingPeriod,
  pricingRegion?: PricingRegion
): Promise<{ success: boolean; recordId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        subscription_type: subscriptionType,
        amount,
        payment_id: null,
        order_id: paymentLinkId || subscriptionId || null,
        status: 'pending',
        coupon_code: null,
        subscription_plan: plan || null,
        billing_period: billingPeriod || null,
        pricing_region: pricingRegion || null,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '42P01') return { success: false, error: 'Table does not exist' };
      // If new columns don't exist yet, retry without them
      if (error.code === '42703') {
        const { data: d2, error: e2 } = await supabase
          .from('payment_history')
          .insert({ user_id: userId, subscription_type: subscriptionType, amount, payment_id: null, order_id: paymentLinkId || subscriptionId || null, status: 'pending', coupon_code: null })
          .select('id')
          .single();
        if (e2) throw e2;
        return { success: true, recordId: d2?.id };
      }
      throw error;
    }
    return { success: true, recordId: data?.id };
  } catch (error: any) {
    console.error('Error recording payment attempt:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePaymentStatus(
  recordId: string,
  status: 'completed' | 'failed' | 'abandoned' | 'pending',
  paymentId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, any> = { status };
    if (paymentId) updateData.payment_id = paymentId;
    const { error } = await supabase.from('payment_history').update(updateData).eq('id', recordId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return { success: false, error: error.message };
  }
}

export async function markAbandonedPayments(userId: string): Promise<void> {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    await supabase
      .from('payment_history')
      .update({ status: 'abandoned' })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('created_at', thirtyMinAgo);
  } catch (error) {
    console.error('Error marking abandoned payments:', error);
  }
}

// ─── Activate subscription ────────────────────────────────────────────────────

export async function activateSubscription(
  userId: string,
  productId: string,
  paymentId?: string,
  orderId?: string,
  amount?: number,
  couponCode?: string,
  googlePlayPurchaseToken?: string,
  pricingRegion?: PricingRegion,
  mode: 'purchase' | 'restore' = 'purchase'
): Promise<{ success: boolean; error?: string }> {
  try {
    const entitlement = PRODUCT_ENTITLEMENTS[productId] || PRODUCT_ENTITLEMENTS['nextquark_pro_monthly'];
    const { plan, billingPeriod, creditsPerMonth } = entitlement;

    const startDate = new Date();
    const endDate = new Date();
    if (billingPeriod === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('applications_remaining, subscription_type, subscription_start_date, subscription_end_date, google_play_purchase_token, last_reset_date')
      .eq('id', userId)
      .single();

    const currentCredits = currentProfile?.applications_remaining ?? 0;

    // Credits and a fresh term are granted once per purchase. A restore, or the
    // store re-delivering a purchase we already activated (unfinished
    // transaction after an app restart), only re-establishes the plan —
    // otherwise tapping "Restore" repeatedly minted credits and pushed the
    // end date forward for free. Renewals add credits via the store webhooks.
    const alreadyActivated = !!googlePlayPurchaseToken
      && currentProfile?.google_play_purchase_token === googlePlayPurchaseToken
      && currentProfile?.subscription_type === 'premium';
    const existingEnd = currentProfile?.subscription_end_date ? new Date(currentProfile.subscription_end_date) : null;
    const keepTerm = (mode === 'restore' || alreadyActivated) && existingEnd !== null && existingEnd > startDate;
    const grantCredits = mode === 'purchase' && !alreadyActivated;

    const updateData: Record<string, any> = {
      subscription_type: 'premium',
      subscription_plan: plan,
      billing_period: billingPeriod,
      subscription_start_date: keepTerm ? (currentProfile?.subscription_start_date ?? startDate.toISOString()) : startDate.toISOString(),
      subscription_end_date: keepTerm ? existingEnd!.toISOString() : endDate.toISOString(),
      applications_remaining: grantCredits ? currentCredits + creditsPerMonth : currentCredits,
      applications_limit: creditsPerMonth,
      last_reset_date: grantCredits ? startDate.toISOString() : (currentProfile?.last_reset_date ?? startDate.toISOString()),
      subscription_status: 'active',
      ...(pricingRegion && { pricing_region: pricingRegion }),
      ...(googlePlayPurchaseToken && { google_play_purchase_token: googlePlayPurchaseToken }),
    };

    const { error: updateError } = await supabase.from('profiles').update(updateData).eq('id', userId);

    if (updateError && updateError.code === '42703') {
      // New columns don't exist yet — retry with only legacy columns
      const { error: retryError } = await supabase
        .from('profiles')
        .update({
          subscription_type: 'premium',
          subscription_start_date: updateData.subscription_start_date,
          subscription_end_date: updateData.subscription_end_date,
          applications_remaining: updateData.applications_remaining,
          applications_limit: creditsPerMonth,
          last_reset_date: updateData.last_reset_date,
          subscription_status: 'active',
          ...(googlePlayPurchaseToken && { google_play_purchase_token: googlePlayPurchaseToken }),
        })
        .eq('id', userId);
      if (retryError) throw retryError;
    } else if (updateError) {
      throw updateError;
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Renewal (webhook) ────────────────────────────────────────────────────────

export async function handleSubscriptionCharged(
  userId: string,
  productId: string,
  paymentId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const entitlement = PRODUCT_ENTITLEMENTS[productId] || PRODUCT_ENTITLEMENTS['nextquark_pro_monthly'];
    const { plan, billingPeriod, creditsPerMonth } = entitlement;

    const endDate = new Date();
    if (billingPeriod === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('applications_remaining')
      .eq('id', userId)
      .single();
    const currentRemaining = currentProfile?.applications_remaining || 0;

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: plan,
        billing_period: billingPeriod,
        subscription_end_date: endDate.toISOString(),
        applications_remaining: currentRemaining + creditsPerMonth,
        applications_limit: creditsPerMonth,
        last_reset_date: new Date().toISOString(),
        subscription_status: 'active',
      })
      .eq('id', userId);

    if (error) throw error;

    await supabase.from('payment_history').insert({
      user_id: userId,
      subscription_type: 'premium',
      subscription_plan: plan,
      billing_period: billingPeriod,
      amount,
      payment_id: paymentId,
      order_id: productId,
      status: 'completed',
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function handleSubscriptionFailed(
  userId: string,
  paymentId: string,
  subscriptionId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('applications_remaining, subscription_type')
      .eq('id', userId)
      .single();

    const currentRemaining = currentProfile?.applications_remaining || 0;

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_type: 'free',
        subscription_plan: 'free',
        subscription_status: 'payment_failed',
        applications_remaining: currentRemaining + FREE_CREDITS_PER_MONTH,
        applications_limit: FREE_CREDITS_PER_MONTH,
        google_play_purchase_token: null,
      })
      .eq('id', userId);

    if (error) throw error;

    await supabase.from('payment_history').insert({
      user_id: userId,
      subscription_type: currentProfile?.subscription_type || 'unknown',
      amount,
      payment_id: paymentId,
      order_id: subscriptionId,
      status: 'failed',
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_status: 'cancelled' })
      .eq('id', userId);

    if (error && error.code === '42703') {
      // subscription_status column doesn't exist
      return { success: true };
    } else if (error) {
      throw error;
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Get subscription status ──────────────────────────────────────────────────

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionData | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_type, subscription_plan, billing_period, pricing_region, subscription_start_date, subscription_end_date, applications_remaining, applications_limit, google_play_purchase_token, subscription_status')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return _defaultFreeData();
      }
      // Fallback for missing columns
      if (error.code === '42703') {
        const { data: d2, error: e2 } = await supabase
          .from('profiles')
          .select('subscription_type, subscription_start_date, subscription_end_date, applications_remaining, applications_limit, subscription_status')
          .eq('id', userId)
          .single();
        if (e2) throw e2;
        return _mapProfileToSubscriptionData(d2);
      }
      throw error;
    }

    return _mapProfileToSubscriptionData(data);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

function _defaultFreeData(): SubscriptionData {
  return {
    subscription_type: 'free',
    subscription_plan: 'free',
    billing_period: 'monthly',
    pricing_region: 'INTL',
    subscription_start_date: null,
    subscription_end_date: null,
    credits_remaining: FREE_CREDITS_PER_MONTH,
    credits_limit: FREE_CREDITS_PER_MONTH,
  };
}

// A renewal webhook can arrive a little after the period ends; don't drop an
// auto-renewing subscriber to free in that gap.
const RENEWAL_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Whether the stored subscription currently grants paid access.
 *
 *   active        auto-renewing: access until end date (+ renewal grace)
 *   grace_period  store is retrying billing: access until end date (+ grace)
 *   cancelled     auto-renew turned off: access until the paid end date only
 *   payment_failed / anything else: no access
 */
export function hasPaidAccess(data: any, now = Date.now()): boolean {
  if (data?.subscription_type !== 'premium') return false;
  const status: string | null = data?.subscription_status || null;
  const end = data?.subscription_end_date ? new Date(data.subscription_end_date).getTime() : null;

  if (status === 'cancelled') return end !== null && end > now;
  if (status === null || status === 'active' || status === 'grace_period') {
    return end === null || end + RENEWAL_GRACE_MS > now;
  }
  return false;
}

/** Profile row → what the app treats as the user's subscription (pure; exported for tests). */
export function subscriptionFromProfile(data: any): SubscriptionData {
  return _mapProfileToSubscriptionData(data);
}

function _mapProfileToSubscriptionData(data: any): SubscriptionData {
  const subStatus = data?.subscription_status || null;
  const paid = hasPaidAccess(data);

  const resolvedType: SubscriptionType = paid ? 'premium' : 'free';

  const resolvedPlan: PlanId = paid
    ? ((data?.subscription_plan || 'pro') as PlanId)
    : 'free';

  return {
    subscription_type: resolvedType,
    subscription_plan: resolvedPlan,
    billing_period: (data?.billing_period || 'monthly') as BillingPeriod,
    pricing_region: (data?.pricing_region || 'INTL') as PricingRegion,
    subscription_start_date: data?.subscription_start_date || null,
    subscription_end_date: data?.subscription_end_date || null,
    credits_remaining: data?.applications_remaining ?? FREE_CREDITS_PER_MONTH,
    credits_limit: data?.applications_limit ?? FREE_CREDITS_PER_MONTH,
    google_play_purchase_token: data?.google_play_purchase_token || null,
    subscription_status: subStatus,
    lapsed_plan: lapsedPlanOf(data, paid),
  };
}

/** A paid plan that has lapsed: premium row past its term, or one the server expired. */
function lapsedPlanOf(data: any, paid: boolean): PlanId | null {
  if (paid) return null;
  const plan = data?.subscription_plan as PlanId | undefined;
  const wasPaid = data?.subscription_type === 'premium' || data?.subscription_status === 'expired';
  if (wasPaid && plan && plan !== 'free') return plan;
  return null;
}

// ─── Transaction history ──────────────────────────────────────────────────────

export async function getTransactionHistory(userId: string, limit = 20): Promise<TransactionRecord[]> {
  try {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) return [];
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

// ─── Expire subscription ──────────────────────────────────────────────────────

export async function expireSubscription(userId: string, currentRemaining?: number): Promise<void> {
  const remaining = currentRemaining ?? FREE_CREDITS_PER_MONTH;
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_type: 'free',
      subscription_plan: 'free',
      subscription_start_date: null,
      subscription_end_date: null,
      applications_limit: FREE_CREDITS_PER_MONTH,
      applications_remaining: remaining,
      google_play_purchase_token: null,
      subscription_status: null,
    })
    .eq('id', userId);

  if (error && error.code === '42703') {
    await supabase
      .from('profiles')
      .update({ subscription_type: 'free', subscription_start_date: null, subscription_end_date: null, applications_limit: FREE_CREDITS_PER_MONTH, applications_remaining: remaining })
      .eq('id', userId);
  }
}

// ─── Credit consumption ───────────────────────────────────────────────────────

/**
 * Atomically consume one paid credit.
 * Returns true if a credit was consumed.
 */
export async function decrementApplicationCount(userId: string): Promise<boolean> {
  try {
    // Server-side conditional UPDATE: race-free across concurrent swipes.
    const { data, error } = await supabase.rpc('consume_application_credit');
    if (!error) return typeof data === 'number' && data >= 0;
    // PGRST202 / 42883: RPC not deployed yet — fall through to the legacy path.
    if (error.code !== 'PGRST202' && error.code !== '42883') return false;

    const { data: row } = await supabase
      .from('profiles')
      .select('applications_remaining')
      .eq('id', userId)
      .single();
    if (!row || row.applications_remaining <= 0) return false;

    // Compare-and-set: a 0-row update means another swipe won the race.
    const { data: updated } = await supabase
      .from('profiles')
      .update({ applications_remaining: row.applications_remaining - 1 })
      .eq('id', userId)
      .eq('applications_remaining', row.applications_remaining)
      .select('id');
    return !!updated?.length;
  } catch (error) {
    return false;
  }
}

/** Restore a credit (e.g. on failed application submission) */
export async function restoreCredit(userId: string): Promise<void> {
  try {
    const { data } = await supabase.from('profiles').select('applications_remaining').eq('id', userId).single();
    if (data) {
      await supabase.from('profiles').update({ applications_remaining: data.applications_remaining + 1 }).eq('id', userId);
    }
  } catch (error) {
    console.error('Error restoring credit:', error);
  }
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function getPlanDisplayName(plan: PlanId): string {
  const names: Record<PlanId, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', ultra: 'Ultra' };
  return names[plan] || 'Free';
}

export function getSubscriptionDisplayName(type: SubscriptionType): string {
  return type === 'premium' ? 'Premium' : 'Free';
}

export function getSubscriptionBadgeColor(type: SubscriptionType): string {
  return type === 'premium' ? '#E65100' : '#757575';
}

export function isPaidPlan(plan: PlanId): boolean {
  return plan !== 'free';
}
