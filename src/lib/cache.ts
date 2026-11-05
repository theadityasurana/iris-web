/**
 * Device cache: returning users see their data immediately while it refreshes
 * in the background. Everything here is cleared on sign-out, and secrets are
 * never written to disk.
 */
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const QUERY_KEY = 'iris-query-cache-v1';
const PROFILE_KEY = 'iris-profile-cache-v1';
const DAY = 24 * 60 * 60_000;
const SECRET_FIELDS = /password|secret|token/i;

/** Queries worth keeping between visits. Job feeds have their own cache. */
const PERSISTED = new Set(['subscription-status', 'daily-swipes', 'user-applications', 'unread-mail', 'featured-companies', 'saved-jobs', 'transactions', 'all-companies', 'web-plan']);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000, gcTime: DAY },
  },
});

const safeStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: k => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, v); } catch { /* quota or private mode */ } },
  removeItem: k => { try { localStorage.removeItem(k); } catch { /* private mode */ } },
};

export const persistOptions = {
  persister: createSyncStoragePersister({ storage: safeStorage, key: QUERY_KEY, throttleTime: 2000 }),
  maxAge: 7 * DAY,
  buster: 'v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (q: { queryKey: readonly unknown[]; state: { status: string } }) =>
      q.state.status === 'success' && PERSISTED.has(String(q.queryKey[0])),
  },
};

function withoutSecrets(row: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (SECRET_FIELDS.test(k) || k === 'onboarding_data') continue;
    out[k] = v;
  }
  return out;
}

export function writeCachedProfile(uid: string, row: Record<string, any>) {
  safeStorage.setItem(PROFILE_KEY, JSON.stringify({ uid, at: Date.now(), row: withoutSecrets(row) }));
}

export function readCachedProfile(uid: string): Record<string, any> | null {
  try {
    const raw = safeStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Only finished accounts: onboarding needs the full, fresh row.
    if (parsed.uid !== uid || Date.now() - parsed.at > 7 * DAY || parsed.row?.is_onboarding_complete !== true) return null;
    return parsed.row;
  } catch { return null; }
}

export function clearDeviceCache() {
  safeStorage.removeItem(QUERY_KEY);
  safeStorage.removeItem(PROFILE_KEY);
}
