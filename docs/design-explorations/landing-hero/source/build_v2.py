import os
HERE = os.path.dirname(os.path.abspath(__file__))
OC = next(p for p in (os.path.join(HERE, '../../out-of-credits/source/build_v2.py'), os.path.join(HERE, '../../Iris out-of-credits email designs/source/build_v2.py')) if os.path.exists(p))
src = open(OC).read()
exec(src.split("phones_page('A-")[0].replace("os.chdir(os.path.dirname(os.path.abspath(__file__)))", ''))
os.chdir(HERE)
exec(open('_parts.py').read())  # NAV, APPLE, PLAY

CTA_ROW = f'<div class="ctas"><span class="btn dark">{APPLE}App Store</span><span class="btn dark">{PLAY}Google Play</span><span class="btn ghost">Continue on web</span></div>'

HERO_CSS = BASE + EMAIL_CSS + PHONE_CSS + '''
nav{display:flex;align-items:center;gap:30px;max-width:1240px;margin:16px auto 0;padding:12px 14px 12px 22px;font-size:15px;color:#4e4a41;background:rgba(255,253,249,.78);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.7);border-radius:999px;position:relative;z-index:5}
nav .logo{display:flex;align-items:center;gap:9px;font-family:'EB Garamond',Georgia,serif;font-size:25px;color:#23201b;margin-right:auto}
nav .logo img{width:30px}
nav .dl{background:#23201b;color:#fff;padding:10px 18px;border-radius:999px;font-weight:500}
.serif{font-family:'EB Garamond',Georgia,serif}
.eyebrow{font-size:19px;color:#23201b}.eyebrow b{color:#5536c4;font-weight:600}
h1{font-family:'EB Garamond',Georgia,serif;font-weight:500;letter-spacing:-.025em;line-height:.98;color:#1d1a16}
h1 i{color:#5536c4}
.sub{font-size:19px;line-height:1.55;color:#3d3932}
.ctas{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:9px;padding:14px 22px;border-radius:999px;font-weight:600;font-size:15.5px;border:1px solid transparent}
.btn.dark{background:#23201b;color:#fff;box-shadow:0 8px 20px -10px rgba(0,0,0,.5)}
.btn.ghost{background:#fffdf9;border-color:rgba(35,32,27,.12);color:#23201b}
.btn svg{width:16px;height:16px}
.card{background:#fffdf9;border:1px solid #e8e2d7;border-radius:18px;box-shadow:0 30px 60px -28px rgba(35,32,27,.35)}
.ntf{text-align:left}
.tag{display:inline-block;font-size:11px;font-weight:600;background:#e4f2ea;color:#2f7a55;padding:2px 8px;border-radius:999px}
'''

def page(name, bg, css, body):
    html = HEAD.format(t=name, css=HERO_CSS + css) + f'<div class="bg {bg} grain"></div>{NAV}{body}</body></html>'
    open(name + '.html', 'w').write(html)

PILL = '<div class="pill"><span class="dot"></span>Every minute, someone on Iris lands an interview</div>'
EYEBROW = '<div class="eyebrow">The <b>Tinder for jobs</b>, with an AI that applies</div>'

def jobcard(title='Product Analyst', where='Bengaluru · Hybrid', pay='₹18–24 LPA', chips=('2–4 yrs', 'SQL', 'Python'), letter='F', color='#23201b'):
    ch = ''.join(f'<span>{c}</span>' for c in (pay,) + tuple(chips))
    return f'''<div class="job card"><div class="co"><div class="av" style="background:{color}">{letter}</div><div><b>{title}</b><div class="m">{where}</div></div></div>
<div class="chips">{ch}</div><div class="acts"><span>✕</span><span class="y">♥</span></div></div>'''

JOB_CSS = '''
.job{width:320px;padding:22px;text-align:left}
.job .co{display:flex;gap:12px;align-items:center}.job b{font-size:18px}.job .m{font-size:13px;color:#797366}
.av{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:#fff;font-weight:700}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin:16px 0}.chips span{font-size:12px;background:#f3efe7;border-radius:999px;padding:5px 10px;color:#4e4a41}
.acts{display:flex;justify-content:center;gap:18px}.acts span{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;border:1px solid #e8e2d7;font-size:20px;background:#fff}
.acts .y{background:#6d4ae0;color:#fff;border-color:#6d4ae0}
'''

