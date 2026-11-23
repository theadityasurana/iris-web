/**
 * The SVG behind a shared search's image. One company (most results from a company
 * whose name matches the search): its logo and name, in one of five designs. Several
 * companies: up to six of their logos, in one of three designs. No job counts.
 * `v` picks the design (the JPEG route walks through them as fallbacks).
 * Fails closed: with no results, crawlers get the site's image.
 */
import { isFixed, normalize, searchSample, topCompanyFor } from '../../jobs.js';
import { fetchLogo, searchWords } from '../../../_lib/og-svg.js';
import { companySvg, searchShareSvg } from '../../../_lib/og-share.js';
import { displayText } from '../../../jobs/index.js';

const SAMPLE = 50;
const DISPLAY = { Spacex: 'SpaceX' };
const cityOf = loc => String(loc || '').split(/[,;|/]/)[0].trim();

/** The company a search is about, if any: most results come from it and its name matches the search. */
export function companyOf(rows, filters) {
  const top = topCompanyFor(filters);
  if (top) return top;
  if (!filters.q || !rows.length) return null;
  const counts = new Map();
  for (const r of rows) counts.set(r.company_name, (counts.get(r.company_name) || 0) + 1);
  const [name, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const q = filters.q.toLowerCase();
  return name && n / rows.length >= 0.6 && String(name).toLowerCase().includes(q) ? name : null;
}

export function headlineFor(filters, raw) {
  const words = searchWords(filters);
  const role = filters.q ? displayText(raw.get('q')) : '';
  const place = filters.loc ? displayText(raw.get('loc')) : '';
  const lead = [words && words[0].toUpperCase() + words.slice(1), role].filter(Boolean).join(' ');
  return `${lead || 'Open'} jobs${place ? ` in ${place}` : ''}`;
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const filters = normalize(request.url);
  if (isFixed(filters)) return new Response('Not found', { status: 404 });
  const rows = await searchSample(filters, SAMPLE).catch(() => null);
  if (!rows?.length) return new Response('Not found', { status: 404 });
  const v = Math.max(0, Number(url.searchParams.get('v')) || 0);
  const company = companyOf(rows, filters);
  let svg;
  if (company) {
    const mine = rows.filter(r => r.company_name === company);
    const sample = mine[0] ?? rows[0];
    const places = new Map();
    for (const r of mine) { const c = cityOf(r.location); if (c && !/remote/i.test(c)) places.set(c, (places.get(c) || 0) + 1); }
    const place = filters.loc ? displayText(url.searchParams.get('loc')) : [...places.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    svg = companySvg(v, { name: DISPLAY[company] ?? company, logo: await fetchLogo(sample), place });
  } else {
    // Up to six companies, most frequent first, each with its logo.
    const byCompany = new Map();
    for (const r of rows) if (r.company_name && !byCompany.has(r.company_name)) byCompany.set(r.company_name, r);
    const picks = [...byCompany.values()].slice(0, 6);
    const logos = await Promise.all(picks.map(r => fetchLogo(r)));
    const companies = picks.map((r, i) => ({ name: DISPLAY[r.company_name] ?? r.company_name, logo: logos[i] }))
      .sort((a, b) => (b.logo ? 1 : 0) - (a.logo ? 1 : 0));
    svg = searchShareSvg(v, { headline: headlineFor(filters, url.searchParams), companies });
  }
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
}
