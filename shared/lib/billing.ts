import { Platform } from 'react-native';

let IAP: typeof import('react-native-iap') | null = null;

try {
  IAP = require('react-native-iap');
} catch {
  if (__DEV__) console.log('react-native-iap not available (Expo Go), billing disabled');
}

// ─── Plan types ───────────────────────────────────────────────────────────────

export type PlanId = 'free' | 'starter' | 'pro' | 'ultra';
export type BillingPeriod = 'monthly' | 'quarterly';
export type PricingRegion = 'IN' | 'INTL';

export interface PlanEntitlement {
  plan: PlanId;
  billingPeriod: BillingPeriod;
  creditsPerMonth: number;
}

// ─── Product IDs ──────────────────────────────────────────────────────────────
// These must match App Store Connect and Google Play Console exactly.
// Legacy SKUs are preserved for backward compatibility.

export const SUBSCRIPTION_SKUS = {
  // Legacy (preserved — do not remove)
  premium_monthly: 'nq_premium_monthly',
  premium_weekly: 'nq_premium_weekly',

  // v2 plans
  starter_monthly: 'nextquark_starter_monthly',
  starter_quarterly: 'nextquark_starter_quarterly',
  pro_monthly: 'nextquark_pro_monthly',
  pro_quarterly: 'nextquark_pro_quarterly',
  ultra_monthly: 'nextquark_ultra_monthly',
  ultra_quarterly: 'nextquark_ultra_quarterly',
} as const;

export type SubscriptionSku = typeof SUBSCRIPTION_SKUS[keyof typeof SUBSCRIPTION_SKUS];

// All active v2 SKUs (legacy SKUs still fetched separately for restore)
export const ALL_SKUS: string[] = [
  SUBSCRIPTION_SKUS.starter_monthly,
  SUBSCRIPTION_SKUS.starter_quarterly,
  SUBSCRIPTION_SKUS.pro_monthly,
  SUBSCRIPTION_SKUS.pro_quarterly,
  SUBSCRIPTION_SKUS.ultra_monthly,
  SUBSCRIPTION_SKUS.ultra_quarterly,
];

export const LEGACY_SKUS: string[] = [
  SUBSCRIPTION_SKUS.premium_monthly,
  SUBSCRIPTION_SKUS.premium_weekly,
];

// ─── Product → Entitlement map ────────────────────────────────────────────────

export const PRODUCT_ENTITLEMENTS: Record<string, PlanEntitlement> = {
  // Legacy → mapped to pro monthly (closest equivalent)
  nq_premium_monthly: { plan: 'pro', billingPeriod: 'monthly', creditsPerMonth: 200 },
  nq_premium_weekly: { plan: 'pro', billingPeriod: 'monthly', creditsPerMonth: 200 },

  // v2
  nextquark_starter_monthly: { plan: 'starter', billingPeriod: 'monthly', creditsPerMonth: 75 },
  nextquark_starter_quarterly: { plan: 'starter', billingPeriod: 'quarterly', creditsPerMonth: 75 },
  nextquark_pro_monthly: { plan: 'pro', billingPeriod: 'monthly', creditsPerMonth: 200 },
  nextquark_pro_quarterly: { plan: 'pro', billingPeriod: 'quarterly', creditsPerMonth: 200 },
  nq_power_monthly: { plan: 'ultra', billingPeriod: 'monthly', creditsPerMonth: 500 },
  nq_power_quarterly: { plan: 'ultra', billingPeriod: 'quarterly', creditsPerMonth: 500 },
  nq_max_monthly: { plan: 'ultra', billingPeriod: 'monthly', creditsPerMonth: 500 },
  nq_max_quarterly: { plan: 'ultra', billingPeriod: 'quarterly', creditsPerMonth: 500 },
  nextquark_ultra_monthly: { plan: 'ultra', billingPeriod: 'monthly', creditsPerMonth: 500 },
  nextquark_ultra_quarterly: { plan: 'ultra', billingPeriod: 'quarterly', creditsPerMonth: 500 },
};

// ─── Pricing config (display only — authoritative prices come from the store) ─

export interface PlanConfig {
  id: PlanId;
  label: string;
  creditsPerMonth: number;
  mostPopular?: boolean;
  /** Available in this region */
  regions: PricingRegion[];
  pricing: {
    IN: { monthly: number; quarterly: number; currency: '₹' };
    INTL: { monthly: number; quarterly: number; currency: '$' };
  };
  skus: { monthly: SubscriptionSku; quarterly: SubscriptionSku };
}