# H1 — Wake up to interviews (clouds)
page('H1-wake-up-to-interviews', 'bg-clouds', '''
.hero{max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1fr 430px;gap:60px;align-items:center;padding:36px 30px 0;height:820px}
.copy{background:rgba(255,253,249,.74);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.7);border-radius:30px;padding:44px 46px}
h1{font-size:92px;margin:22px 0 20px}
.sub{max-width:520px;margin-bottom:30px}
.phonewrap{transform:scale(.92);transform-origin:center}
''', f'''<section class="hero"><div class="copy">{EYEBROW}
<h1>Swipe tonight.<br>Wake up to <i>interviews.</i></h1>
<p class="sub">Swipe right on jobs you like, and our AI applies for you across 2M+ openings. 70% of Iris users land interviews from the companies they apply to.</p>
{CTA_ROW}<div style="margin-top:22px">{PILL}</div></div>
<div class="phonewrap">{lock_screen()}</div></section>''')

# H2 — Swipe right. Get interviews. (dusk painting, card stack + floating notifs)
page('H2-swipe-right-get-interviews', 'bg-dusk', JOB_CSS + '''
.hero{text-align:center;padding:50px 30px 0;position:relative;height:840px}
h1{font-size:104px;margin:16px 0 18px}
.sub{max-width:560px;margin:0 auto 28px}
.ctas{justify-content:center}
.stage{position:relative;width:1100px;height:360px;margin:34px auto 0}
.stack{position:absolute;left:50%;top:20px;transform:translateX(-50%)}
.stack .job{position:relative;z-index:3}
.stack .ghost1,.stack .ghost2{position:absolute;inset:0;background:#fffdf9;border-radius:18px;border:1px solid #e8e2d7}
.stack .ghost1{transform:rotate(-6deg) translate(-14px,10px);z-index:1;opacity:.85}.stack .ghost2{transform:rotate(5deg) translate(14px,8px);z-index:2;opacity:.9}
.stamp{position:absolute;top:26px;right:-30px;z-index:4;transform:rotate(14deg);border:3px solid #2f7a55;color:#2f7a55;font-weight:800;letter-spacing:.08em;padding:4px 12px;border-radius:8px;background:rgba(255,255,255,.9);font-size:20px}
.f{position:absolute;width:330px;text-align:left}
.f1{left:0;top:30px;transform:rotate(-3deg)}.f2{right:0;top:0;transform:rotate(3deg)}.f3{right:30px;top:170px;transform:rotate(-2deg)}
''', f'''<section class="hero">{EYEBROW}
<h1>Swipe right. <i>Get interviews.</i></h1>
<p class="sub">Like a job, and Iris's AI applies to it for you, in seconds. Every minute, someone on Iris lands an interview.</p>
{CTA_ROW}
<div class="stage"><div class="stack"><div class="ghost1"></div><div class="ghost2"></div>{jobcard()}<div class="stamp">APPLIED</div></div>
<div class="f f1">{ntf('Hiring Team','Interview invitation',"We'd love to schedule an interview with you.",'now')}</div>
<div class="f f2">{ntf('Recruiter','Quick call this week?','Your profile stood out. Free Thursday?','4m ago')}</div>
<div class="f f3">{ntf('People Ops','Next steps: final round','Congratulations on clearing round one!','1h ago')}</div></div>
</section>''')

