import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
exec(open('_parts.py').read())

def cta(lead='', tail='<span class="btn ghost">Continue on web</span>'):
    return CTAS.replace('{lead}', lead).replace('{tail}', tail)

def page(name, css, body):
    open(name + '.html', 'w').write(f'''<!doctype html><html><head><meta charset="utf-8"><title>{name}</title>
<link rel="stylesheet" href="shared.css"><style>{css}</style></head><body>{NAV}{body}</body></html>''')

# 1 — Inbox stack: the outcome is literally in the hero
page('1-wake-up-to-interviews', '''
.hero{max-width:1240px;margin:0 auto;padding:70px 32px 0;display:grid;grid-template-columns:1.05fr 1fr;gap:60px;align-items:center}
h1{font-family:var(--serif);font-weight:500;font-size:88px;line-height:.98;letter-spacing:-.02em}
h1 i{color:var(--brand)}
.sub{font-size:19px;line-height:1.55;color:var(--ink2);margin:24px 0 32px;max-width:470px}
.proof{margin-top:26px}
.stack{position:relative;height:520px}
.mail{position:absolute;left:0;right:0;padding:18px 20px;display:flex;gap:14px}
.mail b{font-size:15px}.mail .t{margin-left:auto;font-size:12.5px;color:var(--ink4)}
.mail .s{font-size:14.5px;color:var(--ink);margin-top:3px;font-weight:500}.mail .p{font-size:13.5px;color:var(--ink3);margin-top:3px}
.m1{top:40px;z-index:3}.m2{top:150px;left:30px;right:-30px;z-index:2;opacity:.92}.m3{top:260px;left:60px;right:-60px;z-index:1;opacity:.8}.m4{top:370px;left:90px;right:-90px;opacity:.6}
.tag{display:inline-block;font-size:11px;font-weight:600;background:var(--ok-soft);color:var(--ok);padding:2px 8px;border-radius:999px;margin-left:8px;vertical-align:2px}
''', f'''<section class="hero"><div>
<div class="pill"><span class="dot"></span>Every minute, someone on Iris lands an interview</div>
<h1 style="margin-top:26px">Wake up to <i>interviews.</i></h1>
<p class="sub">Swipe right on jobs you like. Our AI applies for you across 2M+ openings, so the next email you open is a recruiter saying yes.</p>
{cta()}
<div class="proof">70% of Iris users land interviews · Free to try</div></div>
<div class="stack">
<div class="mail card m1"><div class="av" style="background:#6d4ae0">H</div><div style="flex:1"><div style="display:flex"><b>Hiring Team</b><span class="tag">Interview</span><span class="t">9:14 AM</span></div><div class="s">We'd love to schedule an interview with you</div><div class="p">Your application for Product Analyst stood out to our team…</div></div></div>
<div class="mail card m2"><div class="av" style="background:#2f7a55">R</div><div style="flex:1"><div style="display:flex"><b>Recruiter</b><span class="tag">Interview</span><span class="t">8:02 AM</span></div><div class="s">Are you free for a quick call this week?</div><div class="p">Loved your background. Let's find a time…</div></div></div>
<div class="mail card m3"><div class="av" style="background:#a8620f">P</div><div style="flex:1"><div style="display:flex"><b>People Ops</b><span class="tag">Next round</span><span class="t">Yesterday</span></div><div class="s">Next steps: final round</div><div class="p">Congratulations on clearing the first round…</div></div></div>
<div class="mail card m4"><div class="av" style="background:#23201b">T</div><div style="flex:1"><div style="display:flex"><b>Talent Team</b><span class="t">Mon</span></div><div class="s">Your offer letter</div><div class="p">We're thrilled to offer you…</div></div></div>
</div></section>''')

