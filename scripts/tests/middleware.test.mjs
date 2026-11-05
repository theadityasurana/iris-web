import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalRedirect as r } from '../../functions/_middleware.js';

test('www pages redirect to apex, keeping path and query', () => {
  assert.equal(r('https://www.irisjobs.live/blog/x/?a=1'), 'https://irisjobs.live/blog/x/?a=1');
  assert.equal(r('https://www.irisjobs.live/'), 'https://irisjobs.live/');
});
test('mobile app link paths stay on www', () => {
  for (const p of ['/.well-known/apple-app-site-association', '/.well-known/assetlinks.json', '/job/1', '/post/1', '/invite/ABC', '/iris', '/iris/', '/download', '/download/'])
    assert.equal(r('https://www.irisjobs.live' + p), null, p);
});
test('other hosts are never touched', () => {
  assert.equal(r('https://irisjobs.live/blog/'), null);
  assert.equal(r('https://nextquark.in/job/1'), null);
});
test('lookalike paths still redirect', () => {
  assert.equal(r('https://www.irisjobs.live/iris-report'), 'https://irisjobs.live/iris-report');
});