# H3 — Stop applying. Start interviewing. (window light, typographic)
page('H3-stop-applying-start-interviewing', 'bg-blinds', '''
.hero{text-align:center;padding:96px 30px 0;max-width:1100px;margin:0 auto}
h1{font-size:120px;margin:22px 0 26px}h1 span{display:block;color:#a89f8e}
.sub{max-width:580px;margin:0 auto 34px}
.ctas{justify-content:center}
.stats{display:flex;max-width:860px;margin:64px auto 0;background:rgba(255,253,249,.7);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.8);border-radius:22px}
.stats div{flex:1;padding:22px 10px;border-right:1px solid rgba(35,32,27,.08)}.stats div:last-child{border:0}
.stats b{font-family:'EB Garamond',Georgia,serif;font-weight:500;font-size:46px;display:block;letter-spacing:-.02em}
.stats span{font-size:12.5px;color:#797366;letter-spacing:.08em;text-transform:uppercase}
''', f'''<section class="hero">{EYEBROW}
<h1><span>Stop applying.</span>Start <i>interviewing.</i></h1>
<p class="sub">Swipe right on the jobs you want. Our AI fills every form and answers every question, so your time goes into interview prep, not applications.</p>
{CTA_ROW}
<div class="stats"><div><b>1 / min</b><span>interviews landed</span></div><div><b>70%</b><span>of users get interviews</span></div><div><b>2M+</b><span>open jobs</span></div><div><b>14,000+</b><span>companies</span></div></div>
</section>''')

# H4 — Swipe today. Interview tomorrow. (painterly dawn)
page('H4-swipe-today-interview-tomorrow', 'bg-paint', JOB_CSS + '''
.hero{text-align:center;padding:46px 30px 0}
h1{font-size:96px;margin:16px 0 18px}
.sub{max-width:560px;margin:0 auto 28px}
.ctas{justify-content:center}
.flow{display:flex;align-items:center;justify-content:center;gap:30px;margin-top:46px}
.lbl{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#4e4a41;margin-bottom:12px;font-weight:600}
.job{transform:rotate(-3deg)}
.arrow{font-family:'EB Garamond',Georgia,serif;font-style:italic;font-size:22px;color:#3d3932}.arrow div{font-size:46px;font-style:normal;color:#5536c4}
.out{width:360px}
''', f'''<section class="hero">{EYEBROW}
<h1>Swipe today.<br><i>Interview tomorrow.</i></h1>
<p class="sub">Swipe right on jobs you like and our AI applies for you. 70% of Iris users land interviews.</p>
{CTA_ROW}
<div class="flow"><div><div class="lbl">Today, 11:48 PM</div>{jobcard()}</div>
<div class="arrow">AI applies<div>→</div></div>
<div class="out"><div class="lbl">Tomorrow, 9:14 AM</div>{ntf('Hiring Team','Interview invitation',"Hi Rahul! Your application stood out. We'd love to schedule an interview with you.",'now')}</div></div>
<div style="margin-top:34px">{PILL}</div>
</section>''')

# H5 — Live feed (pastel mesh) — needs real anonymised data before shipping
rows = [('A', 'Ananya', 'Interview', 'Product Analyst · Bengaluru', 'just now'), ('R', 'Rohit', 'Interview', 'Backend Engineer · Remote', '1m ago'),
        ('S', 'Sana', 'Offer', 'Marketing Associate · Mumbai', '3m ago'), ('K', 'Karthik', 'Interview', 'Data Scientist · Hyderabad', '4m ago'),
        ('M', 'Meera', 'Interview', 'UX Designer · Pune', '6m ago'), ('V', 'Vikram', 'Interview', 'Sales Lead · Delhi', '7m ago')]
