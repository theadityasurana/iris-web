/**
 * Feed simulator: a pretend user swipes through the real web feed logic
 * (feedWalk.ts + fetchJobsBatch + computeMatchScores) against the live job
 * database, read-only, through the same public search_jobs call the site uses.
 *
 *   bun run scripts/feed-sim.ts [scenario] [swipes] [--before]
 *
 * --before runs the old behaviour (no home-country phase) for comparison.
 * Reports where the first job outside the user's country appeared, whether any
 * home-country job came after it, waits on an empty deck, duplicates, and
 * whether the feed ever ran out.
 */
import { fetchJobsBatch } from '@/lib/jobs';
import { computeMatchScores } from '@/lib/match-scoring';
import { getDefaultJobLevelsFromExperience } from '@/lib/feed-policy';
import { locationTier, type FeedPanelFilters } from '@/lib/feed-search';
import type { Job, UserProfile } from '@/types';
import { nearFromProfile } from '@/lib/feed-home';
import { nextWalk, shapeBatch, START_WALK, WALK_AHEAD, walkLadder, type WalkState } from '../src/pages/jobs/feedWalk';

const PAGE = 15, FILTERED_PAGE = 50, HOME_COMPANY_CAP = 1;
const EMPTY: FeedPanelFilters = { roles: [], companies: [], selectedCountries: [], selectedCities: [], locations: [], jobTypes: [], jobLevels: [], postedWithin: [], remoteOnly: false };

interface Scenario { name: string; profile: Partial<UserProfile>; tags?: string[] }
const SCENARIOS: Record<string, Scenario> = {
  blr_swe: { name: 'Bangalore · Software Engineer · entry', profile: { location: 'Bengaluru, Karnataka, India', desiredRoles: ['Software Engineer'], experienceLevel: 'entry_level', skills: ['React', 'TypeScript', 'Node.js'] } },
  blr_niche: { name: 'Bangalore · Marine Biologist · entry (niche)', profile: { location: 'Bangalore, India', desiredRoles: ['Marine Biologist'], experienceLevel: 'entry_level', skills: [] } },
  nairobi: { name: 'Nairobi · Data Analyst · junior (small market)', profile: { location: 'Nairobi, Kenya', desiredRoles: ['Data Analyst'], experienceLevel: 'junior', skills: ['SQL', 'Excel'] } },
  sf_pm: { name: 'San Francisco · Product Manager · senior', profile: { location: 'San Francisco, CA', desiredRoles: ['Product Manager'], experienceLevel: 'senior', skills: [] } },
  nowhere: { name: 'No location · Software Engineer · mid', profile: { location: '', desiredRoles: ['Software Engineer'], experienceLevel: 'mid', skills: [] } },
  blr_search: { name: 'Bangalore · search "react developer"', profile: { location: 'Bangalore, India', desiredRoles: ['Software Engineer'], experienceLevel: 'entry_level', skills: [] }, tags: ['react developer'] },
  london_de: { name: 'London · Data Engineer · mid', profile: { location: 'London, United Kingdom', desiredRoles: ['Data Engineer'], experienceLevel: 'mid', skills: ['Python', 'SQL'] } },
  berlin_fe: { name: 'Berlin · Frontend Developer · junior', profile: { location: 'Berlin, Germany', desiredRoles: ['Frontend Developer'], experienceLevel: 'junior', skills: ['React'] } },
  saopaulo_ux: { name: 'São Paulo · UX Designer · mid', profile: { location: 'Sao Paulo, Brazil', desiredRoles: ['UX Designer'], experienceLevel: 'mid', skills: ['Figma'] } },
  dubai_ae: { name: 'Dubai · Account Executive · mid', profile: { location: 'Dubai, UAE', desiredRoles: ['Account Executive'], experienceLevel: 'mid', skills: [] } },
  toronto_ml: { name: 'Toronto · Machine Learning Engineer · senior', profile: { location: 'Toronto, Canada', desiredRoles: ['Machine Learning Engineer'], experienceLevel: 'senior', skills: ['Python', 'PyTorch'] } },
  sg_intern: { name: 'Singapore · Software Engineer · internship', profile: { location: 'Singapore', desiredRoles: ['Software Engineer'], experienceLevel: 'internship', skills: [] } },
  lagos_nurse: { name: 'Lagos · Registered Nurse · mid (non-tech)', profile: { location: 'Lagos, Nigeria', desiredRoles: ['Registered Nurse'], experienceLevel: 'mid', skills: [] } },
  unknown_place: { name: 'Unrecognised location "Atlantis" · Software Engineer', profile: { location: 'Atlantis', desiredRoles: ['Software Engineer'], experienceLevel: 'mid', skills: [] } },
  sydney_db: { name: 'Sydney · Product Designer · mid (country from DB fields)', profile: { location: 'Sydney NSW', nearCities: ['sydney'], nearCountries: ['Australia'], desiredRoles: ['Product Designer'], experienceLevel: 'mid', skills: [] } },
};

