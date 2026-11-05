import { db, json, requireUser } from '../../_lib/dodo.js';
import { newLinkCode, whatsappLive } from '../../_lib/whatsapp.js';

const CODE_MINUTES = 30;

/** GET: is WhatsApp live, and is this person linked? */
export async function onRequestGet({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Please sign in again.' }, 401);
  const live = whatsappLive(env);
  if (!live) return json({ live: false, number: null, link: null });
  const res = await db(env, `web_whatsapp_links?user_id=eq.${user.id}&select=status,wa_phone,link_code,code_expires_at`);
  const [row] = res.ok ? await res.json() : [];
  return json({ live, number: env.WHATSAPP_NUMBER, link: row ?? null });
}

/** POST: a fresh, short-lived code the person sends to us from their own phone. */
export async function onRequestPost({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Please sign in again.' }, 401);
  if (!whatsappLive(env)) return json({ error: 'WhatsApp is not live yet.' }, 503);
  const code = newLinkCode();
  const res = await db(env, 'web_whatsapp_links?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: user.id, link_code: code, code_expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(), status: 'pending', updated_at: new Date().toISOString() }),
  });
  if (!res.ok) { console.error('whatsapp link failed', res.status); return json({ error: 'Could not start linking. Please try again.' }, 502); }
  return json({ code, number: env.WHATSAPP_NUMBER });
}

/** DELETE: disconnect. */
export async function onRequestDelete({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Please sign in again.' }, 401);
  const res = await db(env, `web_whatsapp_links?user_id=eq.${user.id}`, { method: 'DELETE' });
  return res.ok ? json({ ok: true }) : json({ error: 'Could not disconnect. Please try again.' }, 502);
}