# 2 — Pure typographic, ultra-clean, centered
page('2-stop-applying-start-interviewing', '''
.hero{text-align:center;padding:120px 32px 0;max-width:1100px;margin:0 auto}
h1{font-family:var(--serif);font-weight:500;font-size:112px;line-height:.95;letter-spacing:-.03em}
h1 span{display:block;color:var(--ink4)}h1 i{color:var(--brand)}
.sub{font-size:20px;color:var(--ink2);margin:30px auto 38px;max-width:560px;line-height:1.5}
.ctas{justify-content:center}
.stats{display:flex;justify-content:center;gap:0;margin:70px auto 0;max-width:820px;border-top:1px solid var(--line)}
.stats div{flex:1;padding:26px 10px 0}.stats b{font-family:var(--serif);font-weight:500;font-size:44px;display:block;letter-spacing:-.02em}
.stats span{font-size:13px;color:var(--ink3);letter-spacing:.08em;text-transform:uppercase}
''', f'''<section class="hero">
<h1><span>Stop applying.</span>Start <i>interviewing.</i></h1>
<p class="sub">Swipe right on the jobs you want. Iris's AI applies for you, so you can spend your time preparing for interviews, not filling forms.</p>
{cta()}
<div class="stats"><div><b>70%</b><span>of users land interviews</span></div><div><b>2M+</b><span>open jobs</span></div><div><b>14,000+</b><span>partner companies</span></div></div>
</section>''')

# 3 — Calendar filling up with interviews
page('3-your-calendar-full-of-interviews', '''
.hero{text-align:center;padding:64px 32px 0}
h1{font-family:var(--serif);font-weight:500;font-size:80px;line-height:1;letter-spacing:-.02em}
h1 i{color:var(--brand)}
.sub{font-size:19px;color:var(--ink2);margin:20px auto 30px;max-width:560px;line-height:1.5}
.ctas{justify-content:center}
.cal{max-width:980px;margin:56px auto 0;padding:0;overflow:hidden;text-align:left;border-bottom:0;border-radius:18px 18px 0 0}
.ch{display:flex;align-items:center;padding:14px 22px;border-bottom:1px solid var(--line);font-weight:600;font-size:15px}
.ch span{margin-left:auto;font-weight:500;color:var(--ink3);font-size:13px}
.grid{display:grid;grid-template-columns:60px repeat(5,1fr)}
.grid .h{padding:10px 12px;font-size:12.5px;color:var(--ink3);border-bottom:1px solid var(--line);border-left:1px solid var(--line)}
.grid .tm{font-size:11.5px;color:var(--ink4);padding:6px 10px;height:58px;text-align:right}
.grid .c{border-left:1px solid var(--line);border-top:1px solid #f1ece3;position:relative;height:58px}
.ev{position:absolute;inset:4px 6px;border-radius:8px;padding:7px 9px;font-size:12px;line-height:1.3;background:var(--soft);color:var(--brand-ink);border-left:3px solid var(--brand)}
.ev b{display:block;font-size:12.5px}
.ev.g{background:var(--ok-soft);color:var(--ok);border-color:var(--ok)}
''', f'''<section class="hero">
<div class="pill"><span class="dot"></span>Every minute, someone on Iris lands an interview</div>
<h1 style="margin-top:22px">Your week, <i>full of interviews.</i></h1>
<p class="sub">Swipe on jobs. Our AI applies to them for you. 70% of Iris users land interviews from the companies they apply to.</p>
{cta()}
<div class="cal card"><div class="ch">Next week <span>5 interviews scheduled</span></div>
<div class="grid">
<div></div><div class="h">Mon</div><div class="h">Tue</div><div class="h">Wed</div><div class="h">Thu</div><div class="h">Fri</div>
<div class="tm">10 AM</div><div class="c"><div class="ev"><b>Interview</b>Product Analyst</div></div><div class="c"></div><div class="c"><div class="ev"><b>Recruiter call</b>Data Associate</div></div><div class="c"></div><div class="c"></div>
<div class="tm">12 PM</div><div class="c"></div><div class="c"><div class="ev"><b>Interview</b>Marketing Lead</div></div><div class="c"></div><div class="c"></div><div class="c"><div class="ev g"><b>Final round</b>Product Analyst</div></div>
<div class="tm">3 PM</div><div class="c"></div><div class="c"></div><div class="c"></div><div class="c"><div class="ev"><b>Interview</b>Ops Manager</div></div><div class="c"></div>
</div></div>
</section>''')

