/** A share image for one job: its logo, company and title on the Iris hero. */
import { ImageResponse } from 'workers-og';

const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHVqeHBhaHpscGVnempqcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTI2NjIsImV4cCI6MjA4NzMyODY2Mn0.OyjX0Qg4UlDPfTmCwhdK3JuE30698f6A-a01LunhDtM';
const FALLBACK = 'https://irisjobs.live/media/iris-og.jpg?v=1';

// This renderer shows text exactly as written, so entities would print literally: drop markup characters instead.
const esc = v => String(v ?? '').replace(/&amp;/g, '&').replace(/[<>"]/g, '');
const clip = (v, n) => { const s = String(v ?? '').trim(); return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s; };

async function font(family, weight) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`, { headers: { 'User-Agent': 'Mozilla/4.0' } })).text();
  const url = css.match(/src: url\((.+?)\)/)?.[1];
  if (!url) throw new Error('font');
  return (await fetch(url)).arrayBuffer();
}

export function jobCardHtml(job, origin) {
  const domain = String(job.company_website || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]
    || `${String(job.company_name).toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  const meta = [job.location, job.type, job.salary_range && !/competitive|undisclosed/i.test(job.salary_range) ? job.salary_range : null].filter(Boolean).map(v => clip(v, 34)).join('  ·  ');
  return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1200px;height:630px;padding:44px;background-image:url(${origin}/media/landing/hero-og.jpg);background-size:1200px 630px;font-family:'DM Sans'">
    <div style="display:flex;align-items:center;font-family:'EB Garamond';font-size:38px;color:#23201b"><img src="${origin}/logo.png" width="44" height="44" style="border-radius:11px;margin-right:12px" />Iris</div>
    <div style="display:flex;margin-top:12px;font-family:'EB Garamond';font-size:70px;letter-spacing:-1.5px;color:#23201b">Apply to this job in one swipe.</div>
    <div style="display:flex;flex-direction:column;width:900px;margin-top:26px;padding:32px 36px;border-radius:30px;background:#fffdf9;box-shadow:0 20px 50px rgba(50,35,15,.22)">
      <div style="display:flex;align-items:center">
        <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128" width="84" height="84" style="border-radius:18px;margin-right:24px" />
        <div style="display:flex;flex-direction:column;flex:1">
          <div style="display:flex;font-size:23px;font-weight:500;letter-spacing:2px;color:#797366">${esc(clip(job.company_name, 34).toUpperCase())}</div>
          <div style="display:flex;margin-top:4px;font-family:'EB Garamond';font-size:46px;line-height:1.08;color:#23201b">${esc(clip(job.title, 62))}</div>
        </div>
      </div>
      <div style="display:flex;margin-top:18px;font-size:25px;color:#4e4a41">${esc(meta)}</div>
    </div>
    <div style="display:flex;margin-top:24px;font-size:26px;font-weight:500;color:#2f2b24">Tinder for Jobs: Free to Try  ·  iOS  ·  Android  ·  Web</div>
  </div>`;
}

export async function onRequestGet({ params, request, waitUntil }) {
  const id = String(params.id || '').replace(/\.png$/, '');
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request(new URL(request.url).origin + `/api/og/job/${encodeURIComponent(id)}`);
  const hit = await cache?.match(key);
  if (hit) return hit;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${encodeURIComponent(id)}&select=title,company_name,company_website,location,type,salary_range&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, signal: AbortSignal.timeout(6000),
    });
    const [job] = res.ok ? await res.json() : [];
    if (!job) return Response.redirect(FALLBACK, 302);
    const [serif, sans, sansBold] = await Promise.all([font('EB+Garamond', 500), font('DM+Sans', 400), font('DM+Sans', 500)]);
    const img = new ImageResponse(jobCardHtml(job, new URL(request.url).origin), {
      width: 1200, height: 630,
      fonts: [{ name: 'EB Garamond', data: serif, weight: 500 }, { name: 'DM Sans', data: sans, weight: 400 }, { name: 'DM Sans', data: sansBold, weight: 500 }],
    });
    const body = await img.arrayBuffer();
    const out = new Response(body, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } });
    if (cache) { const put = cache.put(key, out.clone()); if (waitUntil) waitUntil(put); else await put; }
    return out;
  } catch (e) {
    console.error('job og failed', e);
    return Response.redirect(FALLBACK, 302);
  }
}
