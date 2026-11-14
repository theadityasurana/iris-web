import { creditsFor, dodo, json, regionOf, requireUser } from '../../_lib/dodo.js';

/** GET returns the buyer's pricing region. POST starts a Dodo checkout. */
export async function onRequestGet({ request }) {
  return json({ region: regionOf(request) });
}

export async function onRequestPost({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Please sign in again.' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const { plan, period } = body || {};
  if (!creditsFor(plan, period)) return json({ error: 'Unknown plan.' }, 400);

  // Region comes from Cloudflare, not the browser, so the price can't be picked by the client.
  const region = regionOf(request);
  const productId = env[`DODO_PRODUCT_${plan}_${period}_${region}`.toUpperCase()];
  if (!productId) return json({ error: 'This plan is not available yet.' }, 503);

  const origin = new URL(request.url).origin;
  const res = await dodo(env, '/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: user.email, name: user.user_metadata?.full_name || user.email },
      return_url: `${origin}/app/plans?checkout=done`,
      feature_flags: { allow_discount_code: true },
      metadata: { user_id: user.id, plan, period, region, source: 'iris-web' },
    }),
  });
  if (!res.ok) {
    console.error('dodo checkout failed', res.status, await res.text());
    return json({ error: 'Could not start checkout. Please try again.' }, 502);
  }
  const { checkout_url: url } = await res.json();
  return url ? json({ url }) : json({ error: 'Could not start checkout. Please try again.' }, 502);
}
