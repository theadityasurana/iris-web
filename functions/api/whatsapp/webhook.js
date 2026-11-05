import { db } from '../../_lib/dodo.js';
import { parseCommand, parseInbound, sendText, verifySignature, whatsappLive } from '../../_lib/whatsapp.js';

const HELP = 'Iris commands:\nJOBS: your latest matches\nSTOP: disconnect WhatsApp\n\nTo link your account, send the 6-character code from Integrations on irisjobs.live.';

async function linkedUser(env, phone) {
  const res = await db(env, `web_whatsapp_links?wa_phone=eq.${encodeURIComponent(phone)}&status=eq.connected&select=user_id`);
  const [row] = res.ok ? await res.json() : [];
  return row?.user_id ?? null;
}

async function handleLink(env, from, code) {
  const now = encodeURIComponent(new Date().toISOString());
  const res = await db(env, `web_whatsapp_links?link_code=eq.${code}&code_expires_at=gt.${now}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ wa_phone: from, status: 'connected', connected_at: new Date().toISOString(), link_code: null, code_expires_at: null, updated_at: new Date().toISOString() }),
  });
  const rows = res.ok ? await res.json() : [];
  return rows.length
    ? 'You are connected to Iris. Send JOBS any time to see your latest matches, or STOP to disconnect.'
    : 'That code has expired or is not right. Get a new one from Integrations on irisjobs.live.';
}

async function handleJobs(env, from) {
  const userId = await linkedUser(env, from);
  if (!userId) return 'This number is not linked yet. Get your code from Integrations on irisjobs.live and send it here.';
  const profile = await db(env, `profiles?id=eq.${userId}&select=desired_roles`);
  const [p] = profile.ok ? await profile.json() : [];
  const roles = (p?.desired_roles ?? []).slice(0, 3);
  const res = await db(env, 'rpc/search_jobs?select=id,title,company_name,location', {
    method: 'POST',
    body: JSON.stringify({ p_tab: 'discover', p_limit: 3, p_offset: 0, p_company_cap: 1, ...(roles.length ? { p_title_keywords: roles } : {}) }),
  });
  const jobs = res.ok ? await res.json() : [];
  if (!jobs.length) return 'No new matches right now. Check back soon.';
  return ['Your latest matches:', ...jobs.map(j => `\n${j.title} at ${j.company_name}\n${j.location ?? ''}\nhttps://irisjobs.live/app/jobs/${encodeURIComponent(j.id)}`)].join('\n');
}

async function handleStop(env, from) {
  await db(env, `web_whatsapp_links?wa_phone=eq.${encodeURIComponent(from)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'stopped', updated_at: new Date().toISOString() }),
  });
  return 'You are disconnected. You will not get any more messages from Iris here.';
}

/** Meta's webhook verification handshake. */
export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  if (env.WHATSAPP_VERIFY_TOKEN && q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(q.get('hub.challenge') ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!whatsappLive(env)) return new Response('Not configured', { status: 503 });
  const raw = await request.text();
  if (!await verifySignature(env.WHATSAPP_APP_SECRET, raw, request.headers.get('X-Hub-Signature-256'))) return new Response('Bad signature', { status: 401 });
  let payload;
  try { payload = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }

  const work = (async () => {
    for (const { from, text } of parseInbound(payload)) {
      const cmd = parseCommand(text);
      const reply = cmd.kind === 'link' ? await handleLink(env, from, cmd.code)
        : cmd.kind === 'jobs' ? await handleJobs(env, from)
        : cmd.kind === 'stop' ? await handleStop(env, from)
        : HELP;
      const sent = await sendText(env, from, reply);
      if (!sent.ok) console.error('whatsapp send failed', sent.status);
    }
  })().catch(e => console.error('whatsapp webhook failed', e));
  // Meta wants a fast 200; replies finish in the background.
  if (waitUntil) waitUntil(work); else await work;
  return new Response('OK', { status: 200 });
}
