/**
 * Working offline for a while.
 *
 * - React Query is told about connectivity (NetInfo → onlineManager), so
 *   queries pause offline instead of failing; the persisted cache
 *   (app/_layout.tsx) keeps showing jobs, applications and mail.
 * - Fetchers rethrow network errors (isNetworkError) rather than returning
 *   [], which used to overwrite the cached list with "No applications".
 * - Right swipes made offline are kept in a device queue and sent — charged
 *   to the user's free swipes / credits first, as online — once the
 *   connection is back (flushPendingApplications). The deck keeps working from
 *   the on-device job cache meanwhile.
 */
import { useSyncExternalStore } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager } from '@tanstack/react-query';

let online = true;
const listeners = new Set<() => void>();

/** Call once at startup. */
export function startConnectivity() {
  onlineManager.setEventListener(setOnline => NetInfo.addEventListener(state => {
    // isInternetReachable is null while unknown: treat as online until proven otherwise.
    const next = !!state.isConnected && state.isInternetReachable !== false;
    setOnline(next);
    if (next !== online) {
      online = next;
      listeners.forEach(l => l());
    }
  }));
}

export function isOnline(): boolean {
  return online;
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => online, () => true);
}

/** A failed request because there is no connection (not a server / auth error). */
export function isNetworkError(e: unknown): boolean {
  if (!online) return true;
  const msg = String((e as any)?.message ?? e ?? '').toLowerCase();
  return /network request failed|failed to fetch|network error|networkerror|timed out|timeout|offline|internet connection appears/.test(msg);
}

// ─── Offline apply queue ─────────────────────────────────────────────────────

const PENDING_KEY = 'iris_pending_applications_v1';

export interface PendingApplication {
  jobId: string;
  job: Record<string, unknown>;
  at: number;
}

export async function readPendingApplications(): Promise<PendingApplication[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writePending(list: PendingApplication[]) {
  try { await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(list)); } catch {}
}

export async function queuePendingApplication(job: { id: string } & Record<string, unknown>) {
  const list = await readPendingApplications();
  if (list.some(p => p.jobId === job.id)) return;
  list.push({ jobId: job.id, job, at: Date.now() });
  await writePending(list);
}

let flushing = false;

/**
 * Send queued offline applications. `apply` charges and submits one (returns
 * 'ok', 'no-credits' or 'retry'); 'no-credits' drops it (the user ran out
 * while offline), 'retry' keeps it for the next attempt.
 */
export async function flushPendingApplications(
  apply: (p: PendingApplication) => Promise<'ok' | 'no-credits' | 'retry'>,
): Promise<{ sent: number; dropped: number }> {
  if (flushing || !online) return { sent: 0, dropped: 0 };
  flushing = true;
  let sent = 0, dropped = 0;
  try {
    const list = await readPendingApplications();
    const keep: PendingApplication[] = [];
    for (const p of list) {
      const r = await apply(p).catch(() => 'retry' as const);
      if (r === 'ok') sent++;
      else if (r === 'no-credits') dropped++;
      else keep.push(p);
    }
    await writePending(keep);
  } finally {
    flushing = false;
  }
  return { sent, dropped };
}
