import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

HEAD = '''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{t}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=EB+Garamond:ital,wght@0,500;1,400;1,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="art.css"><style>{css}</style></head><body>'''

BASE = '''
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;color:#23201b;-webkit-font-smoothing:antialiased;min-height:100vh;overflow:hidden;position:relative}
.sf{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif}
.back{position:absolute;top:26px;left:34px;display:flex;align-items:center;gap:10px;font-size:14px;color:#4e4a41;z-index:5}
.back img{width:26px}
.pill{display:inline-flex;align-items:center;gap:9px;background:rgba(255,253,249,.85);backdrop-filter:blur(10px);border:1px solid rgba(35,32,27,.08);border-radius:999px;padding:8px 15px;font-size:13.5px;color:#23201b;font-weight:500}
.dot{width:8px;height:8px;border-radius:50%;background:#3aa06a;box-shadow:0 0 0 4px rgba(58,160,106,.2)}
.mailicon{width:38px;height:38px;border-radius:9px;background:linear-gradient(180deg,#5ab0ff,#1a73e8);display:grid;place-items:center;flex:none}
.mailicon svg{width:22px}
/* iOS notification */
.ntf{display:grid;grid-template-columns:38px 1fr auto;gap:11px;align-items:start;background:rgba(246,244,240,.78);backdrop-filter:blur(24px) saturate(1.4);border-radius:22px;padding:12px 14px;color:#111;box-shadow:0 10px 30px -14px rgba(0,0,0,.35)}
.ntf b{font-size:14.5px;font-weight:600;display:block}
.ntf .sj{font-size:14px;font-weight:500;margin-top:1px}
.ntf p{font-size:14px;color:#3c3c43;line-height:1.3;margin-top:1px}
.ntf .t{font-size:12.5px;color:#6b6b70}
'''

MAILSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>'

def ntf(sender, subject, preview, t, extra=''):
    return f'<div class="ntf sf" {extra}><div class="mailicon">{MAILSVG}</div><div><b>{sender}</b><div class="sj">{subject}</div><p>{preview}</p></div><span class="t">{t}</span></div>'

NOTIFS = (ntf('Hiring Team', 'Interview invitation', "Hi Rahul, we'd love to schedule an interview with you.", 'now')
          + ntf('Recruiter', 'Quick call this week?', 'Your profile stood out. Are you free Thursday?', '6m ago')
          + ntf('People Ops', 'Next steps: final round', 'Congratulations on clearing round one! Here’s what’s next…', '32m ago'))

EMAIL_CSS = '''
.em{font-size:15px;line-height:1.5;color:#2b2b2e}
.em .subj{font-size:21px;font-weight:700;line-height:1.2;letter-spacing:-.01em;color:#111}
.em .from{display:flex;align-items:center;gap:10px;margin:14px 0 16px;padding-bottom:14px;border-bottom:1px solid #e6e6e9}
.em .av{width:38px;height:38px;border-radius:50%;border:1px solid #e6e6e9;display:grid;place-items:center;background:#fff;flex:none}
.em .av img{width:24px}
.em .from b{font-size:14.5px;color:#111}.em .from span{font-size:13px;color:#8a8a8e;display:block}
.em .from .tm{margin-left:auto;font-size:13px;color:#8a8a8e}
.em .q{font-family:'EB Garamond',Georgia,serif;font-style:italic;font-size:21px;line-height:1.3;color:#111;border-left:3px solid #6d4ae0;padding:2px 0 2px 14px;margin-bottom:16px}
.em p{margin-bottom:13px}
.em .live{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#2f7a55;background:#e9f5ee;border-radius:10px;padding:9px 12px;margin-bottom:14px}
.em .st{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:2px 0 15px}
.em .st div{background:#f4f1eb;border-radius:11px;padding:9px 10px}
.em .st b{display:block;font-size:17px;color:#111;letter-spacing:-.01em}.em .st span{font-size:11.5px;color:#6b6760}
.em .code{font-weight:700;color:#5536c4;background:#efeafc;padding:1px 7px;border-radius:6px}
.em .cta{display:block;text-align:center;background:#6d4ae0;color:#fff;font-weight:600;font-size:16px;padding:14px;border-radius:13px;margin:4px 0 6px}
.em .fine{text-align:center;font-size:12px;color:#8a8a8e;margin-bottom:14px}
'''

