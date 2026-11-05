/** The SVG behind a shared search's image. Fails closed: with no results, crawlers get the site's image. */
import { isFixed, normalize, searchSample, topCompanyFor } from '../../jobs.js';
import { fetchLogo, searchSvg } from '../../../_lib/og-svg.js';
import { displayText } from '../../../jobs/index.js';

const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHVqeHBhaHpscGVnempqcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTI2NjIsImV4cCI6MjA4NzMyODY2Mn0.OyjX0Qg4UlDPfTmCwhdK3JuE30698f6A-a01LunhDtM';
const COUNT_UP_TO = 50;

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const filters = normalize(request.url);
  if (isFixed(filters)) return new Response('Not found', { status: 404 });
  const rows = await searchSample(filters, COUNT_UP_TO).catch(() => null);
  if (!rows?.length) return new Response('Not found', { status: 404 });
  const top = rows[0];
  const details = await fetch(`${SUPABASE_URL}/rest/v1/companies?name=eq.${encodeURIComponent(top.company_name ?? '')}&select=industry,company_type&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, signal: AbortSignal.timeout(2500),
  }).then(r => (r.ok ? r.json() : [])).catch(() => []);
  const svg = searchSvg({
    atCompany: !!topCompanyFor(filters),
    atCompany: !!topCompanyFor(filters),
    count: rows.length, more: rows.length >= COUNT_UP_TO,
    query: filters.q ? displayText(url.searchParams.get('q')) : '', place: filters.loc ? displayText(url.searchParams.get('loc')) : '',
    filters, top, logo: await fetchLogo(top), company: details[0] ?? {},
  });
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
}
