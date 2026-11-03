import { supabase } from './supabase';

type Listener = (count: number) => void;

let unreadCount = 0;
const listeners = new Set<Listener>();
let unsubscribe: (() => void) | null = null;

export function getUnreadCount(): number {
  return unreadCount;
}

export function subscribeUnreadCount(listener: Listener): () => void {
  listeners.add(listener);
  listener(unreadCount);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((l) => l(unreadCount));
}

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('inbound_emails')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_archived', false);

  if (error) {
    if (__DEV__) console.log('fetchUnreadCount error:', error.message);
    return 0;
  }
  return count || 0;
}

export async function initUnreadMailListener(userId: string) {
  // Clean up previous subscription
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  // Initial fetch
  unreadCount = await fetchUnreadCount(userId);
  notifyListeners();

  // Realtime subscription
  const channel = supabase
    .channel('unread-mail-badge')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inbound_emails', filter: `user_id=eq.${userId}` },
      async () => {
        unreadCount = await fetchUnreadCount(userId);
        notifyListeners();
      }
    )
    .subscribe();

  unsubscribe = () => {
    supabase.removeChannel(channel);
  };

  return unsubscribe;
}

export function cleanupUnreadMailListener() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  unreadCount = 0;
  notifyListeners();
}
