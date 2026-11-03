/** Browser shim for lib/offline.ts — uses navigator.onLine instead of NetInfo, localStorage instead of AsyncStorage. */
import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

let online = navigator.onLine;
const listeners = new Set<() => void>();

export function startConnectivity() {
  const update = (next: boolean) => {
    onlineManager.setOnline(next);
    if (next !== online) { online = next; listeners.forEach(l => l()); }
  };
  window.addEventListener('online', () => update(true));
  window.addEventListener('offline', () => update(false));
}

export function isOnline(): boolean { return online; }

export function useIsOnline(): boolean {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => online, () => true);
}

export function isNetworkError(e: unknown): boolean {
  if (!online) return true;
  const msg = String((e as any)?.message ?? e ?? '').toLowerCase();
  return /network request failed|failed to fetch|network error|networkerror|timed out|timeout|offline|internet connection appears/.test(msg);
}

const PENDING_KEY = 'iris_pending_applications_v1';
export interface PendingApplication { jobId: string; job: Record<string, unknown>; at: number; }

export async function readPendingApplications(): Promise<PendingApplication[]> {
  try { const raw = localStorage.getItem(PENDING_KEY); const list = raw ? JSON.parse(raw) : []; return Array.isArray(list) ? list : []; } catch { return []; }
}
async function writePending(list: PendingApplication[]) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(list)); } catch {}
}
export async function queuePendingApplication(job: { id: string } & Record<string, unknown>) {
  const list = await readPendingApplications();
  if (list.some(p => p.jobId === job.id)) return;
  list.push({ jobId: job.id, job, at: Date.now() });
  await writePending(list);
}
let flushing = false;
export async function flushPendingApplications(apply: (p: PendingApplication) => Promise<'ok' | 'no-credits' | 'retry'>): Promise<{ sent: number; dropped: number }> {
  if (flushing || !online) return { sent: 0, dropped: 0 };
  flushing = true;
  let sent = 0, dropped = 0;
  try {
    const list = await readPendingApplications();
    const keep: PendingApplication[] = [];
    for (const p of list) {
      const r = await apply(p).catch(() => 'retry' as const);
      if (r === 'ok') sent++; else if (r === 'no-credits') dropped++; else keep.push(p);
    }
    await writePending(keep);
  } finally { flushing = false; }
  return { sent, dropped };
}
