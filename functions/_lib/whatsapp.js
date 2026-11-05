/** WhatsApp Cloud API helpers. Inactive until the WHATSAPP_* secrets exist in Cloudflare. */
export const whatsappLive = env => !!(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID && env.WHATSAPP_APP_SECRET && env.WHATSAPP_NUMBER);

const bytes = hex => new Uint8Array((hex.match(/.{2}/g) || []).map(h => parseInt(h, 16)));

/** Checks Meta's X-Hub-Signature-256 against the raw request body, in constant time. */
export async function verifySignature(secret, rawBody, header) {
  if (!secret || !header?.startsWith('sha256=')) return false;
  const given = header.slice(7);
  if (!/^[0-9a-f]{64}$/i.test(given)) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  return crypto.subtle.verify('HMAC', key, bytes(given), new TextEncoder().encode(rawBody));
}

/** Text messages only, as { from, text }. Delivery receipts and media are ignored. */
export function parseInbound(payload) {
  const out = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const m of change?.value?.messages ?? []) {
        if (m?.type === 'text' && m.from && typeof m.text?.body === 'string') out.push({ from: String(m.from), text: m.text.body.trim() });
      }
    }
  }
  return out;
}

/** Turns a message into a command. Link codes are 6 characters from the generator below. */
export function parseCommand(text) {
  const t = (text || '').trim().toUpperCase();
  const link = t.match(/^(?:LINK\s+)?([A-HJ-NP-Z2-9]{6})$/);
  if (link && t !== 'CANCEL') return { kind: 'link', code: link[1] };
  if (/^(STOP|UNSUBSCRIBE|CANCEL)$/.test(t)) return { kind: 'stop' };
  if (/^(JOBS?|MATCHES)$/.test(t)) return { kind: 'jobs' };
  return { kind: 'help' };
}

export function newLinkCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), b => alphabet[b % alphabet.length]).join('');
}

export function sendText(env, to, body) {
  return fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body, preview_url: false } }),
  });
}