def email(time='7:41 AM', full=False, compact=False):
    extra = ('<p>With 2 million+ jobs and 14,000+ partner companies, the role that changes your career is already out there. '
             'You just have to keep applying, and Iris applies for you.</p>') if full else ''
    return f'''<div class="em sf">
<div class="subj">Imagine waking up to this tomorrow.</div>
<div class="from"><div class="av"><img src="logo.png"></div><div><b>Team Iris</b><span>To: Rahul</span></div><span class="tm">{time}</span></div>
<div class="q">“We'd love to schedule an interview with you.”</div>
<p>Hey Rahul,</p>
<p>Imagine opening your inbox to those words. That's the moment we built Iris for, and <b>70% of Iris users</b> get interviews from the companies they apply to.</p>
{'' if compact else '<div class="live"><span class="dot"></span>Every minute, someone on Iris lands an interview.</div>'}
<div class="st"><div><b>2M+</b><span>jobs</span></div><div><b>14,000+</b><span>companies</span></div><div><b>70%</b><span>get interviews</span></div></div>
{extra}<p>Your free swipes are over, but your job search doesn't have to be. Use <span class="code">IRIS10</span> for an exclusive discount on any plan.</p>
<a class="cta">Get started for ₹4</a><div class="fine">₹4 per application · cancel any time</div>
<p style="margin:0">We're rooting for you,<br>Team Iris</p>
</div>'''

STATUS = '''<div class="status sf"><span>7:42</span><span class="ic"><i class="sig"></i><i class="wifi"></i><i class="bat"></i></span></div>'''

PHONE_CSS = '''
.phone{width:372px;height:790px;border-radius:58px;background:#1b1b1d;padding:11px;box-shadow:0 0 0 2px #3a3a3d inset,0 50px 90px -30px rgba(20,15,10,.55),0 18px 30px -18px rgba(20,15,10,.4);position:relative}
.screen{width:100%;height:100%;border-radius:47px;overflow:hidden;position:relative;background:#fff}
.island{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:112px;height:32px;background:#000;border-radius:20px;z-index:10}
.status{position:absolute;top:0;left:0;right:0;height:52px;display:flex;justify-content:space-between;align-items:center;padding:4px 30px 0 36px;font-size:15.5px;font-weight:600;z-index:9}
.status .ic{display:flex;gap:6px;align-items:center}
.sig{width:17px;height:11px;background:linear-gradient(90deg,currentColor 0 3px,transparent 3px 4.5px,currentColor 4.5px 7.5px,transparent 7.5px 9px,currentColor 9px 12px,transparent 12px 13.5px,currentColor 13.5px);clip-path:polygon(0 75%,22% 75%,22% 50%,48% 50%,48% 25%,74% 25%,74% 0,100% 0,100% 100%,0 100%)}
.wifi{width:15px;height:11px;background:currentColor;clip-path:polygon(50% 100%,0 30%,15% 12%,50% 0,85% 12%,100% 30%)}
.bat{width:25px;height:12px;border:1.5px solid currentColor;border-radius:4px;position:relative;opacity:.9}
.bat::after{content:"";position:absolute;inset:1.5px;right:5px;background:currentColor;border-radius:1.5px}
.lock{background:url(dusk.webp) center/cover;color:#fff}
.lock .status{color:#fff}
.lock .date{text-align:center;margin-top:70px;font-size:18px;font-weight:500;opacity:.95}
.lock .clock{text-align:center;font-size:92px;font-weight:600;letter-spacing:-.03em;line-height:1;margin-top:2px;text-shadow:0 2px 20px rgba(0,0,0,.08)}
.lock .stack{position:absolute;left:10px;right:10px;bottom:120px;display:grid;gap:7px}
.lock .more{text-align:center;font-size:12.5px;color:#fff;opacity:.85;margin-bottom:4px}
.lock .bottom{position:absolute;bottom:30px;left:0;right:0;display:flex;justify-content:space-between;padding:0 44px}
.lock .bottom i{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.22);backdrop-filter:blur(10px)}
.lock .home{position:absolute;bottom:9px;left:50%;transform:translateX(-50%);width:130px;height:5px;border-radius:3px;background:#fff}
.mail .status{color:#111;background:#fff}
.mail .nav{position:absolute;top:52px;left:0;right:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;color:#0a7cff;font-size:17px;background:#fff;z-index:8}
.mail .nav .ar{display:flex;gap:20px;font-size:18px}
.mail .body{position:absolute;top:100px;left:0;right:0;bottom:74px;padding:6px 20px 0;overflow:hidden}
.compact .em{font-size:14px;line-height:1.45}.compact .em .q{font-size:19px;margin-bottom:12px}.compact .em p{margin-bottom:10px}.compact .em .from{margin:10px 0 12px;padding-bottom:10px}.compact .em .subj{font-size:20px}.compact .em .st{margin-bottom:11px}.compact .em .cta{padding:12px}
.mail .tool{position:absolute;bottom:0;left:0;right:0;height:74px;border-top:1px solid #e6e6e9;background:rgba(250,250,250,.95);display:flex;justify-content:space-around;padding-top:14px;color:#0a7cff;font-size:19px}
.mail .home{position:absolute;bottom:9px;left:50%;transform:translateX(-50%);width:130px;height:5px;border-radius:3px;background:#111}
'''

