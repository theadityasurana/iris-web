/** The SVG for one job's share image. The public link converts it to a JPEG; see previewImageUrl in functions/job/[id].js. */
import { fetchLogo, jobSvg } from '../../../_lib/og-svg.js';

const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHVqeHBhaHpscGVnempqcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTI2NjIsImV4cCI6MjA4NzMyODY2Mn0.OyjX0Qg4UlDPfTmCwhdK3JuE30698f6A-a01LunhDtM';

export async function onRequestGet({ params, request, waitUntil }) {
  const id = String(params.id || '').replace(/\.svg$/, '');
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request(`${new URL(request.url).origin}/api/og/job/v4/${encodeURIComponent(id)}`);
  const hit = await cache?.match(key);
  if (hit) return hit;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${encodeURIComponent(id)}&select=title,company_name,company_website,location,type,salary_range,experience,posted_at,skills,education_level&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, signal: AbortSignal.timeout(5000),
  });
  const [job] = res.ok ? await res.json() : [];
  if (!job) return new Response('Not found', { status: 404 });
  // The industry and stage chips come from the company's row, if it has one.
  const details = await fetch(`${SUPABASE_URL}/rest/v1/companies?name=eq.${encodeURIComponent(job.company_name ?? '')}&select=industry,company_type&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, signal: AbortSignal.timeout(2500),
  }).then(r => (r.ok ? r.json() : [])).catch(() => []);
  const out = new Response(jobSvg(job, await fetchLogo(job), details[0] ?? {}), { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } });
  if (cache) { const put = cache.put(key, out.clone()); if (waitUntil) waitUntil(put); else await put; }
  return out;
}