feed = ''.join(f'<div class="row"><div class="ini">{a}</div><div><div class="who">{n} <span class="b {"o" if k=="Offer" else ""}">{k}</span></div><div class="what">{w}</div></div><span class="t">{t}</span></div>' for a, n, k, w, t in rows)
page('H5-live-interview-feed', 'bg-mesh', '''
.hero{max-width:1240px;margin:0 auto;padding:70px 30px 0;display:grid;grid-template-columns:1.1fr .9fr;gap:60px;align-items:center}
h1{font-size:88px;margin:18px 0 22px}
.sub{max-width:500px;margin-bottom:30px}
.feed{overflow:hidden;position:relative;padding-bottom:6px}
.feed::after{content:"";position:absolute;left:0;right:0;bottom:0;height:110px;background:linear-gradient(transparent,#fffdf9)}
.fh{display:flex;align-items:center;gap:10px;padding:15px 22px;font-weight:600;font-size:14px;border-bottom:1px solid #e8e2d7}
.fh span{margin-left:auto;color:#797366;font-weight:500;font-size:12.5px}
.row{display:flex;gap:14px;align-items:center;padding:14px 22px;border-bottom:1px solid #f1ece3;font-size:14.5px}
.who{font-weight:600}.what{color:#797366;font-size:13px;margin-top:2px}.row .t{margin-left:auto;font-size:12px;color:#a39c8e}
.ini{width:36px;height:36px;border-radius:50%;background:#f3efe7;display:grid;place-items:center;font-weight:600;font-size:13px}
.b{font-size:11px;font-weight:600;padding:2px 7px;border-radius:999px;margin-left:6px;background:#e4f2ea;color:#2f7a55}.b.o{background:#efeafc;color:#5536c4}
''', f'''<section class="hero"><div>{EYEBROW}
<h1>Someone just got an interview. <i>You're next.</i></h1>
<p class="sub">Swipe right on jobs, and our AI applies for you across 2M+ openings and 14,000+ partner companies.</p>
{CTA_ROW}</div>
<div class="feed card"><div class="fh"><span class="dot"></span>Every minute, someone on Iris lands an interview<span>live</span></div>{feed}</div></section>''')

# H6 — It's a match (sunrise painting) — Tinder trope, outcome = interview
page('H6-its-a-match', 'bg-sunrise', '''
.hero{max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1fr 400px;gap:60px;align-items:center;padding:30px 30px 0;height:830px}
.copy{background:rgba(255,253,249,.76);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.7);border-radius:30px;padding:44px 46px}
h1{font-size:76px;margin:18px 0 18px}
.sub{max-width:520px;margin-bottom:30px}
.phonewrap{transform:scale(.9)}
.match{background:linear-gradient(180deg,rgba(25,18,12,.25),rgba(25,18,12,.6)),url(dusk.webp) center/cover;color:#fff;text-align:center}
.match .status{color:#fff}
.match .h{font-family:'EB Garamond',Georgia,serif;font-style:italic;font-size:62px;margin-top:110px;line-height:1}
.match .s{font-size:15px;opacity:.85;margin:12px 30px 0}
.match .pair{display:flex;justify-content:center;margin:40px 0 34px}
.match .pair div{width:110px;height:110px;border-radius:50%;border:4px solid #fff;display:grid;place-items:center;font-size:40px;font-weight:700;background:#f3efe7;color:#23201b}
.match .pair div:last-child{margin-left:-18px;background:#fff}.match .pair img{width:64px}
.match .card2{margin:0 22px;background:rgba(255,255,255,.2);backdrop-filter:blur(14px);border-radius:18px;padding:16px;text-align:left;font-size:14px;line-height:1.4}
.match .card2 b{display:block;font-size:15px;margin-bottom:4px}
.match .btns{position:absolute;bottom:56px;left:22px;right:22px;display:grid;gap:10px}
.match .btns span{background:#fff;color:#23201b;border-radius:999px;padding:14px;font-weight:600;font-size:15.5px}
.match .btns span+span{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}
''', f'''<section class="hero"><div class="copy">{EYEBROW}
<h1>Find your match. <i>Land the interview.</i></h1>
<p class="sub">Swipe right on jobs you love. Our AI applies for you, and when a company likes you back, it's an interview. 70% of Iris users get there.</p>
{CTA_ROW}<div style="margin-top:22px">{PILL}</div></div>
<div class="phonewrap"><div class="phone"><div class="island"></div><div class="screen match">{STATUS}
<div class="h">It's an interview!</div><div class="s sf">You and the hiring team at a fintech startup liked each other.</div>
<div class="pair"><div class="sf">R</div><div><img src="logo.png"></div></div>
<div class="card2 sf"><b>Product Analyst · Interview invite</b>"Hi Rahul, we'd love to schedule a 30-minute call this week."</div>
<div class="btns sf"><span>Pick a time</span><span>Keep swiping</span></div></div></div></div></section>''')
print('ok')