# 4 — Split: swipe (input) → interview (outcome)
page('4-swipe-today-interview-tomorrow', '''
.hero{max-width:1240px;margin:0 auto;padding:60px 32px 0;text-align:center}
h1{font-family:var(--serif);font-weight:500;font-size:84px;line-height:1;letter-spacing:-.02em}
h1 i{color:var(--brand)}
.sub{font-size:19px;color:var(--ink2);margin:20px auto 30px;max-width:540px;line-height:1.5}
.ctas{justify-content:center}
.flow{display:flex;align-items:center;justify-content:center;gap:34px;margin-top:58px}
.lbl{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink4);margin-bottom:12px}
.job{width:300px;padding:22px;text-align:left;transform:rotate(-3deg)}
.job .co{display:flex;gap:12px;align-items:center}.job b{font-size:17px}.job .m{font-size:13px;color:var(--ink3)}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin:16px 0}.chips span{font-size:12px;background:#f3efe7;border-radius:999px;padding:4px 10px;color:var(--ink2)}
.acts{display:flex;justify-content:center;gap:18px;margin-top:6px}.acts span{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--line);font-size:20px;background:#fff}
.acts .y{background:var(--brand);color:#fff;border-color:var(--brand)}
.arrow{font-family:var(--serif);font-style:italic;font-size:22px;color:var(--ink3)}
.arrow div{font-size:44px;font-style:normal;color:var(--brand)}
.out{width:340px;padding:20px;text-align:left}
.out .r{display:flex;gap:12px;align-items:center}.out b{font-size:15px}.out .t{margin-left:auto;font-size:12px;color:var(--ink4)}
.out p{font-size:15px;margin-top:12px;line-height:1.45}
.out .ok{margin-top:14px;display:inline-flex;gap:6px;font-size:12.5px;font-weight:600;color:var(--ok);background:var(--ok-soft);padding:5px 10px;border-radius:999px}
''', f'''<section class="hero">
<h1>Swipe today.<br><i>Interview tomorrow.</i></h1>
<p class="sub">Swipe right on jobs you like and our AI applies for you. 70% of Iris users land interviews.</p>
{cta()}
<div class="flow">
<div><div class="lbl">Today</div><div class="job card"><div class="co"><div class="av" style="background:#23201b">A</div><div><b>Product Analyst</b><div class="m">Bengaluru · Hybrid</div></div></div>
<div class="chips"><span>₹18–24 LPA</span><span>2–4 yrs</span><span>SQL</span><span>Python</span></div>
<div class="acts"><span>✕</span><span class="y">♥</span></div></div></div>
<div class="arrow">AI applies<div>→</div></div>
<div><div class="lbl">Tomorrow</div><div class="out card"><div class="r"><div class="av" style="background:#6d4ae0">H</div><b>Hiring Team</b><span class="t">9:14 AM</span></div>
<p>"Hi! Your application stood out. We'd love to schedule an interview with you."</p><span class="ok">✓ Interview invite</span></div></div>
</div></section>''')

