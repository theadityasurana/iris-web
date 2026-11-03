import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Zap, Lock, ChevronRight, Settings2, X } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useEntitlements } from '@web/lib/queries';
import { Switch } from '@web/ui/bits';
import { useToast } from '@web/ui/Toast';
import {
  getIrisEnabled, setIrisEnabled,
  getIrisApplications, getIrisPreferences, saveIrisPreferences,
  DEFAULT_IRIS_PREFS, type IrisPreferences, type SalaryCurrency,
} from '@/lib/iris';
import { timeAgo } from '@web/ui/bits';

const COMPANY_SIZES = ['Any', 'Startup', 'Mid-size', 'Enterprise'] as const;
const TONES = ['Professional', 'Conversational', 'Bold', 'Friendly', 'Assertive', 'Witty'] as const;
const CURRENCIES: SalaryCurrency[] = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD'];
const LOCATIONS = [
  { value: 'india', label: 'India' },
  { value: 'usa', label: 'USA' },
  { value: 'remote', label: 'Remote' },
  { value: 'discover', label: 'Global' },
] as const;

export default function Iris() {
  const { userId } = useAuth();
  const ent = useEntitlements();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: enabled = false } = useQuery({
    queryKey: ['iris-enabled', userId],
    queryFn: () => getIrisEnabled(userId!),
    enabled: !!userId && ent.iris,
  });

  const { data: apps = [] } = useQuery({
    queryKey: ['iris-applications', userId],
    queryFn: () => getIrisApplications(userId!),
    enabled: !!userId && ent.iris && enabled,
    refetchInterval: 30_000,
  });

  const { data: prefs } = useQuery({
    queryKey: ['iris-preferences', userId],
    queryFn: () => getIrisPreferences(userId!),
    enabled: !!userId && ent.iris,
  });

  const [local, setLocal] = useState<IrisPreferences>(DEFAULT_IRIS_PREFS);
  const [saving, setSaving] = useState(false);
  const [watchlistInput, setWatchlistInput] = useState('');
  const [blockedInput, setBlockedInput] = useState('');

  useEffect(() => {
    if (prefs) setLocal({ ...DEFAULT_IRIS_PREFS, ...prefs });
  }, [prefs]);

  const toggleMutation = useMutation({
    mutationFn: (v: boolean) => setIrisEnabled(userId!, v),
    onMutate: (v) => {
      qc.setQueryData(['iris-enabled', userId], v);
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['iris-enabled', userId] });
    },
  });

  const save = async (patch: Partial<IrisPreferences>) => {
    if (!userId) return;
    setSaving(true);
    const merged = { ...local, ...patch };
    setLocal(merged);
    await saveIrisPreferences(userId, patch);
    qc.invalidateQueries({ queryKey: ['iris-preferences', userId] });
    setSaving(false);
    toast('Preferences saved');
  };

  if (!ent.iris) {
    return (
      <div className="page narrow">
        <div className="empty" style={{ paddingTop: 80 }}>
          <div className="ico"><Lock /></div>
          <div className="t-title">Iris auto-apply</div>
          <p>Iris is available on Starter, Pro, and Ultra plans. Upgrade to let Iris apply to jobs overnight on your behalf.</p>
          <Link to="/app/plans" className="btn brand" style={{ marginTop: 16 }}>
            <Zap size={16} /> View plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <div className="t-title">Iris auto-apply</div>
          <p className="t-callout muted" style={{ marginTop: 4 }}>Iris applies to matching jobs overnight while you sleep.</p>
        </div>
        <Link to="/app/iris/report" className="btn secondary sm">View report</Link>
      </div>

      {/* Status card */}
      <div className="card pad" style={{ marginBottom: 20 }}>
        <div className="row between gap-12">
          <div className="stack gap-4">
            <div className="row gap-8">
              <span className={`badge ${enabled ? 'green' : ''}`}>
                <span className="pip" />
                {enabled ? 'Active' : 'Paused'}
              </span>
            </div>
            <div className="t-callout muted">
              {enabled ? `Up to ${local.dailyLimit} application${local.dailyLimit !== 1 ? 's' : ''} per day` : 'Enable to auto-apply overnight'}
            </div>
          </div>
          <Switch
            checked={enabled}
            onChange={(v) => toggleMutation.mutate(v)}
            label="Toggle Iris"
          />
        </div>
        {enabled && apps.length > 0 && (
          <div className="stats" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginTop: 16 }}>
            <div className="stat"><div className="v num">{apps.length}</div><div className="k">Applied</div></div>
            <div className="stat"><div className="v num">{local.minMatchScore}%</div><div className="k">Min match</div></div>
            <div className="stat"><div className="v num">{local.watchlist.length || '—'}</div><div className="k">Watchlist</div></div>
            <div className="stat"><div className="v num">{local.blocked.length || '—'}</div><div className="k">Blocked</div></div>
          </div>
        )}
      </div>

      {/* Recent applications */}
      {enabled && apps.length > 0 && (
        <div className="section">
          <div className="section-head"><div className="t-heading">Recent applications</div></div>
          <div className="list card">
            {apps.slice(0, 5).map(app => (
              <div key={app.id} className="list-row">
                <div className="grow stack gap-4">
                  <div className="t-body">{app.job_title}</div>
                  <div className="t-caption muted">{app.company_name}</div>
                </div>
                <div className="t-caption muted">{timeAgo(app.applied_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="section">
        <div className="section-head">
          <div className="t-heading">Preferences</div>
          {saving && <span className="t-caption muted">Saving…</span>}
        </div>

        <div className="stack gap-12">
          {/* Watchlist */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Watchlist</div>
            <div className="t-caption muted" style={{ marginBottom: 10 }}>Auto-apply the moment these companies post</div>
            <div className="chips" style={{ marginBottom: 10 }}>
              {local.watchlist.map(c => (
                <button key={c} className="chip static" onClick={() => save({ watchlist: local.watchlist.filter(x => x !== c) })}>
                  {c} <X size={12} className="x" />
                </button>
              ))}
            </div>
            <div className="row gap-8">
              <input
                className="input"
                placeholder="Add company…"
                value={watchlistInput}
                onChange={e => setWatchlistInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && watchlistInput.trim()) {
                    save({ watchlist: [...local.watchlist, watchlistInput.trim()] });
                    setWatchlistInput('');
                  }
                }}
                style={{ flex: 1 }}
              />
              <button className="btn secondary sm" onClick={() => {
                if (watchlistInput.trim()) {
                  save({ watchlist: [...local.watchlist, watchlistInput.trim()] });
                  setWatchlistInput('');
                }
              }}>Add</button>
            </div>
          </div>

          {/* Blocked */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Blocked companies</div>
            <div className="t-caption muted" style={{ marginBottom: 10 }}>Never apply to these companies</div>
            <div className="chips" style={{ marginBottom: 10 }}>
              {local.blocked.map(c => (
                <button key={c} className="chip static" onClick={() => save({ blocked: local.blocked.filter(x => x !== c) })}>
                  {c} <X size={12} className="x" />
                </button>
              ))}
            </div>
            <div className="row gap-8">
              <input
                className="input"
                placeholder="Block company…"
                value={blockedInput}
                onChange={e => setBlockedInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && blockedInput.trim()) {
                    save({ blocked: [...local.blocked, blockedInput.trim()] });
                    setBlockedInput('');
                  }
                }}
                style={{ flex: 1 }}
              />
              <button className="btn secondary sm" onClick={() => {
                if (blockedInput.trim()) {
                  save({ blocked: [...local.blocked, blockedInput.trim()] });
                  setBlockedInput('');
                }
              }}>Add</button>
            </div>
          </div>

          {/* Min match score */}
          <div className="card pad">
            <div className="row between" style={{ marginBottom: 8 }}>
              <div className="t-sub">Min. match score</div>
              <span className="t-body num">{local.minMatchScore}%</span>
            </div>
            <div className="t-caption muted" style={{ marginBottom: 12 }}>Only apply when fit exceeds this threshold</div>
            <input
              type="range" min={50} max={100} step={5}
              value={local.minMatchScore}
              onChange={e => setLocal(p => ({ ...p, minMatchScore: +e.target.value }))}
              onMouseUp={() => save({ minMatchScore: local.minMatchScore })}
              onTouchEnd={() => save({ minMatchScore: local.minMatchScore })}
              style={{ width: '100%', accentColor: 'var(--ink)' }}
            />
            <div className="row between"><span className="t-caption muted">50%</span><span className="t-caption muted">100%</span></div>
          </div>

          {/* Company size */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Company size</div>
            <div className="segmented">
              {COMPANY_SIZES.map(s => (
                <button key={s} className={local.companySize === s ? 'on' : ''} onClick={() => save({ companySize: s })}>{s}</button>
              ))}
            </div>
          </div>

          {/* Salary floor */}
          <div className="card pad">
            <div className="row between" style={{ marginBottom: 8 }}>
              <div className="t-sub">Salary floor</div>
              <div className="row gap-8">
                <select className="select" style={{ width: 90, height: 32 }} value={local.salaryCurrency} onChange={e => save({ salaryCurrency: e.target.value as SalaryCurrency })}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <span className="t-body num">{local.salaryFloor === 0 ? 'Any' : `${Math.round(local.salaryFloor / 1000)}k`}</span>
              </div>
            </div>
            <div className="t-caption muted" style={{ marginBottom: 12 }}>Skip roles below this amount</div>
            <input
              type="range" min={0} max={500000} step={5000}
              value={local.salaryFloor}
              onChange={e => setLocal(p => ({ ...p, salaryFloor: +e.target.value }))}
              onMouseUp={() => save({ salaryFloor: local.salaryFloor })}
              onTouchEnd={() => save({ salaryFloor: local.salaryFloor })}
              style={{ width: '100%', accentColor: 'var(--ink)' }}
            />
            <div className="row between"><span className="t-caption muted">0</span><span className="t-caption muted">500k</span></div>
          </div>

          {/* Daily limit */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Daily limit</div>
            <div className="segmented">
              {[1, 2, 3, 5, 10].map(n => (
                <button key={n} className={local.dailyLimit === n ? 'on' : ''} onClick={() => save({ dailyLimit: n })}>{n}</button>
              ))}
            </div>
          </div>

          {/* Pause weekends */}
          <div className="card pad">
            <div className="row between">
              <div>
                <div className="t-sub">Pause on weekends</div>
                <div className="t-caption muted">No applications Saturday or Sunday</div>
              </div>
              <Switch checked={local.pauseWeekends} onChange={v => save({ pauseWeekends: v })} />
            </div>
          </div>

          {/* Job locations */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Job locations</div>
            <div className="chips">
              {LOCATIONS.map(({ value, label }) => {
                const on = local.jobLocations.includes(value as any);
                return (
                  <button
                    key={value}
                    className={`chip ${on ? 'on' : ''}`}
                    onClick={() => {
                      const next = on
                        ? local.jobLocations.filter(l => l !== value)
                        : [...local.jobLocations, value as any];
                      save({ jobLocations: (next.length === 0 ? ['india'] : next) as IrisPreferences['jobLocations'] });
                    }}
                  >{label}</button>
                );
              })}
            </div>
          </div>

          {/* Outreach tone */}
          <div className="card pad">
            <div className="t-sub" style={{ marginBottom: 8 }}>Outreach tone</div>
            <div className="t-caption muted" style={{ marginBottom: 10 }}>How Iris sounds to hiring managers</div>
            <div className="chips">
              {TONES.map(t => (
                <button key={t} className={`chip ${local.outreachTone === t ? 'on' : ''}`} onClick={() => save({ outreachTone: t })}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