def lock_screen():
    return f'''<div class="phone"><div class="island"></div><div class="screen lock">{STATUS}
<div class="date sf">Friday, 28 November</div><div class="clock sf">7:42</div>
<div class="stack"><div class="more sf">3 new interview requests</div>{NOTIFS}</div>
<div class="bottom"><i></i><i></i></div><div class="home"></div></div></div>'''

def mail_screen():
    return f'''<div class="phone"><div class="island"></div><div class="screen mail">{STATUS}
<div class="nav sf"><span>‹ Inbox</span><span class="ar"><span>⌃</span><span>⌄</span></span></div>
<div class="body compact">{email(compact=True)}</div>
<div class="tool sf"><span>⚑</span><span>▢</span><span>↩</span><span>✎</span></div><div class="home"></div></div></div>'''

def phones_page(name, bg, dark_text=True):
    css = BASE + EMAIL_CSS + PHONE_CSS + '''
.wrap{max-width:1300px;margin:0 auto;height:1000px;display:grid;grid-template-columns:1fr 760px;align-items:center;padding:0 40px;gap:20px}
h1{font-family:'EB Garamond',Georgia,serif;font-weight:500;font-size:58px;line-height:1.02;letter-spacing:-.02em;margin:22px 0 18px}
h1 i{color:#5536c4}
.lede{font-size:18.5px;line-height:1.55;color:#3d3932;max-width:440px}
.btn{display:inline-block;background:#23201b;color:#fff;font-weight:600;font-size:16px;padding:15px 28px;border-radius:999px;margin-top:28px}
.small{font-size:13.5px;color:#4e4a41;margin-top:12px}
.phones{position:relative;height:820px}
.phones .p1{position:absolute;left:0;top:30px;transform:rotate(-5deg) scale(.94);transform-origin:bottom right}
.phones .p2{position:absolute;right:0;top:0}
.textcard{background:rgba(255,253,249,.72);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.6);border-radius:28px;padding:36px 38px}
'''
    left = f'''<div class="textcard"><div class="pill"><span class="dot"></span>Every minute, someone on Iris lands an interview</div>
<h1>Tomorrow morning, this could be <i>your phone.</i></h1>
<p class="lede">Your free swipes are over. Keep applying, and the next notification you wake up to could be the interview you've been waiting for.</p>
<a class="btn">Get started for ₹4 →</a><div class="small">Use code <b>IRIS10</b> for an exclusive discount · cancel any time</div></div>'''
    html = HEAD.format(t=name, css=css) + f'<div class="bg {bg} grain"></div><div class="back"><img src="logo.png">← Back to jobs</div>'
    html += f'<div class="wrap"><div>{left}</div><div class="phones"><div class="p1">{lock_screen()}</div><div class="p2">{mail_screen()}</div></div></div></body></html>'
    open(name + '.html', 'w').write(html)

