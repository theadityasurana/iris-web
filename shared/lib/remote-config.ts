import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { DEFAULT_REMOTE_CONFIG, type RemoteConfig, type RemoteConfigKey } from '@/constants/remote-config-defaults';
import { setFeedTuning } from '@/lib/feed-policy';

/**
 * Remote config: settings the admin website edits in the `remote_config`
 * table, applied without an app update.
 *
 * - Built-in defaults (constants/remote-config-defaults.ts) are used until the
 *   server answers, and whenever it can't be reached.
 * - Every stored value is checked against the default's shape; anything with
 *   the wrong type is ignored field by field, so a typo in the admin panel can
 *   never crash the app — it just keeps the default for that field.
 * - Fetched at launch and again when the app returns to the foreground after
 *   REFRESH_MS; the last good copy is cached on the device.
 */

const CACHE_KEY = 'nextquark_remote_config_v1';
const REFRESH_MS = 5 * 60 * 1000;

export type { RemoteConfig, RemoteConfigKey };

import { buildRemoteConfig as build, sanitize } from '@/lib/remote-config-core';
export { sanitize };

type Json = unknown;

let current: RemoteConfig = DEFAULT_REMOTE_CONFIG;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: RemoteConfig) {
  current = next;
  setFeedTuning(next.feed);
  listeners.forEach((l) => l());
}

/** The whole config, synchronously (defaults until loaded). */
export function getRemoteConfig(): RemoteConfig {
  return current;
}

/** One section, synchronously. */
export function rc<K extends RemoteConfigKey>(key: K): RemoteConfig[K] {
  return current[key];
}

/** One section as React state: re-renders when the admin changes it. */
export function useRemoteConfig<K extends RemoteConfigKey>(key: K): RemoteConfig[K] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => current[key],
    () => current[key],
  );
}

/** Fill `{placeholder}`s. Reward amounts are always available. */
export function fmt(text: string, vars: Record<string, string | number | null | undefined> = {}): string {
  const all: Record<string, string | number | null | undefined> = {
    referral_reward: current.limits.referral_reward_referee,
    follow_reward: current.limits.social_follow_reward,
    ...vars,
  };
  return text.replace(/\{(\w+)\}/g, (m, k) => (all[k] === undefined || all[k] === null ? m : String(all[k])));
}

async function fetchNow(): Promise<void> {
  try {
    const { data, error } = await supabase.from('remote_config').select('key, value');
    if (error || !data) return;
    const next = build(data as { key: string; value: Json }[]);
    fetchedAt = Date.now();
    publish(next);
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
  } catch {
    // Offline or table missing: keep what we have.
  }
}

/** Refresh unless fetched within REFRESH_MS (pass force to skip that check). */
export function refreshRemoteConfig(force = false): Promise<void> {
  if (!force && Date.now() - fetchedAt < REFRESH_MS) return Promise.resolve();
  if (!inflight) inflight = fetchNow().finally(() => { inflight = null; });
  return inflight;
}

let startPromise: Promise<void> | null = null;

/**
 * Call once at launch. Resolves as soon as the cached copy is applied (fast,
 * on-device); the network fetch carries on in the background and keeps the
 * config fresh on every return to the foreground.
 */
export function startRemoteConfig(): Promise<void> {
  if (startPromise) return startPromise;
  startPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) publish(build(JSON.parse(raw)));
    } catch {}
    AppState.addEventListener('change', (s) => { if (s === 'active') refreshRemoteConfig(); });
    refreshRemoteConfig(true);
  })();
  return startPromise;
}