# ---------- H1 v3: Gmail notifications from real companies + live counter ----------
GMAIL = '<svg viewBox="0 0 48 48"><path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"/><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"/><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"/><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0C43.076,8,45,9.924,45,12.298z"/></svg>'
GOOGLE = '<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>'
NVIDIA = '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#76b900"/><path d="M8 24c5-8 13-12 21-11 6 1 10 5 12 11-2 6-6 10-12 11-8 1-16-3-21-11z" fill="none" stroke="#fff" stroke-width="3.2"/><path d="M17 24c2-5 7-7 11-6 3 1 5 3 5 6s-2 5-5 6c-4 1-8-1-9-4" fill="none" stroke="#fff" stroke-width="3"/><circle cx="26" cy="24" r="2.6" fill="#fff"/></svg>'
MSFT = '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#fff"/><rect x="9" y="9" width="14" height="14" fill="#f25022"/><rect x="25" y="9" width="14" height="14" fill="#7fba00"/><rect x="9" y="25" width="14" height="14" fill="#00a4ef"/><rect x="25" y="25" width="14" height="14" fill="#ffb900"/></svg>'

def gntf(logo, sender, subject, preview, t):
    full = ' full' if logo is NVIDIA else ''
    return f'''<div class="gn sf"><div class="gav"><div class="co{full}">{logo}</div><div class="gb">{GMAIL}</div></div>
<div><div class="tr"><b>{sender}</b><span class="t">{t}</span></div><div class="sj">{subject}</div><p>{preview}</p></div></div>'''

GNOTIFS = (gntf(GOOGLE, 'Google Recruiting', 'Interview invitation: Software Engineer', "Hi Rahul, we'd love to schedule a first-round interview with you.", 'now')
           + gntf(NVIDIA, 'NVIDIA Talent Acquisition', 'Next steps for your application', 'Your profile stood out to our team. Are you free this week?', '6m ago')
           + gntf(MSFT, 'Microsoft Careers', "Let's schedule your interview", 'Congratulations! The hiring team would like to meet you.', '24m ago'))

G_CSS = '''
.gn{display:grid;grid-template-columns:42px 1fr;gap:11px;align-items:start;background:rgba(246,244,240,.8);backdrop-filter:blur(24px) saturate(1.4);border-radius:22px;padding:12px 14px;color:#111;box-shadow:0 10px 30px -14px rgba(0,0,0,.35);text-align:left}
.gav{position:relative;width:40px;height:40px}
.gav .co{width:40px;height:40px;border-radius:50%;overflow:hidden;background:#fff;display:grid;place-items:center;box-shadow:0 0 0 1px rgba(0,0,0,.06)}
.gav .co svg{width:26px;height:26px}.gav .co.full svg{width:40px;height:40px}
.gav .co svg[viewBox="0 0 48 48"] rect[width="48"]{}
.gav .gb{position:absolute;right:-4px;bottom:-4px;width:20px;height:20px;border-radius:6px;background:#fff;display:grid;place-items:center;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.gav .gb svg{width:15px;height:15px}
.gn .tr{display:flex;justify-content:space-between;gap:8px}.gn b{font-size:14.5px;font-weight:600}.gn .t{font-size:12.5px;color:#6b6b70;white-space:nowrap}
.gn .sj{font-size:14px;font-weight:500;margin-top:1px}.gn p{font-size:14px;color:#3c3c43;line-height:1.3;margin-top:1px}
'''

def g_lock():
    return f'''<div class="phone"><div class="island"></div><div class="screen lock">{STATUS}
<div class="date sf">Friday, 28 November</div><div class="clock sf">7:42</div>
<div class="stack"><div class="more sf">3 new interview requests</div>{GNOTIFS}</div>
<div class="bottom"><i></i><i></i></div><div class="home"></div></div></div>'''

