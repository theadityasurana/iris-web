import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '@/types';

// v2: v1 caches could hold generic jobs from a keyword-less rescue query
// (and older relevance rules); bumping discards them on every device.
const CACHE_VERSION = 2;
const CACHE_TTL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

interface TabCache {
  version: number;
  userId: string;
  tab: string;
  jobs: Job[];
  offset: number;
  savedAt: number;
}

function cacheKey(userId: string, tab: string): string {
  return `nextquark_jobs_cache_v${CACHE_VERSION}_${userId}_${tab}`;
}

let staleVersionsPurged = false;
/** Once per launch: delete caches written under older versions. */
async function purgeStaleVersions(): Promise<void> {
  if (staleVersionsPurged) return;
  staleVersionsPurged = true;
  const current = `nextquark_jobs_cache_v${CACHE_VERSION}_`;
  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter(k => k.startsWith('nextquark_jobs_cache_v') && !k.startsWith(current));
  if (stale.length) await AsyncStorage.multiRemove(stale);
}

export async function readJobCache(userId: string, tab: string): Promise<{ jobs: Job[]; offset: number } | null> {
  try {
    await purgeStaleVersions().catch(() => {});
    const raw = await AsyncStorage.getItem(cacheKey(userId, tab));
    if (!raw) return null;
    const cache: TabCache = JSON.parse(raw);
    if (cache.version !== CACHE_VERSION) return null;
    if (cache.userId !== userId) return null;
    if (Date.now() - cache.savedAt > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(cacheKey(userId, tab));
      return null;
    }
    return { jobs: cache.jobs, offset: cache.offset };
  } catch {
    return null;
  }
}

export async function writeJobCache(userId: string, tab: string, jobs: Job[], offset: number): Promise<void> {
  try {
    const cache: TabCache = {
      version: CACHE_VERSION,
      userId,
      tab,
      jobs,
      offset,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(cacheKey(userId, tab), JSON.stringify(cache));
  } catch {
    // Non-critical — silently ignore write failures
  }
}

export async function clearJobCache(userId: string): Promise<void> {
  try {
    const keys = [cacheKey(userId, 'unified')];
    await AsyncStorage.multiRemove(keys);
  } catch {}
}

export async function clearAllJobCaches(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(k => k.startsWith(`nextquark_jobs_cache_v${CACHE_VERSION}_`));
    if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
  } catch {}
}
