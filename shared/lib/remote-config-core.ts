/**
 * Pure part of remote config: validates stored values against the built-in
 * defaults. Shared by the app (lib/remote-config.ts) and tests.
 */
import { DEFAULT_REMOTE_CONFIG, type RemoteConfig, type RemoteConfigKey } from '@/constants/remote-config-defaults';

type Json = unknown;

/** Merge `value` onto `fallback`, keeping only fields whose type matches. */
export function sanitize<T>(fallback: T, value: Json): T {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(fallback)) {
    if (!Array.isArray(value)) return fallback;
    const template = fallback[0];
    if (template === undefined) return value as T;
    const items = value.filter((v) => matchesTemplate(template, v));
    return items as T;
  }
  if (typeof fallback === 'object' && fallback !== null) {
    if (typeof value !== 'object' || Array.isArray(value)) return fallback;
    const out: Record<string, unknown> = { ...(fallback as Record<string, unknown>) };
    const fb = fallback as Record<string, unknown>;
    const firstDefault = Object.values(fb)[0];
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k in fb) out[k] = sanitize(fb[k], v);
      // New keys are allowed in map-like objects (plan → features, platform → link)
      // when they look like the existing entries.
      else if (firstDefault !== undefined && matchesTemplate(firstDefault, v)) out[k] = v;
    }
    return out as T;
  }
  return (typeof value === typeof fallback ? value : fallback) as T;
}

function matchesTemplate(template: unknown, v: unknown): boolean {
  if (Array.isArray(template)) return Array.isArray(v) && (template.length === 0 || v.every((x) => matchesTemplate(template[0], x)));
  if (typeof template === 'object' && template !== null) {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
    return Object.entries(template as Record<string, unknown>).every(([k, t]) => matchesTemplate(t, (v as Record<string, unknown>)[k]));
  }
  return typeof v === typeof template;
}

export function buildRemoteConfig(rows: { key: string; value: Json }[] | Record<string, Json>): RemoteConfig {
  const byKey: Record<string, Json> = Array.isArray(rows) ? Object.fromEntries(rows.map((r) => [r.key, r.value])) : rows;
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_REMOTE_CONFIG) as RemoteConfigKey[]) {
    out[key] = sanitize(DEFAULT_REMOTE_CONFIG[key], byKey[key]);
  }
  return out as RemoteConfig;
}
