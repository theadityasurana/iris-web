import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { newLinkCode, parseCommand, parseInbound, verifySignature, whatsappLive } from '../../functions/_lib/whatsapp.js';
import { onRequestGet, onRequestPost } from '../../functions/api/whatsapp/webhook.js';

const sign = (secret, body) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
const LIVE = { WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_ID: 'p', WHATSAPP_APP_SECRET: 's', WHATSAPP_NUMBER: '1', WHATSAPP_VERIFY_TOKEN: 'v' };

test('signature: accepts the right one, rejects tampering and junk', async () => {
  assert.equal(await verifySignature('s', 'body', sign('s', 'body')), true);
  assert.equal(await verifySignature('s', 'other', sign('s', 'body')), false);
  assert.equal(await verifySignature('wrong', 'body', sign('s', 'body')), false);
  assert.equal(await verifySignature('s', 'body', 'sha256=zz'), false);
  assert.equal(await verifySignature('s', 'body', null), false);
  assert.equal(await verifySignature('', 'body', sign('', 'body')), false);
});

test('commands', () => {
  const code = newLinkCode();
  assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.deepEqual(parseCommand(`link ${code.toLowerCase()}`), { kind: 'link', code });
  assert.deepEqual(parseCommand(code), { kind: 'link', code });
  assert.equal(parseCommand('STOP').kind, 'stop');
  assert.equal(parseCommand('cancel').kind, 'stop');
  assert.equal(parseCommand('jobs').kind, 'jobs');
  assert.equal(parseCommand('hello there').kind, 'help');
});

test('inbound: keeps text messages, ignores receipts and media', () => {
  const payload = { entry: [{ changes: [{ value: { statuses: [{ id: 'x' }], messages: [{ type: 'text', from: '91', text: { body: ' JOBS ' } }, { type: 'image', from: '92' }] } }] }] };
  assert.deepEqual(parseInbound(payload), [{ from: '91', text: 'JOBS' }]);
  assert.deepEqual(parseInbound({}), []);
});

test('webhook stays inactive without secrets and refuses unsigned posts', async () => {
  assert.equal(whatsappLive({}), false);
  const req = () => new Request('https://x/api/whatsapp/webhook', { method: 'POST', body: '{}' });
  assert.equal((await onRequestPost({ request: req(), env: {} })).status, 503);
  assert.equal((await onRequestPost({ request: req(), env: LIVE })).status, 401);
});

test('verification handshake', async () => {
  const get = token => onRequestGet({ request: new Request(`https://x/?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=42`), env: LIVE });
  const ok = await get('v');
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), '42');
  assert.equal((await get('nope')).status, 403);
  assert.equal((await onRequestGet({ request: new Request('https://x/?hub.mode=subscribe&hub.verify_token=undefined'), env: {} })).status, 403);
});
