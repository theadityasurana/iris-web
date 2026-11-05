import { db, dodo, json, requireUser } from '../../_lib/dodo.js';

/** Sends a subscriber to Dodo's customer portal to manage or cancel. */
export async function onRequestPost({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Please sign in again.' }, 401);
  const rowRes = await db(env, `web_subscriptions?user_id=eq.${encodeURIComponent(user.id)}&select=dodo_customer_id`);
  const [row] = rowRes.ok ? await rowRes.json() : [];
  if (!row?.dodo_customer_id) return json({ error: 'No website subscription found.' }, 404);
  const res = await dodo(env, `/customers/${encodeURIComponent(row.dodo_customer_id)}/customer-portal/session`, { method: 'POST' });
  if (!res.ok) return json({ error: 'Could not open billing. Please try again.' }, 502);
  const { link } = await res.json();
  return json({ url: link });
}
