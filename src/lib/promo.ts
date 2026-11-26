/**
 * Partner / influencer promo codes (e.g. irisjobs.live/?code=ARJUN10).
 *
 * The landing page and the app both read `?code=` and keep it in localStorage
 * (same origin, so it carries from the landing page into /app). Once the visitor
 * signs in it is also copied to their auth user_metadata, so it survives a
 * different browser or device. Checkout sends it to Dodo, which pre-applies it.
 */
import { supabase } from '@/lib/supabase';

export const PROMO_KEY = 'iris_promo_code';
const TTL_MS = 90 * 24 * 60 * 60 * 1000;
const VALID = /^[A-Z0-9_-]{3,32}$/;

export const normPromo = (c: unknown) => {
  const v = String(c ?? '').trim().toUpperCase();
  return VALID.test(v) ? v : null;
};

export function setPromoCode(code: string) {
  const c = normPromo(code);
  if (!c) return;
  try { localStorage.setItem(PROMO_KEY, JSON.stringify({ code: c, at: Date.now() })); } catch { /* private mode */ }
}

export function getPromoCode(): string | null {
  try {
    const raw = localStorage.getItem(PROMO_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v?.code || Date.now() - (v.at || 0) > TTL_MS) return null;
    return normPromo(v.code);
  } catch { return null; }
}

/** Reads ?code= (or ?promo=) from the URL, saves it, and tidies the URL. */
export function capturePromoFromUrl() {
  try {
    const url = new URL(window.location.href);
    const code = normPromo(url.searchParams.get('code') ?? url.searchParams.get('promo'));
    if (!code) return;
    setPromoCode(code);
    url.searchParams.delete('code'); url.searchParams.delete('promo');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  } catch { /* ignore */ }
}

/** Keeps the browser copy and the account copy in step after sign-in. */
export function syncPromoWithUser(meta: Record<string, unknown> | undefined) {
  const local = getPromoCode();
  const remote = normPromo(meta?.promo_code);
  if (local && local !== remote) {
    void supabase.auth.updateUser({ data: { promo_code: local } }).catch(() => {});
  } else if (!local && remote) {
    setPromoCode(remote);
  }
}
