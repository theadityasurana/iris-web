/**
 * Website-only integrations. Choices live in `web_integrations` with a local copy,
 * so the page works before the table exists.
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@web/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

export type IntegrationStatus = 'off' | 'requested' | 'linked';
export interface Integration { provider: string; status: IntegrationStatus; settings: { profile_url?: string } }
type Store = Record<string, Integration>;

const KEY = 'iris_integrations_v1';

function readLocal(): Store {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function writeLocal(store: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* private mode */ }
}

async function syncIntegrations(userId: string): Promise<Store | null> {
  const { data, error } = await supabase.from('web_integrations').select('provider, status, settings').eq('user_id', userId);
  if (error || !data) return null;
  const store = Object.fromEntries((data as Integration[]).map(i => [i.provider, i]));
  writeLocal(store);
  return store;
}

export function useIntegrations() {
  const { userId } = useAuth();
  const [store, setStore] = useState<Store>(readLocal);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    syncIntegrations(userId).then(remote => { if (live && remote) setStore(remote); });
    return () => { live = false; };
  }, [userId]);

  const set = useCallback(async (provider: string, status: IntegrationStatus, settings: Integration['settings'] = {}) => {
    const row: Integration = { provider, status, settings };
    setStore(prev => {
      const next = { ...prev, [provider]: row };
      writeLocal(next);
      return next;
    });
    if (!userId) return;
    await supabase.from('web_integrations').upsert({ user_id: userId, provider, status, settings, updated_at: new Date().toISOString() });
  }, [userId]);

  return { store, set };
}