def laptop_page(name, bg):
    css = BASE + EMAIL_CSS + '''
.menubar{height:30px;background:rgba(255,255,255,.55);backdrop-filter:blur(20px);display:flex;align-items:center;gap:20px;padding:0 18px;font-size:13.5px;color:#111}
.menubar b{font-weight:700}.menubar .r{margin-left:auto;display:flex;gap:16px}
.top{margin:22px 0 22px 36px}
.side-copy{position:absolute;right:22px;top:470px;width:356px;background:rgba(255,253,249,.8);backdrop-filter:blur(14px);border-radius:22px;padding:26px}
.side-copy h2{font-family:'EB Garamond',Georgia,serif;font-weight:500;font-size:38px;line-height:1.05;letter-spacing:-.01em}.side-copy h2 i{color:#5536c4}
.side-copy p{font-size:15px;color:#4e4a41;line-height:1.5;margin:12px 0 18px}.side-copy a{display:inline-block;background:#23201b;color:#fff;font-weight:600;padding:13px 22px;border-radius:999px;font-size:15px}
.win{width:1010px;height:800px;margin:0 0 0 36px;background:#fff;border-radius:14px;overflow:hidden;display:grid;grid-template-columns:180px 290px 1fr;box-shadow:0 0 0 1px rgba(0,0,0,.12),0 50px 100px -30px rgba(20,15,10,.55)}
.side{background:rgba(236,233,228,.92);padding:14px 10px;font-size:13.5px;color:#333}
.lights{display:flex;gap:8px;margin:2px 6px 22px}.lights i{width:12px;height:12px;border-radius:50%}
.side .h{font-size:11px;font-weight:600;color:#8a8a8e;margin:10px 8px 6px}
.side .f{display:flex;justify-content:space-between;padding:6px 8px;border-radius:7px}
.side .on{background:rgba(0,0,0,.08);font-weight:600}
.list{border-right:1px solid #e6e6e9;overflow:hidden}
.lh{padding:16px 16px 12px;border-bottom:1px solid #e6e6e9}.lh b{font-size:19px}.lh span{display:block;font-size:12px;color:#8a8a8e}
.it{padding:11px 16px 11px 26px;border-bottom:1px solid #eeeef0;font-size:13px;position:relative}
.it .r{display:flex;justify-content:space-between}.it b{font-size:13.5px}.it .t{color:#8a8a8e;font-size:12px}
.it .s{color:#111;margin-top:1px}.it .p{color:#8a8a8e;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.it.sel{background:#0a7cff;color:#fff}.it.sel .t,.it.sel .p,.it.sel .s{color:rgba(255,255,255,.88)}
.it.un::before{content:"";position:absolute;left:10px;top:16px;width:8px;height:8px;border-radius:50%;background:#0a7cff}
.read{overflow:hidden;padding:26px 34px}
.read .em{max-width:600px;font-size:15.5px}
.read .em .subj{font-size:25px}
.banners{position:absolute;top:96px;right:22px;width:356px;display:grid;gap:8px;z-index:5}
.banners .ntf{border-radius:16px;background:rgba(246,244,240,.86)}
'''
    items = [('Team Iris', 'Just now', 'Imagine waking up to this tomorrow.', '“We’d love to schedule an interview with you.”', 'sel'),
             ('Iris', '7:02 AM', 'Your free swipes are over', 'You applied to 10 jobs this week. Here’s what happens next…', 'un'),
             ('Iris', 'Yesterday', 'Applied: Product Analyst', 'Our AI submitted your application in seconds…', ''),
             ('Iris', 'Yesterday', 'Applied: Data Associate', 'Application submitted. We’ll let you know when…', ''),
             ('Iris', 'Wed', 'Applied: Business Analyst', 'Application submitted with your tailored answers…', ''),
             ('Iris', 'Tue', 'Welcome to Iris', 'Swipe right on jobs you like. We’ll do the rest…', '')]
    lst = ''.join(f'<div class="it {c}"><div class="r"><b>{a}</b><span class="t">{t}</span></div><div class="s">{s}</div><div class="p">{p}</div></div>' for a, t, s, p, c in items)
    html = HEAD.format(t=name, css=css) + f'<div class="bg {bg}"></div>'
    html += '<div class="menubar sf"><b>Mail</b><span>File</span><span>Edit</span><span>View</span><span>Mailbox</span><span>Message</span><span class="r"><span>Fri 28 Nov  7:42 AM</span></span></div>'
    html += f'<div class="banners">{NOTIFS}</div><div class="side-copy"><h2>Tomorrow, this could be <i>your inbox.</i></h2><p>Your free swipes are over. Keep applying, and wake up to the interview you\'ve been waiting for.</p><a>Get started for ₹4 →</a></div>'
    html += '<div class="top"><div class="pill"><span class="dot"></span>Every minute, someone on Iris lands an interview</div></div>'
    html += f'''<div class="win sf"><div class="side"><div class="lights"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
<div class="h">Favourites</div><div class="f on"><span>Inbox</span><span>2</span></div><div class="f"><span>VIP</span></div><div class="f"><span>Flagged</span></div><div class="f"><span>Sent</span></div><div class="f"><span>Drafts</span></div>
<div class="h">Smart mailboxes</div><div class="f"><span>Interviews</span><span style="color:#8a8a8e">0</span></div><div class="f"><span>Offers</span><span style="color:#8a8a8e">0</span></div></div>
<div class="list"><div class="lh"><b>Inbox</b><span>2 unread</span></div>{lst}</div>
<div class="read">{email(time='7:41 AM', full=True)}</div></div></body></html>'''
    open(name + '.html', 'w').write(html)

