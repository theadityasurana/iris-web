import test from 'node:test';
import assert from 'node:assert/strict';
import { atsOf, bestRole, isFixed, normalize, rpcParams, TOP_COMPANIES, toCard, topCompanyFor, trimRows } from '../../functions/api/jobs.js';

const f = qs => normalize(`https://x/api/jobs?${qs}`);

test('no filters means the fixed list', () => {
  assert.equal(isFixed(f('')), true);
  assert.equal(isFixed(f('offset=0&level=nope')), true);
  assert.equal(isFixed(f('q=pm')), false);
  assert.equal(isFixed(f('offset=10')), false);
});

test('unknown values, odd characters and big offsets are dropped', () => {
  assert.equal(f('mode=<script>').mode, '');
  assert.equal(f('level=constructor').level, '');
  assert.equal(f('days=9999').days, '');
  assert.equal(f('offset=100000').offset, 40);
  assert.equal(f('offset=-5').offset, 0);
  assert.equal(f('offset=13').offset, 10);
  assert.equal(f('q=' + 'a'.repeat(500)).q.length, 60);
  assert.equal(f('q=' + encodeURIComponent("c++ dev; drop table")).q, 'c++ dev drop table');
});

test('same search, same cache entry', () => {
  assert.deepEqual(f('q=Product%20Manager&mode=remote'), f('mode=remote&q=product   manager'));
});

test('rpc always caps rows and sends company cap (avoids PGRST203)', () => {
  const p = rpcParams(f('q=pm&loc=delhi&level=intern&mode=remote&type=full&days=7'), Date.UTC(2026, 10, 5, 15));
  assert.equal(p.p_limit, 25);
  assert.equal(p.p_company_cap, 3);
  assert.deepEqual(p.p_search_tags, ['pm']);
  assert.deepEqual(p.p_work_modes, ['remote']);
  assert.equal(p.p_posted_after, '2026-10-29T00:00:00.000Z');
  assert.deepEqual(p.p_exp_exact, ['Internship']);
  assert.equal(rpcParams(f('')).p_company_cap, 1);
  assert.equal(rpcParams(f('')).p_limit, 10);
});

test('filters with no search text always get a date window (full-table scans time out)', () => {
  const now = Date.UTC(2026, 10, 5);
  for (const qs of ['mode=remote', 'type=full', 'level=experienced', 'mode=onsite']) assert.equal(rpcParams(f(qs), now).p_posted_after, '2026-10-29T00:00:00.000Z', qs);
  assert.ok(rpcParams(f('level=intern'), now).p_search_tags.includes('intern'));
  assert.equal(rpcParams(f('level=intern'), now).p_posted_after, undefined);
  assert.equal(rpcParams(f('q=pm&mode=remote'), now).p_posted_after, undefined);
  assert.equal(rpcParams(f('mode=remote&days=1'), now).p_posted_after, '2026-11-04T00:00:00.000Z');
});

test('pages of trimmed filters do not overlap', () => {
  assert.equal(rpcParams(f('level=intern&offset=10')).p_offset, 25);
  assert.equal(rpcParams(f('mode=remote&offset=10')).p_offset, 10);
});

test('trim drops jobs that only matched because their level was blank', () => {
  const rows = [{ title: 'Account Executive', experience: null }, { title: 'Design Intern', experience: null }, { title: 'Analyst', experience: 'Internship' }];
  assert.deepEqual(trimRows(rows, f('level=intern')).map(r => r.title), ['Design Intern', 'Analyst']);
  const places = [{ title: 'A', location: 'Remote - USA' }, { title: 'B', location: 'Hybrid' }, { title: 'C', location: 'Pune' }];
  assert.deepEqual(trimRows(places, f('mode=onsite')).map(r => r.title), ['C']);
});

test('cards', () => {
  assert.equal(atsOf('https://job-boards.greenhouse.io/x'), 'Greenhouse');
  assert.equal(atsOf('https://example.com'), null);
  const c = toCard({ id: '1', title: ' A ', company_name: 'B', experience: 'null', salary_range: 'Competitive salary', skills: 'Go, Rust' });
  assert.equal(c.title, 'A');
  assert.equal(c.experience, null);
  assert.equal(c.salary, null);
  assert.deepEqual(c.skills, ['Go', 'Rust']);
});

test('top companies: exact searches skip the slow text search', () => {
  assert.ok(TOP_COMPANIES.length >= 10);
  assert.equal(topCompanyFor(f('q=OpenAI')), 'OpenAI');
  assert.equal(topCompanyFor(f('q=spacex')), 'Spacex');
  assert.equal(topCompanyFor(f('q=OpenAI&mode=remote')), null);
  assert.equal(topCompanyFor(f('q=open')), null);
});

test('top companies: prefers a core role and tidies the name', () => {
  assert.equal(bestRole([{ title: 'Accountant' }, { title: 'Software Engineer' }]).title, 'Software Engineer');
  assert.equal(bestRole([{ title: 'Accounting Analytics Engineer' }, { title: 'Hardware Engineer' }]).title, 'Hardware Engineer');
  assert.equal(bestRole([{ title: 'Accountant' }]).title, 'Accountant');
  assert.equal(bestRole([]), null);
  assert.equal(toCard({ id: '1', title: 'A', company_name: 'Spacex' }).company, 'SpaceX');
});

test('job link previews use the job, and strip markup', async () => {
  const { previewFor } = await import('../../functions/job/[id].js');
  const p = previewFor({ title: 'Engineer', company_name: 'Stripe', location: 'Pune', type: 'Full-time', description: '<p>Build <b>things</b>.</p>' }, 'https://irisjobs.live', 'a b');
  assert.equal(p.title, 'Engineer at Stripe | Apply in one swipe on Iris');
  assert.equal(p.description, 'Pune · Full-time. Build things .');
  assert.equal(p.image, 'https://irisjobs.live/api/og/job/a%20b');
});
