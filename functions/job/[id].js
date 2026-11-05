/**
 * Shared job links: the same page as always, but link previews show this job.
 * Anything going wrong falls back to the normal page, so links never break.
 */
const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHVqeHBhaHpscGVnempqcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTI2NjIsImV4cCI6MjA4NzMyODY2Mn0.OyjX0Qg4UlDPfTmCwhdK3JuE30698f6A-a01LunhDtM';

const text = v => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export function previewFor(job, origin, id) {
  const title = `${text(job.title)} at ${text(job.company_name)}`;
  const facts = [job.location, job.type].map(text).filter(Boolean).join(' · ');
  const about = text(job.description).slice(0, 110);
  return {
    title: `${title} | Apply in one swipe on Iris`,
    description: [facts, about].filter(Boolean).join('. ').slice(0, 190) || 'Apply to this job in one swipe with Iris.',
    image: `${origin}/api/og/job/${encodeURIComponent(id)}`,
  };
}

const setContent = value => ({ element(el) { el.setAttribute('content', value); } });

export async function onRequestGet({ request, env, params }) {
  const page = await env.ASSETS.fetch(new Request(new URL('/', request.url), { headers: request.headers }));
  try {
    const id = String(params.id || '');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${encodeURIComponent(id)}&select=title,company_name,location,type,description&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, signal: AbortSignal.timeout(4000),
    });
    const [job] = res.ok ? await res.json() : [];
    if (!job) return page;
    const p = previewFor(job, new URL(request.url).origin, id);
    return new HTMLRewriter()
      .on('title', { element(el) { el.setInnerContent(p.title); } })
      .on('meta[name="description"]', setContent(p.description))
      .on('meta[property="og:title"]', setContent(p.title))
      .on('meta[property="og:description"]', setContent(p.description))
      .on('meta[property="og:url"]', setContent(request.url))
      .on('meta[property="og:image"]', setContent(p.image))
      .on('meta[property="og:image:secure_url"]', setContent(p.image))
      .on('meta[property="og:image:type"]', setContent('image/png'))
      .on('meta[property="og:image:alt"]', setContent(p.title))
      .on('meta[name="twitter:title"]', setContent(p.title))
      .on('meta[name="twitter:description"]', setContent(p.description))
      .on('meta[name="twitter:image"]', setContent(p.image))
      .transform(page);
  } catch (e) {
    console.error('job preview failed', e);
    return page;
  }
}
