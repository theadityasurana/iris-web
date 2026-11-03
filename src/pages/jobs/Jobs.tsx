import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { X, Check, Bookmark, Search, SlidersHorizontal, RotateCcw, Info, WifiOff, Inbox as InboxIcon } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { Empty } from '@web/ui/bits';
import { fetchAllCompanies } from '@/lib/jobs';
import type { FeedPanelFilters } from '@/lib/feed-search';
import type { Job } from '@/types';
import { useFeed, EMPTY_FILTERS, activeFilterCount } from './useFeed';
import { useJobActions } from './useJobActions';
import { JobCard, JobDetail } from './JobParts';
import { FiltersModal } from './FiltersModal';
import { OutOfCredits } from './OutOfCredits';

type Dir = 'left' | 'right' | 'up';
const THRESHOLD = 110;

function readStored<T>(key: string, fallback: T): T {
  try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

export default function Jobs() {
  const { profile, swipedJobIds } = useAuth();
  const toast = useToast();
  const [tags, setTags] = useState<string[]>(() => readStored('iris_feed_tags', []));
  const [draft, setDraft] = useState('');
  const [filters, setFilters] = useState<FeedPanelFilters>(() => readStored('iris_feed_filters', EMPTY_FILTERS));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => { try { sessionStorage.setItem('iris_feed_tags', JSON.stringify(tags)); sessionStorage.setItem('iris_feed_filters', JSON.stringify(filters)); } catch { /* private mode */ } }, [tags, filters]);
  useEffect(() => { fetchAllCompanies().then(setCompanies).catch(() => {}); }, []);

  const feed = useFeed(profile, swipedJobIds, tags, filters);
  const actions = useJobActions();

  // drag state
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<Dir | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const busy = useRef(false);

  const act = useCallback(async (dir: Dir, job: Job | null = feed.current) => {
    if (!job || busy.current) return;
    busy.current = true;
    setLeaving(dir);
    await new Promise(r => setTimeout(r, 240));
    feed.advance();
    setLeaving(null);
    setDrag({ x: 0, y: 0, active: false });
    busy.current = false;

    if (dir === 'left') { actions.skip(job); return; }
    if (dir === 'up') {
      const ok = await actions.save(job);
      toast(ok ? `Saved ${job.jobTitle}` : 'Could not save this job', ok ? 'ok' : 'error');
      return;
    }
    const outcome = await actions.apply(job);
    if (outcome === 'no-credits') { feed.rewind(); return; }
    toast(outcome === 'applied' ? `Applying to ${job.companyName}` : 'Your application could not be queued', outcome === 'applied' ? 'ok' : 'error');
  }, [feed, actions, toast]);

  // keyboard: ← skip, → apply, ↑ save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable], .overlay')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); void act('left'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); void act('right'); }
      if (e.key === 'ArrowUp') { e.preventDefault(); void act('up'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (busy.current || (e.target as HTMLElement).closest('a, button')) return;
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ x: 0, y: 0, active: true });
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    const { x, y } = drag;
    if (x > THRESHOLD) void act('right');
    else if (x < -THRESHOLD) void act('left');
    else if (y < -THRESHOLD && Math.abs(x) < THRESHOLD) void act('up');
    else setDrag({ x: 0, y: 0, active: false });
  };

  const addTag = () => {
    const v = draft.trim();
    if (!v) return;
    if (!tags.some(t => t.toLowerCase() === v.toLowerCase())) setTags([...tags, v]);
    setDraft('');
  };
  const onSearchKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !draft && tags.length) setTags(tags.slice(0, -1));
  };

  const nFilters = activeFilterCount(filters);
  const job = feed.current;
  const leanRight = drag.x > 40 || leaving === 'right';
  const leanLeft = drag.x < -40 || leaving === 'left';
  const leanUp = (drag.y < -40 && Math.abs(drag.x) < 60) || leaving === 'up';

  const transform = leaving === 'right' ? 'translate(140%, 0) rotate(18deg)'
    : leaving === 'left' ? 'translate(-140%, 0) rotate(-18deg)'
    : leaving === 'up' ? 'translate(0, -130%)'
    : `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 22}deg)`;

  return (
    <div className="page wide jobs-page">
      <div className="feed-bar">
        <div className="tag-search" onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
          <Search />
          {tags.map(t => (
            <span key={t} className="chip static">{t}<button className="x" onClick={() => setTags(tags.filter(x => x !== t))} aria-label={`Remove ${t}`}><X size={13} /></button></span>
          ))}
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onSearchKey} onBlur={addTag}
            placeholder={tags.length ? 'Add another' : 'Search a role, company or city'} aria-label="Search jobs" />
        </div>
        <button className={`btn ${nFilters ? '' : 'outline'}`} onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal />Filters{nFilters > 0 && <span className="num">· {nFilters}</span>}
        </button>
        {(tags.length > 0 || nFilters > 0) && <button className="btn ghost" onClick={() => { setTags([]); setFilters(EMPTY_FILTERS); }}>Reset</button>}
      </div>

      {feed.notice && job && <div className="banner" style={{ marginBottom: 16 }}><Info />{feed.notice}</div>}

      <div className="deck-layout">
        <div className="deck-col">
          <div className="deck">
            {!job && !feed.initialLoaded && <div className="job-card sk" style={{ position: 'absolute', inset: 0 }} />}
            {!job && feed.initialLoaded && feed.loading && <div className="job-card sk" style={{ position: 'absolute', inset: 0 }} />}
            {!job && feed.initialLoaded && !feed.loading && feed.error && (
              <div className="deck-empty card">
                <Empty icon={WifiOff} title="We couldn’t load jobs" body={feed.error === 'timeout' ? 'The search took too long. Try again in a moment.' : 'Check your connection and try again.'}
                  action={<button className="btn" onClick={feed.retry}><RotateCcw />Try again</button>} />
              </div>
            )}
            {!job && feed.initialLoaded && !feed.loading && !feed.error && (
              <div className="deck-empty card">
                <Empty icon={InboxIcon} title="You’ve seen every match for now" body="New roles are added through the day. Widen your search or filters to see more."
                  action={<button className="btn" onClick={() => { setTags([]); setFilters(EMPTY_FILTERS); feed.retry(); }}>Reset search</button>} />
              </div>
            )}

            {feed.upcoming.slice().reverse().map((u, i, arr) => (
              <div key={u.id} className="deck-card behind" style={{ transform: `translateY(${(arr.length - i) * 10}px) scale(${1 - (arr.length - i) * 0.035})` }}>
                <JobCard job={u} />
              </div>
            ))}
            {job && (
              <div key={job.id}
                className={`deck-card top ${drag.active ? 'dragging' : ''}`}
                style={{ transform }}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
                <span className={`stamp apply ${leanRight ? 'on' : ''}`}>Apply</span>
                <span className={`stamp skip ${leanLeft ? 'on' : ''}`}>Skip</span>
                <span className={`stamp save ${leanUp ? 'on' : ''}`}>Save</span>
                <JobCard job={job} />
              </div>
            )}
          </div>

          <div className="deck-actions">
            <button className="round skip" onClick={() => act('left')} disabled={!job} aria-label="Skip (left arrow)"><X /></button>
            <button className="round save" onClick={() => act('up')} disabled={!job} aria-label="Save (up arrow)"><Bookmark /></button>
            <button className="round apply" onClick={() => act('right')} disabled={!job} aria-label="Apply (right arrow)"><Check /></button>
          </div>
          <p className="t-caption muted deck-hint">Drag the card, or use <kbd>←</kbd> skip · <kbd>↑</kbd> save · <kbd>→</kbd> apply</p>
        </div>

        <div className="detail-col">
          {job ? (
            <div className="card pad detail-card">
              <div className="row between" style={{ marginBottom: 4 }}>
                <span className="t-overline muted">Job details</span>
                <Link to={`/app/jobs/${job.id}`} className="btn ghost sm">Open page</Link>
              </div>
              <JobDetail job={job} />
            </div>
          ) : (
            <div className="card flat pad detail-placeholder t-callout muted">Job details appear here.</div>
          )}
        </div>
      </div>

      <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} value={filters} onApply={setFilters} companies={companies} />
      <OutOfCredits open={actions.outOfCredits} onClose={() => actions.setOutOfCredits(false)} entitlements={actions.entitlements} resetAt={actions.freeResetAt} />
    </div>
  );
}