export const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: 'starter',
    label: 'Starter',
    creditsPerMonth: 75,
    regions: ['IN', 'INTL'],
    pricing: {
      IN: { monthly: 499, quarterly: 1199, currency: '₹' },
      INTL: { monthly: 19.99, quarterly: 47.99, currency: '$' },
    },
    skus: { monthly: SUBSCRIPTION_SKUS.starter_monthly, quarterly: SUBSCRIPTION_SKUS.starter_quarterly },
  },
  {
    id: 'pro',
    label: 'Pro',
    creditsPerMonth: 200,
    mostPopular: true,
    regions: ['IN', 'INTL'],
    pricing: {
      IN: { monthly: 999, quarterly: 2399, currency: '₹' },
      INTL: { monthly: 39.99, quarterly: 95.99, currency: '$' },
    },
    skus: { monthly: SUBSCRIPTION_SKUS.pro_monthly, quarterly: SUBSCRIPTION_SKUS.pro_quarterly },
  },
  {
    id: 'ultra',
    label: 'Ultra',
    creditsPerMonth: 500,
    regions: ['IN', 'INTL'],
    pricing: {
      IN: { monthly: 2199, quarterly: 5999, currency: '₹' },
      INTL: { monthly: 59.99, quarterly: 143.99, currency: '$' },
    },
    skus: { monthly: SUBSCRIPTION_SKUS.ultra_monthly, quarterly: SUBSCRIPTION_SKUS.ultra_quarterly },
  },
];

/** Website-only Trial plan (Dodo): recurring every 14 days, kept apart from the three tiers. */
export const TRIAL_PLAN = {
  id: 'trial',
  label: 'Trial',
  credits: 30,
  days: 14,
  pricing: {
    IN: { price: 199, currency: '₹' as const },
    INTL: { price: 9.99, currency: '$' as const },
  },
};

export const FREE_CREDITS_PER_MONTH = 10;

/** Display-only FX. Store / billing amounts stay in the regional currency. */
export const INR_PER_USD = 95.96;

export function getPlansForRegion(region: PricingRegion): PlanConfig[] {
  return PLAN_CONFIGS.filter(p => p.regions.includes(region));
}

/** Round a USD amount to the closest $X.99. */
export function nearestDollar99(usd: number): number {
  const k = Math.max(0, Math.round(usd - 0.99));
  return k + 0.99;
}

/** UI-only USD amount. INR list prices are converted; USD list prices are unchanged. */
export function toDisplayUsd(price: number, currency: '₹' | '$'): number {
  if (currency === '₹') return nearestDollar99(price / INR_PER_USD);
  return price;
}

export function formatDisplayUsd(price: number, currency: '₹' | '$'): string {
  return `$${toDisplayUsd(price, currency).toFixed(2)}`;
}

// ─── Billing connection ───────────────────────────────────────────────────────

let isConnected = false;

export async function setupBilling(): Promise<boolean> {
  if (Platform.OS === 'web' || !IAP) return false;
  try {
    await IAP.initConnection();
    isConnected = true;
    return true;
  } catch (error) {
    console.error('Failed to connect to billing:', error);
    return false;
  }
}

export async function teardownBilling(): Promise<void> {
  if (isConnected && IAP) {
    await IAP.endConnection();
    isConnected = false;
  }
}

export async function fetchSubscriptions(skus: string[] = ALL_SKUS) {
  if (!IAP) return [];
  try {
    return await IAP.fetchProducts({ skus, type: 'subs' });
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return [];
  }
}

async function resolveAndroidOfferToken(sku: string, offerToken?: string): Promise<string | undefined> {
  if (offerToken) return offerToken;
  if (Platform.OS !== 'android' || !IAP) return undefined;
  try {
    const products = await IAP.fetchProducts({ skus: [sku], type: 'subs' });
    const product: any = products?.[0];
    const offers = product?.subscriptionOfferDetailsAndroid ?? product?.subscriptionOfferDetails;
    return offers?.[0]?.offerToken as string | undefined;
  } catch (error) {
    console.error('Failed to resolve Android offer token:', error);
    return undefined;
  }
}

export async function buySubscription(sku: string, offerToken?: string): Promise<boolean> {
  if (!IAP) return false;
  try {
    const androidOfferToken = await resolveAndroidOfferToken(sku, offerToken);
    await IAP.requestPurchase({
      request: {
        google: {
          skus: [sku],
          ...(androidOfferToken && { subscriptionOffers: [{ sku, offerToken: androidOfferToken }] }),
        },
        apple: { sku },
      },
      type: 'subs',
    });
    return true;
  } catch (error) {
    console.error('Subscription purchase failed:', error);
    return false;
  }
}

export async function acknowledgePurchase(purchase: any): Promise<void> {
  if (!IAP) return;
  try {
    await IAP.finishTransaction({ purchase, isConsumable: false });
  } catch (error) {
    console.error('Failed to acknowledge purchase:', error);
  }
}

export async function restorePurchases() {
  if (!IAP) return [];
  try {
    return await IAP.getAvailablePurchases();
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return [];
  }
}

export type ProductPurchase = import('react-native-iap').Purchase;
export type SubscriptionPurchase = import('react-native-iap').Purchase;
export type PurchaseError = import('react-native-iap').PurchaseError;

export function isBillingAvailable(): boolean {
  return IAP !== null;
}

export const purchaseUpdatedListener = IAP?.purchaseUpdatedListener ?? (() => ({ remove: () => {} }));
export const purchaseErrorListener = IAP?.purchaseErrorListener ?? (() => ({ remove: () => {} }));
