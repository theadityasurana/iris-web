import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useFeaturedCompanies } from '@web/lib/queries';
import { useToast } from '@web/ui/Toast';
import { CompanyLogo } from '@web/ui/bits';
import { suggestedRoles, majorCities } from '@/constants/onboarding';
import { sanitizeSearchInput } from '@/lib/validation';

const readTags = (): string[] => { try { return JSON.parse(sessionStorage.getItem('iris_feed_tags') || '[]'); } catch { return []; } };

export default function Search() {
  const { profile, saveProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<string[]>(readTags);
  const { data: companies, isLoading } = useFeaturedCompanies(12);
  const following = useMemo(() => new Set(profile?.favoriteCompanies ?? []), [profile?.favoriteCompanies]);

  useEffect(() => { input.current?.focus(); }, []);

  const suggestions = useMemo(() => {
    const own = profile?.desiredRoles ?? [];
    return [...new Set([...own, ...suggestedRoles])].slice(0, 12);
  }, [profile?.desiredRoles]);
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return [];
    const pool = [...new Set([...suggestedRoles, ...(majorCities as string[]), ...(companies ?? []).map(c => c.name)])];
    return pool.filter(s => s.toLowerCase().includes(q)).slice(0, 8);
  }, [q, companies]);

  const run = (next: string[]) => {
    try { sessionStorage.setItem('iris_feed_tags', JSON.stringify(next)); } catch { /* private mode */ }
    navigate('/app/jobs');
  };
  const add = (value: string) => {
    const v = sanitizeSearchInput(value).trim();
    if (!v) return tags;
    return tags.some(t => t.toLowerCase() === v.toLowerCase()) ? tags : [...tags, v];
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); run(add(query)); }
    if (e.key === 'Backspace' && !query && tags.length) setTags(tags.slice(0, -1));
  };
  const toggleFollow = async (name: string) => {
    const current = profile?.favoriteCompanies ?? [];
    const next = following.has(name) ? current.filter(c => c !== name) : [...current, name];
    if (!await saveProfile({ favoriteCompanies: next })) toast('Could not update. Please try again.', 'error');
  };

  return (
    <div className="page search-page">
      <Link to="/app/jobs" className="crumb"><ArrowLeft />Back to jobs</Link>
      <h1 className="t-title">Search</h1>
      <div className="search-box" onClick={() => input.current?.focus()}>
        <SearchIcon size={19} />
        {tags.map(t => <span key={t} className="chip static">{t}<button className="x" onClick={() => setTags(tags.filter(x => x !== t))} aria-label={`Remove ${t}`}><X size={13} /></button></span>)}
        <input ref={input} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKey} placeholder={tags.length ? 'Add another' : 'Job title, company or city'} aria-label="Search jobs" />
        {(tags.length > 0 || q) && <button className="btn sm" onClick={() => run(add(query))}>Search</button>}
      </div>

      {q ? (
        <section className="search-section">
          <div className="t-callout muted">Matches</div>
          {matches.length > 0
            ? <div className="chips" style={{ marginTop: 12 }}>{matches.map(m => <button key={m} className="chip" onClick={() => run(add(m))}>{m}</button>)}</div>
            : <p className="t-callout soft" style={{ marginTop: 10 }}>Press Enter to search for “{query.trim()}”.</p>}
        </section>
      ) : (
        <section className="search-section">
          <div className="t-callout muted">Suggested</div>
          <div className="chips" style={{ marginTop: 12 }}>{suggestions.map(s => <button key={s} className="chip" onClick={() => run(add(s))}>{s}</button>)}</div>
        </section>
      )}

      {(isLoading || (companies?.length ?? 0) > 0) && <section className="search-section">
        <h2 className="t-heading">Companies to follow</h2>
        <div className="company-grid">
          {isLoading && Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="company-card" aria-hidden="true"><div className="sk" style={{ width: 52, height: 52, borderRadius: 14 }} /><div className="sk" style={{ height: 15, width: '70%' }} /><div className="sk" style={{ height: 11, width: '50%' }} /><div className="sk" style={{ height: 38, width: '100%', borderRadius: 99 }} /></div>
          ))}
          {companies?.map(c => (
            <div key={c.name} className="company-card">
              <button className="company-open" onClick={() => run(add(c.name))} aria-label={`Search ${c.name} jobs`}>
                <CompanyLogo name={c.name} url={c.logoUrl} website={c.website} size="lg" />
                <b className="ellipsis">{c.name}</b>
                <span className="t-caption muted">{c.openJobs.toLocaleString()} open jobs</span>
              </button>
              <button className={`btn sm block ${following.has(c.name) ? 'outline' : ''}`} onClick={() => toggleFollow(c.name)} aria-pressed={following.has(c.name)}>{following.has(c.name) ? 'Following' : 'Follow'}</button>
            </div>
          ))}
        </div>
      </section>}
    </div>
  );
}