page('H1-wake-up-to-interviews', 'bg-clouds', G_CSS + '''
.hero{max-width:1260px;margin:0 auto;display:grid;grid-template-columns:1fr 390px;gap:44px;align-items:center;padding:22px 24px 0;height:880px}
.copy{background:rgba(255,253,249,.78);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.7);border-radius:30px;padding:34px 42px 30px}
.tag-line{display:inline-flex;align-items:center;gap:12px;font-size:25px;font-weight:500;color:#23201b;letter-spacing:-.01em}
.tag-line .tj{font-family:'EB Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:34px;color:#fff;background:linear-gradient(135deg,#7c5cf0,#5536c4);padding:2px 16px 6px;border-radius:14px;box-shadow:0 10px 24px -12px rgba(85,54,196,.8);transform:rotate(-1.5deg)}
h1{font-size:74px;margin:20px 0 16px}
.sub{max-width:540px;margin-bottom:26px;font-size:18.5px}
.live-strip{margin-top:22px;background:#fffdf9;border:1px solid #e8e2d7;border-radius:18px;display:grid;grid-template-columns:repeat(3,1fr)}
.live-strip .c{padding:13px 18px;border-right:1px solid #eee8dd}.live-strip .c:last-child{border:0}
.live-strip .top{display:flex;align-items:center;gap:7px;font-size:10.5px;font-weight:700;letter-spacing:.12em;color:#2f7a55;text-transform:uppercase}
.blink{position:relative;width:8px;height:8px;border-radius:50%;background:#34a853}
.blink::after{content:"";position:absolute;inset:-4px;border-radius:50%;background:#34a853;opacity:.35;animation:pulse 1.6s ease-out infinite}
.blink{animation:blink 1.6s ease-in-out infinite}
@keyframes pulse{0%{transform:scale(.6);opacity:.5}100%{transform:scale(1.9);opacity:0}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
.live-strip .num{font-family:'EB Garamond',Georgia,serif;font-weight:500;font-size:30px;line-height:1.1;margin-top:4px;letter-spacing:-.01em;font-variant-numeric:tabular-nums;color:#1d1a16}
.live-strip .num.bump{animation:bump .6s ease}
@keyframes bump{0%{color:#2f7a55;transform:translateY(-2px)}100%{color:#1d1a16;transform:none}}
.live-strip .lbl{font-size:12.5px;color:#797366}
.foot{margin-top:12px;font-size:13.5px;color:#4e4a41;display:flex;align-items:center;gap:8px}
.phonewrap{transform:scale(.9)}
''', f'''<section class="hero"><div class="copy">
<div class="tag-line">The <span class="tj">Tinder for jobs</span> with an AI that applies</div>
<h1>Swipe tonight.<br>Wake up to <i>interviews.</i></h1>
<p class="sub">Swipe right on jobs you like, and our AI applies for you in seconds. Wake up to recruiters from the companies you've always wanted to work for.</p>
{CTA_ROW}
<div class="live-strip">
<div class="c"><div class="top"><span class="blink"></span>Live</div><div class="num" data-base="8001">8,001</div><div class="lbl">interviews landed</div></div>
<div class="c"><div class="top"><span class="blink"></span>Live</div><div class="num" data-base="14500">14,500</div><div class="lbl">partner companies</div></div>
<div class="c"><div class="top"><span class="blink"></span>Live</div><div class="num" data-base="2006050">2,006,050</div><div class="lbl">open jobs</div></div>
</div>
<div class="foot">Every minute, someone on Iris lands an interview. 70% of users do.</div>
</div>
<div class="phonewrap">{g_lock()}</div></section>
<script>
// Shared across visitors: each counter = base + minutes since START (+1 every minute).
const START = Date.UTC(2026, 10, 26, 0, 0, 0);
const els = [...document.querySelectorAll('.num[data-base]')]; const last = new Map();
function tick(){{ const m = Math.max(0, Math.floor((Date.now() - START) / 60000));
  els.forEach(el => {{ const v = +el.dataset.base + m;
    if (last.get(el) !== v) {{ if (last.has(el)) {{ el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }}
      el.textContent = v.toLocaleString('en-US'); last.set(el, v); }} }}); }}
if (!location.hash.includes('static')) {{ tick(); setInterval(tick, 1000); }}
</script>''')
print('H1 v3 ok')
