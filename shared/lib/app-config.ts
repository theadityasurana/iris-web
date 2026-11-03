import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'app_config_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface AppConfig {
  show_location_on_card: boolean;
}

interface CachedConfig {
  config: AppConfig;
  fetchedAt: number;
}

const DEFAULT_CONFIG: AppConfig = {
  show_location_on_card: true,
};

// In-memory cache so repeated calls within the same session are instant
let memCache: CachedConfig | null = null;

// Returns the last known config synchronously (from memory cache).
// Returns null if nothing is cached yet — caller should show nothing until
// fetchAppConfig() resolves.
export function getAppConfigSync(): AppConfig | null {
  return memCache ? memCache.config : null;
}

// Primes the in-memory cache from AsyncStorage so getAppConfigSync()
// returns a value before the first network fetch completes.
// Call this once at app startup (before rendering the home screen).
export async function primeAppConfigCache(): Promise<void> {
  if (memCache) return; // already primed
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: CachedConfig = JSON.parse(raw);
      memCache = cached;
    }
  } catch {}
}

export async function fetchAppConfig(): Promise<AppConfig> {
  // 1. Return in-memory cache if fresh
  if (memCache && Date.now() - memCache.fetchedAt < CACHE_TTL_MS) {
    return memCache.config;
  }

  // 2. Try fetching from Supabase
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value');

    if (!error && data && data.length > 0) {
      const config: AppConfig = { ...DEFAULT_CONFIG };
      for (const row of data) {
        if (row.key === 'show_location_on_card') {
          config.show_location_on_card = row.value !== 'false';
        }
      }
      memCache = { config, fetchedAt: Date.now() };
      // Persist to AsyncStorage as offline fallback
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memCache)).catch(() => {});
      return config;
    }
  } catch (e) {
    console.log('[APP_CONFIG] Fetch failed, falling back to cache:', e);
  }

  // 3. Fall back to AsyncStorage cache (stale is fine — better than crashing)
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: CachedConfig = JSON.parse(raw);
      memCache = cached;
      return cached.config;
    }
  } catch {}

  // 4. Hard default
  return DEFAULT_CONFIG;
}

// Call this from your backend toggle endpoint response handler
// to immediately invalidate the in-memory cache
export function invalidateAppConfigCache() {
  memCache = null;
}