const args = process.argv.slice(2);
const before = args.includes('--before');
const [key = 'blr_swe', swipesArg = '300'] = args.filter(a => !a.startsWith('--'));
const sc = SCENARIOS[key];
if (!sc) { console.error(`unknown scenario; one of: ${Object.keys(SCENARIOS).join(', ')}`); process.exit(1); }
const N = Number(swipesArg);
const MAX_REQUESTS = 400;

// Silence the feed engine's own logging.
const log = console.log; console.log = () => {};

const profile = { id: 'sim', name: 'Sim', preferredCities: [], ...sc.profile } as UserProfile;
const near = nearFromProfile(profile);
const tags = sc.tags ?? [];
const homeFirstOn = !before && tags.length === 0 && (near.countries.length > 0 || near.cities.length > 0);
const baselineLevels = getDefaultJobLevelsFromExperience(profile.experienceLevel);
const nearTexts = [profile.location, ...(profile.preferredCities ?? [])].filter((l): l is string => !!l);

let walk: WalkState = START_WALK;
let offset = 0, hasMore = true, exhausted = false;
const deck: Job[] = []; let index = 0;
const swiped: string[] = [];
const shown: { job: Job; tier: number; phase: string; step: string }[] = [];
let requests = 0, emptyWaits = 0, emptyWaitMs = 0, maxEmptyWaitMs = 0, slowest = 0, failures = 0;
const transitions: string[] = [];
const label = (w: WalkState) => `${w.phase}/b${w.roleBreadth}/${w.escalated.length ? 'esc:' + w.escalated.join('+') : 'base'}/r${w.rung}${w.recycles ? '/recycle' : ''}`;

async function fetchTimed(p: Parameters<typeof fetchJobsBatch>[0]) {
  requests++;
  const t = Date.now();
  const r = await fetchJobsBatch(p);
  const ms = Date.now() - t;
  slowest = Math.max(slowest, ms);
  if (r.failure) failures++;
  return { r, ms };
}

/** Mirrors useFeed.load(append = true). Returns ms spent. */
async function load(): Promise<number> {
  let spent = 0;
  const ladderArgs = { searchTags: tags, knownCompanies: [], filters: EMPTY, desiredRoles: profile.desiredRoles, baselineLevels, nearTexts, excludeIds: swiped, pageSize: PAGE, filteredPageSize: FILTERED_PAGE, homeCompanyCap: HOME_COMPANY_CAP };
  const steps = walkLadder(walk, ladderArgs);
  let r = Math.min(walk.rung, steps.length - 1);
  let off = offset;
  let { r: result, ms } = await fetchTimed(steps[r].params(off)); spent += ms;
  while (!result.failure && result.jobs.length === 0 && r + 1 < steps.length) {
    r++; off = 0;
    ({ r: result, ms } = await fetchTimed(steps[r].params(0))); spent += ms;
  }
  walk = { ...walk, rung: r };
  if (result.failure && result.jobs.length === 0) { hasMore = false; return spent; }
  const scored = computeMatchScores(profile, result.jobs);
  const inHome = walk.phase === 'home' && homeFirstOn;
  const { batch, crossed } = shapeBatch(scored, { rawJobs: result.jobs, titleKeywords: result.titleKeywords, levels: steps[r].params(off).filters?.jobLevels ?? [], skipSanity: tags.length > 0, inHome, near });
  offset = off + result.serverRowCount;
  hasMore = result.serverHadMore && !crossed;
  const seen = new Set(swiped); const ids = new Set(deck.map(j => j.id));
  for (const j of batch) if (!ids.has(j.id) && !seen.has(j.id)) deck.push(j);
  // New cards mean the walk is productive again (as in the hook).
  if (deck.length > ids.size && walk.recycles) walk = { ...walk, recycles: 0 };
  return spent;
}

