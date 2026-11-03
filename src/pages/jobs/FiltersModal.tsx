import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '@web/ui/Modal';
import { JOB_DOMAINS } from '@/constants/domains';
import { getAllCountries, getAllCities } from '@/constants/location-mappings';
import type { FeedPanelFilters } from '@/lib/feed-search';
import { EMPTY_FILTERS } from './useFeed';

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
const JOB_LEVELS = ['Internship', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Principal', 'Director', 'VP', 'C-Level'];
const POSTED = [
  { label: 'Last 24 hours', value: '1d' },
  { label: 'Last 2 days', value: '2d' },
  { label: 'Last week', value: '1w' },
  { label: 'Last month', value: '1m' },
  { label: 'Last 3 months', value: '3m' },
];

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

function SearchableChips({ options, selected, onToggle, placeholder, limit = 24 }: { options: string[]; selected: string[]; onToggle: (v: string) => void; placeholder: string; limit?: number }) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const matches = ql ? options.filter(o => o.toLowerCase().includes(ql)) : options;
    const rest = matches.filter(o => !selected.includes(o));
    return [...selected.filter(s => !ql || s.toLowerCase().includes(ql)), ...rest].slice(0, limit + selected.length);
  }, [q, options, selected, limit]);
  return (
    <div className="stack gap-12">
      <div className="input-wrap"><Search /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} /></div>
      <div className="chips">
        {shown.map(o => <button key={o} type="button" className={`chip ${selected.includes(o) ? 'on' : ''}`} onClick={() => onToggle(o)}>{o}</button>)}
        {shown.length === 0 && <span className="t-callout muted">No matches</span>}
      </div>
    </div>
  );
}

export function FiltersModal({ open, onClose, value, onApply, companies }: { open: boolean; onClose: () => void; value: FeedPanelFilters; onApply: (f: FeedPanelFilters) => void; companies: string[] }) {
  const [f, setF] = useState<FeedPanelFilters>(value);
  useEffect(() => { if (open) setF(value); }, [open, value]);
  const countries = useMemo(() => getAllCountries(), []);
  const cities = useMemo(() => getAllCities(f.selectedCountries.length ? f.selectedCountries : undefined), [f.selectedCountries]);

  return (
    <Modal open={open} onClose={onClose} title="Filters" subtitle="Within a section results match any option; sections combine." wide
      footer={<>
        <button className="btn ghost" onClick={() => setF(EMPTY_FILTERS)}>Clear all</button>
        <div className="grow" />
        <button className="btn secondary" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={() => { onApply(f); onClose(); }}>Show jobs</button>
      </>}>
      <div className="filter-sections">
        <section>
          <div className="row between">
            <h3 className="t-sub">Remote only</h3>
            <label className="switch"><input type="checkbox" checked={f.remoteOnly} onChange={e => setF({ ...f, remoteOnly: e.target.checked })} /><span /></label>
          </div>
        </section>
        <section>
          <h3 className="t-sub">Experience level</h3>
          <div className="chips">{JOB_LEVELS.map(l => <button key={l} type="button" className={`chip ${f.jobLevels.includes(l) ? 'on' : ''}`} onClick={() => setF({ ...f, jobLevels: toggle(f.jobLevels, l) })}>{l}</button>)}</div>
        </section>
        <section>
          <h3 className="t-sub">Job type</h3>
          <div className="chips">{JOB_TYPES.map(l => <button key={l} type="button" className={`chip ${f.jobTypes.includes(l) ? 'on' : ''}`} onClick={() => setF({ ...f, jobTypes: toggle(f.jobTypes, l) })}>{l}</button>)}</div>
        </section>
        <section>
          <h3 className="t-sub">Date posted</h3>
          <div className="chips">{POSTED.map(p => <button key={p.value} type="button" className={`chip ${f.postedWithin.includes(p.value) ? 'on' : ''}`} onClick={() => setF({ ...f, postedWithin: f.postedWithin.includes(p.value) ? [] : [p.value] })}>{p.label}</button>)}</div>
        </section>
        <section>
          <h3 className="t-sub">Role</h3>
          <SearchableChips options={JOB_DOMAINS} selected={f.roles} onToggle={v => setF({ ...f, roles: toggle(f.roles, v) })} placeholder="Search roles" />
        </section>
        <section>
          <h3 className="t-sub">Country</h3>
          <SearchableChips options={countries} selected={f.selectedCountries} onToggle={v => setF({ ...f, selectedCountries: toggle(f.selectedCountries, v), selectedCities: [] })} placeholder="Search countries" limit={16} />
        </section>
        <section>
          <h3 className="t-sub">City</h3>
          <SearchableChips options={cities} selected={f.selectedCities} onToggle={v => setF({ ...f, selectedCities: toggle(f.selectedCities, v) })} placeholder="Search cities" limit={16} />
        </section>
        <section>
          <h3 className="t-sub">Company</h3>
          <SearchableChips options={companies} selected={f.companies} onToggle={v => setF({ ...f, companies: toggle(f.companies, v) })} placeholder="Search companies" limit={16} />
        </section>
      </div>
    </Modal>
  );
}