# 5 — Live feed of interviews landing (must be wired to real, anonymised data)
page('5-live-interview-feed', '''
.hero{max-width:1240px;margin:0 auto;padding:80px 32px 0;display:grid;grid-template-columns:1.1fr .9fr;gap:70px;align-items:center}
h1{font-family:var(--serif);font-weight:500;font-size:84px;line-height:1;letter-spacing:-.02em}
h1 i{color:var(--brand)}
.sub{font-size:19px;color:var(--ink2);margin:24px 0 32px;max-width:480px;line-height:1.55}
.proof{margin-top:24px}
.feed{padding:8px 0;overflow:hidden;position:relative}
.feed::after{content:"";position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(transparent,var(--surface));border-radius:0 0 16px 16px}
.fh{display:flex;align-items:center;gap:10px;padding:14px 22px;font-weight:600;font-size:14px;border-bottom:1px solid var(--line)}
.fh span{margin-left:auto;color:var(--ink3);font-weight:500;font-size:12.5px}
.row{display:flex;gap:14px;align-items:center;padding:14px 22px;border-bottom:1px solid #f1ece3;font-size:14.5px}
.row .who{font-weight:600}.row .what{color:var(--ink3);font-size:13px;margin-top:2px}
.row .t{margin-left:auto;font-size:12px;color:var(--ink4);white-space:nowrap}
.ini{width:34px;height:34px;border-radius:50%;background:#f3efe7;display:grid;place-items:center;font-weight:600;font-size:13px;color:var(--ink2)}
.b{font-size:11px;font-weight:600;padding:2px 7px;border-radius:999px;margin-left:6px;background:var(--ok-soft);color:var(--ok)}
.b.o{background:var(--soft);color:var(--brand-ink)}
''', f'''<section class="hero"><div>
<h1>Someone just got an interview. <i>You're next.</i></h1>
<p class="sub">Swipe right on jobs, and our AI applies for you across 2M+ openings and 14,000+ partner companies. 70% of Iris users land interviews.</p>
{cta()}
<div class="proof"><span class="dot"></span>Every minute, someone on Iris lands an interview</div></div>
<div class="feed card"><div class="fh"><span class="dot"></span>Landing right now<span>live</span></div>
<div class="row"><div class="ini">A</div><div><div class="who">Ananya <span class="b">Interview</span></div><div class="what">Product Analyst · Bengaluru</div></div><span class="t">just now</span></div>
<div class="row"><div class="ini">R</div><div><div class="who">Rohit <span class="b">Interview</span></div><div class="what">Backend Engineer · Remote</div></div><span class="t">1m ago</span></div>
<div class="row"><div class="ini">S</div><div><div class="who">Sana <span class="b o">Offer</span></div><div class="what">Marketing Associate · Mumbai</div></div><span class="t">3m ago</span></div>
<div class="row"><div class="ini">K</div><div><div class="who">Karthik <span class="b">Interview</span></div><div class="what">Data Scientist · Hyderabad</div></div><span class="t">4m ago</span></div>
<div class="row"><div class="ini">M</div><div><div class="who">Meera <span class="b">Interview</span></div><div class="what">UX Designer · Pune</div></div><span class="t">6m ago</span></div>
<div class="row"><div class="ini">V</div><div><div class="who">Vikram <span class="b">Interview</span></div><div class="what">Sales Lead · Delhi</div></div><span class="t">7m ago</span></div>
</div></section>''')

# 6 — The offer letter: the end goal, front and centre
page('6-the-offer-letter', '''
body{background:linear-gradient(180deg,var(--bg) 0%,#f1ebff 100%)}
.hero{text-align:center;padding:76px 32px 0}
.eye{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
h1{font-family:var(--serif);font-weight:500;font-size:96px;line-height:.98;letter-spacing:-.025em;margin-top:16px}
h1 i{color:var(--brand)}
.sub{font-size:19px;color:var(--ink2);margin:22px auto 32px;max-width:560px;line-height:1.5}
.ctas{justify-content:center}
.letter{width:620px;margin:60px auto 0;padding:34px 40px 60px;text-align:left;border-radius:14px 14px 0 0;position:relative}
.letter .hd{display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink4);letter-spacing:.06em;text-transform:uppercase}
.letter h3{font-family:var(--serif);font-weight:500;font-size:34px;margin:18px 0 10px}
.letter p{font-family:var(--serif);font-size:19px;color:var(--ink2);line-height:1.5}
.stamp{position:absolute;right:-56px;top:-22px;transform:rotate(8deg);background:var(--brand);color:#fff;padding:12px 18px;border-radius:12px;font-weight:600;font-size:14px;box-shadow:0 14px 30px -12px rgba(109,74,224,.6)}
.stamp small{display:block;font-weight:500;opacity:.8;font-size:11.5px}
''', f'''<section class="hero">
<div class="eye">2M+ jobs · 14,000+ companies · 70% land interviews</div>
<h1>The job search ends<br>with <i>this letter.</i></h1>
<p class="sub">Swipe right on the jobs you want. Our AI applies for you, so you get to the interview, and the offer, faster.</p>
{cta()}
<div class="letter card"><div class="hd"><span>Offer of employment</span><span>Strictly confidential</span></div>
<h3>Dear Rahul,</h3><p>We are delighted to offer you the position of Product Analyst. Everyone you met was impressed, and we can't wait for you to join the team…</p>
<div class="stamp">Found on Iris<small>AI applied, you interviewed</small></div></div>
</section>''')
print('built')
