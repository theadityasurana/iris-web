import { useEffect, useState } from 'react';

/**
 * "Add Iris to your home screen" support.
 *
 * Chrome/Android fires `beforeinstallprompt` once, early, so this module is imported
 * from main.tsx to catch it before any component mounts. iOS has no install API, so
 * there we show Share → "Add to Home Screen" steps instead.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(fn => fn());

const STORE_KEY = 'iris-pwa-prompt';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SHOWS = 3;

type PromptState = { shows: number; last: number; installed?: boolean };
function readState(): PromptState {
  try { return { shows: 0, last: 0, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; } catch { return { shows: 0, last: 0 }; }
}
function writeState(s: PromptState) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* private mode */ }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); // we show our own sheet instead of Chrome's mini-infobar
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    writeState({ ...readState(), installed: true });
    notify();
  });
}

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
export const isIOS = /iPhone|iPad|iPod/i.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = /Android/i.test(ua);
export const isPhone = isIOS || isAndroid;
/** Instagram, Facebook, LinkedIn, etc. open links in their own browser, which can't add to the home screen. */
export const inAppBrowser = /Instagram|FBAN|FBAV|FB_IAB|LinkedInApp|Line\/|Snapchat|Twitter|musical_ly|TikTok|; wv\)/i.test(ua);

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

/** Which instructions to show. */
export type InstallMode = 'prompt' | 'ios' | 'android-menu' | 'in-app' | 'none';

export function installMode(): InstallMode {
  if (isStandalone()) return 'none';
  if (inAppBrowser && isPhone) return 'in-app';
  if (isIOS) return 'ios'; // iOS never offers an install API
  if (deferred) return 'prompt';
  if (isAndroid) return 'android-menu';
  return 'none'; // desktop without Chrome's install support
}

/** Re-renders when the install prompt becomes available or the app gets installed. */
export function useInstall() {
  const [mode, setMode] = useState<InstallMode>(installMode);
  useEffect(() => {
    const fn = () => setMode(installMode());
    listeners.add(fn);
    fn();
    return () => { listeners.delete(fn); };
  }, []);
  return mode;
}

/** Opens Chrome's native install dialog. Resolves true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred;
  if (!e) return false;
  deferred = null; // the event can only be used once
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === 'accepted') writeState({ ...readState(), installed: true });
  notify();
  return outcome === 'accepted';
}

/** Whether the Home sheet should open now: phones only, at most 3 times, a week apart. */
export function shouldAutoShow(): boolean {
  if (!isPhone || installMode() === 'none') return false;
  const s = readState();
  if (s.installed || s.shows >= MAX_SHOWS) return false;
  return Date.now() - s.last > SNOOZE_MS;
}

export function markShown() {
  const s = readState();
  writeState({ ...s, shows: s.shows + 1, last: Date.now() });
}