const started = Date.now();
const SECONDS_PER_CARD = 3;
let errorScreens = 0, waitedLoads = 0;
const ladderArgsNow = () => ({ searchTags: tags, knownCompanies: [], filters: EMPTY, desiredRoles: profile.desiredRoles, baselineLevels, nearTexts, excludeIds: swiped, pageSize: PAGE, filteredPageSize: FILTERED_PAGE, homeCompanyCap: HOME_COMPANY_CAP });
/** A load that started with `left` cards on screen: the user waits only for the part not covered by swiping them. */
const account = (spent: number, left: number, failedEmpty: boolean) => {
  const wait = Math.max(0, spent - left * SECONDS_PER_CARD * 1000);
  if (wait > 0) { waitedLoads++; emptyWaitMs += wait; maxEmptyWaitMs = Math.max(maxEmptyWaitMs, wait); }
  if (failedEmpty) errorScreens++;
};
// Mirrors useFeed / the app's walk effect: prefetch, and when the request has
// no more pages, take the next walk step, both while WALK_AHEAD cards remain.
while (shown.length < N && requests < MAX_REQUESTS) {
  const remaining = deck.length - index;
  if (!exhausted && remaining <= WALK_AHEAD) {
    const failsBefore = failures;
    if (!hasMore) {
      const next = nextWalk(walk, { rungCount: walkLadder(walk, ladderArgsNow()).length, homeFirst: homeFirstOn, baselineLevels, manualLevels: false, roleFilter: false });
      if (!next) { exhausted = true; continue; }
      transitions.push(`with ${remaining} card(s) left, after ${shown.length} → ${label(next)}`);
      walk = next; offset = 0; hasMore = true;
    }
    const spent = await load();
    account(spent, remaining, failures > failsBefore && deck.length - index === 0);
    continue;
  }
  if (remaining === 0) break; // walked everything with nothing new: RAN OUT
  const job = deck[index++];
  swiped.push(job.id);
  shown.push({ job, tier: locationTier(job, near), phase: walk.phase, step: label(walk) });
}
emptyWaits = waitedLoads;

console.log = log;
const firstAbroad = shown.findIndex(s => s.tier === 2);
const homeAfterAbroad = firstAbroad < 0 ? 0 : shown.slice(firstAbroad).filter(s => s.tier < 2).length;
const homeTotal = shown.filter(s => s.tier < 2).length;
const dupes = shown.length - new Set(shown.map(s => s.job.id)).size;
const countries = new Map<string, number>();
for (const s of shown) { const c = s.job.locCountries?.[0] ?? '(unknown)'; countries.set(c, (countries.get(c) ?? 0) + 1); }
const perCompany = new Map<string, number>();
for (const s of shown) perCompany.set(s.job.companyName, (perCompany.get(s.job.companyName) ?? 0) + 1);

log(`\n=== ${sc.name} ${before ? '[BEFORE]' : '[AFTER]'} ===`);
log(`home: cities=${JSON.stringify(near.cities)} countries=${JSON.stringify(near.countries)} homeFirst=${homeFirstOn}`);
log(`cards shown: ${shown.length}/${N}${exhausted && shown.length < N ? '  ** RAN OUT (exhausted) **' : requests >= MAX_REQUESTS ? '  (request cap hit)' : ''}`);
log(`home-country cards: ${homeTotal}; first card abroad at #${firstAbroad < 0 ? '—' : firstAbroad + 1}; home cards AFTER first abroad: ${homeAfterAbroad}`);
log(`requests: ${requests}, failures: ${failures}, slowest: ${slowest}ms, total ${Math.round((Date.now() - started) / 1000)}s`);
log(`user waited (at ${3}s/card): ${emptyWaits} time(s), total ${(emptyWaitMs/1000).toFixed(1)}s, longest ${(maxEmptyWaitMs/1000).toFixed(1)}s; error screens: ${errorScreens}; duplicates: ${dupes}; distinct companies: ${perCompany.size}`);
log(`top countries: ${[...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c, n]) => `${c} ${n}`).join(', ')}`);
log(`walk: ${transitions.length ? '\n  ' + transitions.join('\n  ') : '(stayed on first request)'}`);
log(`first 12: ${shown.slice(0, 12).map(s => `${s.job.jobTitle.slice(0, 28)} @${s.job.companyName.slice(0, 14)} [${s.job.locCountries?.[0] ?? '?'}]`).join(' | ')}`);
process.exit(0);