def mobile_page(name, bg):
    css = BASE + EMAIL_CSS + '''
body{overflow:auto}
.top{padding:22px 14px 26px;text-align:center;position:relative}
.top .pill{font-size:12.5px;margin-bottom:12px}
.top .ntfs{display:grid;gap:7px;text-align:left}
.top .ntf:nth-child(2){opacity:.92}.top .ntf:nth-child(3){opacity:.8}
.mailcard{background:#fff;border-radius:24px 24px 0 0;padding:20px 20px 30px;box-shadow:0 -10px 30px -18px rgba(0,0,0,.3)}
.mailcard .nav{display:flex;justify-content:space-between;color:#0a7cff;font-size:16px;margin-bottom:14px}
'''
    html = HEAD.format(t=name, css=css) + f'<div class="bg {bg}"></div>'
    html += f'<div class="top"><div class="pill"><span class="dot"></span>Every minute, someone on Iris lands an interview</div><div class="ntfs">{NOTIFS}</div></div>'
    html += f'<div class="mailcard"><div class="nav sf"><span>‹ Back to jobs</span><span>Iris</span></div>{email()}</div></body></html>'
    open(name + '.html', 'w').write(html)

phones_page('A-phones-clouds', 'bg-clouds')
phones_page('B-phones-window-light', 'bg-blinds')
phones_page('C-phones-pastel', 'bg-mesh')
laptop_page('D-laptop-sunrise-painting', 'bg-sunrise')
laptop_page('E-laptop-painterly-dawn', 'bg-paint')
mobile_page('M1-mobile-clouds', 'bg-clouds')
mobile_page('M2-mobile-dusk', 'bg-dusk')
print('ok')
