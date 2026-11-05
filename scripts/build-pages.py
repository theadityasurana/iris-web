#!/usr/bin/env python3
"""Writes the static marketing pages: WhatsApp, Love, About and Mission."""
import html, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from site_parts import ASK_SECTION, BODY_SCRIPTS, FOOTER, HEAD_ASSETS, OG_IMAGE, APP_STORE, PLAY_STORE

PUB = Path(__file__).resolve().parent.parent / "public"
SITE = "https://irisjobs.live"
e = html.escape

BASE = """
:root { --bg: #f8f5ef; --sunken: #f1ecdf; --surface: #fffdf9; --ink: #23201b; --ink-2: #4e4a41; --muted: #797366; --line: #e8e2d7; --line-2: #d8d1c4; --accent: #5536c4; --serif: 'EB Garamond', Georgia, serif; --sans: 'DM Sans', -apple-system, 'Segoe UI', sans-serif; --mono: 'JetBrains Mono', ui-monospace, monospace; --shadow: 0 1px 2px rgba(58,48,30,.05), 0 12px 32px rgba(58,48,30,.08); --shadow-lg: 0 2px 6px rgba(58,48,30,.06), 0 36px 80px rgba(58,48,30,.2); }
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
html { background: var(--bg); }
body { font-family: var(--sans); color: var(--ink); background: var(--bg); line-height: 1.55; overflow-x: hidden; }
a { color: inherit; }
img { display: block; max-width: 100%; }
em { font-style: italic; color: var(--accent); }
.overline { font-family: var(--mono); font-size: .69rem; font-weight: 500; letter-spacing: .15em; text-transform: uppercase; color: var(--muted); }
.wrap { width: 100%; max-width: 1120px; margin: 0 auto; padding-left: 20px; padding-right: 20px; }
.pill { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 46px; padding: 0 22px; border-radius: 999px; background: var(--ink); color: #fffdf9; font-weight: 500; text-decoration: none; white-space: nowrap; box-shadow: inset 0 -2px 0 #d9a441, 0 10px 22px rgba(35,32,27,.18); }
.pill.light { background: var(--surface); color: var(--ink); box-shadow: inset 0 0 0 1px var(--line-2); }
.nav { position: sticky; top: 12px; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 12px; width: calc(100% - 24px); max-width: 1180px; margin: 12px auto 0; padding: 8px 8px 8px 16px; border-radius: 999px; background: rgba(255,253,249,.82); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: inset 0 0 0 1px var(--line), var(--shadow); }
.brand { display: flex; align-items: center; gap: 9px; font-family: var(--serif); font-weight: 500; font-size: 1.5rem; text-decoration: none; }
.brand img { width: 30px; height: 30px; border-radius: 8px; }
.nav-r { display: flex; align-items: center; gap: 20px; font-weight: 500; font-size: .93rem; color: var(--ink-2); }
.nav-r a:not(.pill) { display: none; text-decoration: none; }
.nav-r .pill { height: 42px; }
h1.big { font-family: var(--serif); font-weight: 500; font-size: clamp(3rem, 8.4vw, 6.2rem); line-height: 1; letter-spacing: -.026em; }
h2.t { font-family: var(--serif); font-weight: 500; font-size: clamp(2.1rem, 4.6vw, 3.3rem); line-height: 1.08; letter-spacing: -.016em; }
@media (min-width: 860px) { .nav-r a:not(.pill) { display: inline; } }
"""

NAV = f"""<nav class="nav" aria-label="Main"><a class="brand" href="/"><img src="/logo.webp" alt="Iris logo" width="30" height="30">Iris</a><div class="nav-r"><a href="/jobs/">Jobs</a><a href="/#pricing">Pricing</a><a href="/blog/">Blog</a><a href="/app/sign-in">Sign in</a><a class="pill" href="https://irisjobs.live/app/sign-up">Get started</a></div></nav>"""


def page(path, title, desc, css, body, ld=None, ask=True):
    url = f"{SITE}/{path}/"
    d = PUB / path
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#f8f5ef">
  <title>{e(title)}</title>
  <meta name="description" content="{e(desc)}">
  <link rel="canonical" href="{url}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{url}">
  <meta property="og:site_name" content="Iris">
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(desc)}">
  <meta property="og:image" content="{OG_IMAGE}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{e(title)}">
  <meta name="twitter:description" content="{e(desc)}">
  <meta name="twitter:image" content="{OG_IMAGE}">
  <link rel="icon" type="image/png" href="/favicon-48.png">
  <link rel="apple-touch-icon" href="/icon-192.png">
  {f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' if ld else ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  {HEAD_ASSETS}
  <style>{BASE}{css}</style>
</head>
<body>
{NAV}
{body}
{ASK_SECTION if ask else ''}
{FOOTER}
{BODY_SCRIPTS}
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
""")


WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'
WA_ICON = f'<svg viewBox="0 0 24 24" width="30" height="30" fill="#fff" role="img" aria-label="WhatsApp"><path d="{WA_PATH}"/></svg>'
WA_GREEN = f'<svg viewBox="0 0 24 24" width="15" height="15" fill="#25D366" aria-hidden="true"><path d="{WA_PATH}"/></svg>'

CHAT = [
    ("day", "Today 8:30 AM"),
    ("in", "good morning ☀️ 3 new roles fit you today"),
    ("in", "1. Product Analyst, Razorpay · 91% match\n2. Data Analyst, Swiggy · 88%\n3. Growth Analyst, Zepto · 84%"),
    ("out", "razorpay looks great"),
    ("in", "nice pick. want me to apply with your resume?"),
    ("out", "yes, go for it 🚀"),
    ("in", "on it. every field filled, resume attached ✅"),
    ("in", "submitted. I’ll tell you the moment they reply"),
]
chat_html = "".join(
    f'<div class="wa-day">{t}</div>' if k == "day" else f'<div class="wa-b {k}" style="animation-delay:{.5 + i * .85:.2f}s">{e(t).replace(chr(10), "<br>")}{"<small>✓✓</small>" if k == "out" else ""}</div>'
    for i, (k, t) in enumerate(CHAT)
)
page("whatsapp", "Iris on WhatsApp: Coming Soon", "Your job search is coming to WhatsApp. Get matches by message and apply with a reply. Iris on WhatsApp is coming soon.", """
html { background: #f6e9dc; }
body { background: radial-gradient(70% 60% at 8% 0%, #fbe2c4 0%, transparent 70%), radial-gradient(60% 70% at 100% 10%, #e6dcf6 0%, transparent 70%), radial-gradient(70% 60% at 85% 100%, #c9d4f2 0%, transparent 70%), #f6ecdf; }
.wa { display: grid; gap: 44px; align-items: center; padding-top: 48px; padding-bottom: 80px; }
.tag { display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 14px; border-radius: 99px; background: rgba(255,255,255,.72); box-shadow: inset 0 0 0 1px rgba(35,32,27,.08); font-size: .88rem; color: var(--ink-2); }
.tag i { width: 8px; height: 8px; border-radius: 50%; background: #25d366; box-shadow: 0 0 0 0 rgba(37,211,102,.6); animation: ping 1.8s ease-out infinite; }
@keyframes ping { to { box-shadow: 0 0 0 11px rgba(37,211,102,0); } }
.wa h1 { margin-top: 22px; }
.wa p.lede { margin-top: 20px; max-width: 30em; font-size: clamp(1.05rem, 2vw, 1.25rem); color: var(--ink-2); }
.soon { display: inline-flex; align-items: center; gap: 14px; margin-top: 32px; padding: 10px 28px 10px 10px; border-radius: 999px; color: #fff; background: linear-gradient(180deg, #2b2823, #15130f); box-shadow: 0 18px 40px rgba(35,32,27,.3), inset 0 1px 0 rgba(255,255,255,.14); font-size: 1.15rem; font-weight: 500; }
.soon span { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 15px; background: linear-gradient(180deg, #5fe08a, #25c15f); }
.alt { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 20px; }
.how { display: grid; gap: 12px; margin-top: 34px; padding: 0; list-style: none; max-width: 30em; color: var(--ink-2); font-size: .98rem; }
.how li { display: flex; gap: 12px; }
.how b { flex-shrink: 0; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; background: rgba(255,255,255,.8); font-family: var(--serif); font-weight: 500; color: var(--ink); }
.phone { position: relative; width: min(100%, 370px); justify-self: center; padding: 11px; border-radius: 56px; background: linear-gradient(145deg, #3a3a3c, #0d0d0e); box-shadow: 0 60px 100px -30px rgba(50,40,70,.6), 0 0 0 1px rgba(255,255,255,.2) inset; }
.screen { position: relative; overflow: hidden; border-radius: 46px; background: #efe7dc; height: 740px; display: flex; flex-direction: column; }
.status { display: flex; justify-content: space-between; align-items: center; padding: 16px 30px 6px; background: #f6f6f6; font-size: .84rem; font-weight: 600; }
.island { position: absolute; left: 50%; top: 11px; width: 104px; height: 30px; margin-left: -52px; border-radius: 20px; background: #000; }
.head { display: flex; align-items: center; gap: 10px; padding: 8px 14px 10px; background: #f6f6f6; border-bottom: 1px solid #e3e3e3; }
.head img { width: 38px; height: 38px; border-radius: 50%; background: #fff; }
.head b { display: block; font-size: .96rem; line-height: 1.2; }
.head small { color: #667781; font-size: .74rem; }
.chat { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; padding: 12px; overflow: hidden; background-color: #efe7dc; background-image: radial-gradient(rgba(120,100,70,.08) 1px, transparent 1px); background-size: 15px 15px; }
.wa-day { align-self: center; margin-bottom: 4px; padding: 3px 10px; border-radius: 8px; background: #fff; font-size: .68rem; color: #667781; }
.wa-b { position: relative; max-width: 84%; padding: 7px 10px; border-radius: 12px; font-size: .86rem; line-height: 1.33; box-shadow: 0 1px 1px rgba(0,0,0,.09); opacity: 0; transform: translateY(10px) scale(.97); animation: pop .4s cubic-bezier(.2,.8,.2,1.1) forwards; }
.wa-b.in { align-self: flex-start; background: #fff; border-top-left-radius: 3px; }
.wa-b.out { align-self: flex-end; background: #d9fdd3; border-top-right-radius: 3px; }
.wa-b small { margin-left: 8px; font-size: .62rem; color: #53bdeb; }
@keyframes pop { to { opacity: 1; transform: none; } }
.bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px 22px; background: #f6f6f6; }
.bar div { flex: 1; height: 36px; padding: 0 14px; border-radius: 18px; background: #fff; line-height: 36px; font-size: .84rem; color: #8696a0; box-shadow: inset 0 0 0 1px #e9e9e9; }
.bar i { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; background: #25d366; }
.note { margin-top: 12px; text-align: center; font-size: .8rem; color: var(--muted); }
@media (min-width: 900px) { .wa { grid-template-columns: minmax(0, 1.1fr) 400px; padding-top: 72px; } }
@media (prefers-reduced-motion: reduce) { .wa-b { animation: none; opacity: 1; transform: none; } .tag i { animation: none; } }
""", f"""<main class="wrap wa">
  <div>
    <div class="tag">{WA_GREEN}<i></i>Coming to WhatsApp soon</div>
    <h1 class="big">Your job search, <em>by text.</em></h1>
    <p class="lede">Iris is coming to WhatsApp. Get your best matches in a chat, reply to apply, and hear back the moment a recruiter does. No new app to open.</p>
    <div class="soon" role="status"><span>{WA_ICON}</span>Iris on WhatsApp is almost here</div>
    <ul class="how">
      <li><b>1</b>Message Iris and link your account.</li>
      <li><b>2</b>Get matched roles right in the chat.</li>
      <li><b>3</b>Reply to apply. Iris fills in the forms.</li>
    </ul>
    <div class="alt"><a class="pill" href="https://irisjobs.live/app/sign-up">Continue on web</a><a class="pill light" href="{APP_STORE}" target="_blank" rel="noopener">App Store</a><a class="pill light" href="{PLAY_STORE}" target="_blank" rel="noopener">Google Play</a></div>
  </div>
  <div>
    <div class="phone" aria-label="Example WhatsApp conversation with Iris">
      <div class="screen">
        <div class="island"></div>
        <div class="status"><span>9:41</span><span>●●●</span></div>
        <div class="head"><img src="/logo.webp" alt="Iris" width="38" height="38"><div><b>Iris</b><small>online</small></div></div>
        <div class="chat">{chat_html}</div>
        <div class="bar"><div>Message</div><i>{WA_ICON.replace('width="30" height="30"', 'width="20" height="20"')}</i></div>
      </div>
    </div>
    <p class="note">An example of how it will work</p>
  </div>
</main>""")

# Real, public Google Play reviews, quoted word for word. Add new ones here, and only real ones.
REVIEWS = [
    {"name": "Dawar D.", "source": "Google Play", "date": "1 Aug 2026", "stars": 5, "text": "Superb concept and experience, would love if the UX becomes more sleek and effortlessly,plus more ctext to the AI about my profile", "url": PLAY_STORE},
    {"name": "Awais A.", "source": "Google Play", "date": "25 Jul 2026", "stars": 5, "text": "best ui and best app I've ever used", "url": PLAY_STORE},
]
# Screenshots of real posts, with the author's permission: add {"image": "/media/love/file.webp", "alt": "...", "url": "link to the post"}.
SCREENSHOTS = [
    {"image": f"/media/love/{f.name}", "alt": "A post about Iris from a user", "url": f"/media/love/{f.name}"}
    for f in sorted((PUB / "media/love").glob("*")) if f.suffix.lower() in (".webp", ".jpg", ".jpeg", ".png")
]


def review_card(r, i):
    initial = r["name"][0]
    return f"""<a class="post tilt{i % 3}" href="{e(r['url'])}" target="_blank" rel="noopener">
      <header><span class="av a{i % 4}">{initial}</span><div><b>{e(r['name'])}</b><small>{e(r['source'])} · {e(r['date'])}</small></div><img src="/favicon-48.png" alt="Iris" width="20" height="20"></header>
      <div class="stars" aria-label="{r['stars']} out of 5 stars">{'★' * r['stars']}</div>
      <p>{e(r['text'])}</p>
    </a>"""


shots = "".join(f'<a class="post shot" href="{e(s["url"])}" target="_blank" rel="noopener"><img src="{e(s["image"])}" alt="{e(s["alt"])}" loading="lazy"></a>' for s in SCREENSHOTS)
tweet = "https://x.com/intent/tweet?text=" + "I%27m%20using%20%40irisjobs_live%20to%20apply%20to%20jobs.%20Swipe%20right%2C%20AI%20applies.%20https%3A%2F%2Firisjobs.live"
page("love", "Wall of Love: What Job Seekers Say About Iris", "Real reviews and posts from people using Iris, the Tinder for jobs. See what job seekers say, and share your own story.", """
.lv-h { padding-top: 72px; text-align: center; }
.lv-h h1 { margin-top: 12px; }
.lv-h p { margin: 18px auto 0; max-width: 34em; font-size: 1.12rem; color: var(--ink-2); }
.wall { columns: 3 300px; column-gap: 20px; margin-top: 52px; }
.post { display: block; break-inside: avoid; margin-bottom: 20px; padding: 22px; border-radius: 22px; text-decoration: none; background: var(--surface); box-shadow: inset 0 0 0 1px var(--line), var(--shadow); transition: transform .25s ease, box-shadow .25s ease; }
a.post:hover { transform: translateY(-3px) rotate(0deg); box-shadow: inset 0 0 0 1px var(--line-2), var(--shadow-lg); }
.tilt0 { transform: rotate(-.5deg); } .tilt1 { transform: rotate(.5deg); } .tilt2 { transform: rotate(-.2deg); }
.post header { display: flex; align-items: center; gap: 12px; }
.post header div { flex: 1; min-width: 0; }
.post header b { display: block; font-weight: 600; line-height: 1.25; }
.post small { color: var(--muted); font-size: .8rem; }
.av { width: 42px; height: 42px; flex-shrink: 0; display: grid; place-items: center; border-radius: 50%; font-family: var(--serif); font-size: 1.3rem; color: #fff; }
.a0 { background: #5536c4; } .a1 { background: #2f7a55; } .a2 { background: #b4632a; } .a3 { background: #3560b8; }
.stars { margin-top: 14px; color: #e0a526; letter-spacing: 2px; }
.post p { margin-top: 8px; font-size: 1.04rem; line-height: 1.42; }
.post.shot { padding: 0; overflow: hidden; }
.invite { border: 1.5px dashed var(--line-2); background: transparent; box-shadow: none; text-align: center; padding: 32px 22px; }
.invite h3 { font-family: var(--serif); font-weight: 500; font-size: 1.7rem; line-height: 1.12; }
.invite p { color: var(--ink-2); font-size: .96rem; }
.invite .pill { margin-top: 16px; height: 42px; }
.nums { display: grid; gap: 24px; margin-top: 64px; padding: 44px 20px; border-radius: 28px; text-align: center; color: #f7f3ea; background: linear-gradient(180deg, #1f1838, #2a2047); }
.nums b { display: block; font-family: var(--serif); font-weight: 500; font-size: clamp(2.6rem, 6vw, 4rem); line-height: 1; }
.nums span { display: block; margin-top: 8px; color: #bcb2d8; font-size: .92rem; }
@media (min-width: 760px) { .nums { grid-template-columns: repeat(3, 1fr); } }
""", f"""<main class="wrap">
  <header class="lv-h"><div class="overline">Wall of love</div><h1 class="big">Don’t take <em>our</em> word for it.</h1><p>Reviews and posts from real people using Iris. Every one here links back to where it was published.</p></header>
  <section class="wall" aria-label="Reviews">
    {''.join(review_card(r, i) for i, r in enumerate(REVIEWS))}
    {shots}
    <div class="post invite"><h3>Landed an interview with Iris?</h3><p>Post about it and tag us, and we’ll add you to the wall.</p><a class="pill" href="{tweet}" target="_blank" rel="noopener">Share on X</a></div>
    <div class="post invite"><h3>Using Iris on your phone?</h3><p>A short review helps other job seekers find it.</p><a class="pill light" href="{PLAY_STORE}" target="_blank" rel="noopener">Review on Google Play</a></div>
    <div class="post invite"><h3>Got a story to tell?</h3><p>We’d love to hear how your search is going, good or bad.</p><a class="pill light" href="mailto:support@nextquark.com?subject=My%20Iris%20story">Email us</a></div>
  </section>
  <section class="nums" aria-label="Iris in numbers">
    <div><b>140K+</b><span>swipes since March 2026</span></div>
    <div><b>39,000+</b><span>applications sent by AI</span></div>
    <div><b>1,200+</b><span>job seekers swiping</span></div>
  </section>
</main>""")

SOCIAL = [("LinkedIn", "https://www.linkedin.com/in/adityasurana7"), ("X", "https://x.com/theadityasurana"), ("Instagram", "https://www.instagram.com/adityasurana7"), ("GitHub", "https://github.com/theadityasurana")]
page("about", "About Iris and Founder Aditya Surana", "Iris turns job applications into a single swipe. Meet founder Aditya Surana, an IIT BHU graduate, and learn why he built the Tinder for jobs.", """
.ab { display: grid; gap: 44px; align-items: center; padding-top: 64px; }
.ab h1 { margin-top: 12px; }
.ab .lede { margin-top: 20px; font-size: 1.2rem; color: var(--ink-2); max-width: 30em; }
.ph { width: 100%; margin: 0; }
.ph img { width: 100%; height: auto; border-radius: 24px; box-shadow: var(--shadow-lg); }
.ph figcaption { padding: 14px 4px 0; }
.ph b { display: block; font-family: var(--serif); font-size: 1.35rem; font-weight: 500; line-height: 1.2; }
.ph small { color: var(--ink-2); }
.links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 26px; }
.links a { display: inline-flex; align-items: center; height: 40px; padding: 0 16px; border-radius: 99px; font-size: .92rem; font-weight: 500; text-decoration: none; background: var(--surface); box-shadow: inset 0 0 0 1px var(--line-2); }
.links a:hover { background: var(--ink); color: #fffdf9; }
.sec { margin-top: 88px; }
.sec p { margin-top: 14px; max-width: 42em; font-size: 1.08rem; color: var(--ink-2); }
.feats { display: grid; gap: 16px; margin-top: 28px; }
.feats article { padding: 24px; border-radius: 22px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--line); }
.feats h3 { font-family: var(--serif); font-weight: 500; font-size: 1.5rem; line-height: 1.15; }
.feats p { margin-top: 8px; font-size: .98rem; }
.small { margin-top: 40px; font-size: .84rem; color: var(--muted); }
@media (min-width: 860px) { .ab { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); } }
@media (min-width: 760px) { .feats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
""", f"""<main class="wrap">
  <section class="ab">
    <div>
      <div class="overline">About us</div>
      <h1 class="big">The fastest way to land <em>your next role.</em></h1>
      <p class="lede">Iris started from a simple observation: applying to jobs online is unnecessarily tedious. So Aditya Surana built it from scratch, to reimagine the whole experience from discovery to offer.</p>
      <div class="links">{''.join(f'<a href="{u}" target="_blank" rel="noopener me">{n}</a>' for n, u in SOCIAL)}</div>
    </div>
    <figure class="ph"><img src="/media/founder/aditya-full.webp" alt="Aditya Surana, founder of Iris" width="1080" height="1031"><figcaption><b>Aditya Surana</b><small>Founder · B.Tech + M.Tech, IIT BHU, Class of 2025</small></figcaption></figure>
  </section>
  <section class="sec">
    <div class="overline">What we do</div>
    <h2 class="t" style="margin-top:10px">Applying shouldn’t be the hard part.</h2>
    <p>Applying for jobs today is slow, repetitive and unnecessarily frustrating. Candidates spend hours filling out the same forms across different portals, uploading resumes again and again, and navigating outdated systems.</p>
    <p>Iris changes that. You discover opportunities and apply with a single swipe, while intelligent automation handles the heavy lifting behind the scenes.</p>
  </section>
  <section class="sec">
    <div class="overline">What makes us different</div>
    <div class="feats">
      <article><h3>Swipe to apply</h3><p>Swipe right on a job. Iris handles the form, the resume upload and the submission.</p></article>
      <article><h3>Iris, your AI job agent</h3><p>Applies to up to 10 matched roles a night while you sleep.</p></article>
      <article><h3>AI mock interviews</h3><p>Voice-based practice tailored to your actual applications.</p></article>
      <article><h3>Fit reports and ATS scoring</h3><p>Skills match, keyword density and personalised interview prep for each role.</p></article>
    </div>
  </section>
  <section class="sec">
    <div class="overline">Keep reading</div>
    <h2 class="t" style="margin-top:10px">Why this matters to us.</h2>
    <p>No more spray-and-pray. <a href="/mission/">Read our mission</a>, or see <a href="/love/">what people are saying</a>.</p>
    <p class="small"><a href="/credits/">Image credits</a></p>
  </section>
</main>""", ld={"@context": "https://schema.org", "@type": "AboutPage", "url": f"{SITE}/about/", "mainEntity": {"@type": "Person", "name": "Aditya Surana", "jobTitle": "Founder", "worksFor": {"@type": "Organization", "name": "Iris", "url": SITE}, "alumniOf": "IIT BHU", "image": f"{SITE}/media/founder/aditya-full.webp", "sameAs": [u for _, u in SOCIAL]}})

page("mission", "Our Mission: Why We Built Iris", "We believe finding a job should be as seamless as discovering one. A note from Iris founder Aditya Surana on why we built the Tinder for jobs.", """
.ms { max-width: 760px; margin: 0 auto; padding-top: 72px; }
.ms h1 { margin-top: 12px; }
.letter { margin-top: 36px; padding: clamp(24px, 5vw, 48px); border-radius: 28px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--line), var(--shadow); }
.letter p { font-family: var(--serif); font-size: clamp(1.25rem, 2.3vw, 1.5rem); line-height: 1.42; }
.letter p + p { margin-top: 18px; }
.sign { display: flex; align-items: center; gap: 14px; margin-top: 28px; }
.sign img { width: 54px; height: 54px; border-radius: 14px; }
.sign b { display: block; font-weight: 600; }
.sign small { color: var(--muted); }
.pr { margin-top: 80px; }
.pr ol { display: grid; gap: 14px; margin-top: 24px; padding: 0; list-style: none; }
.pr li { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 10px; padding: 24px; border-radius: 22px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--line); }
.pr span { font-family: var(--serif); font-size: 2.1rem; line-height: 1; color: var(--accent); }
.pr h3 { font-family: var(--serif); font-weight: 500; font-size: 1.55rem; line-height: 1.15; }
.pr p { margin-top: 8px; color: var(--ink-2); }
.go { margin-top: 56px; text-align: center; }
""", """<main class="wrap"><div class="ms">
  <div class="overline">A note from the founder</div>
  <h1 class="big">Why we built <em>Iris.</em></h1>
  <div class="letter">
    <p>I built Iris because job hunting shouldn’t feel like a full-time job.</p>
    <p>Applying online is slow, repetitive and frustrating. You fill out the same forms on different portals and upload the same resume again and again, and the part that actually matters gets squeezed out.</p>
    <p>We believe finding a job should be as seamless as discovering one. Our mission is to remove the friction, so you can focus on preparing for interviews, learning new skills and building a meaningful career.</p>
    <p>Swipe right on what excites you, and we handle the rest.</p>
    <div class="sign"><img src="/logo.webp" alt="Iris" width="54" height="54"><div><b>Aditya Surana</b><small>Founder, Iris</small></div></div>
  </div>
  <section class="pr">
    <h2 class="t">Three things guide how we build it.</h2>
    <ol>
      <li><span>01</span><div><h3>Effortless by default</h3><p>A job search is exhausting enough. One swipe should be all it takes, wherever you are: phone or browser.</p></div></li>
      <li><span>02</span><div><h3>You stay in control</h3><p>You pick the roles, set the match score and block the companies you don’t want. Every application is logged, so you can always see what was sent.</p></div></li>
      <li><span>03</span><div><h3>Quality over volume</h3><p>No more spray-and-pray. One tailored application beats a hundred generic ones, so Iris focuses on roles that really fit you.</p></div></li>
    </ol>
  </section>
  <div class="go"><a class="pill" href="https://irisjobs.live/app/sign-up">Apply to your first job</a></div>
</div></main>""")
print("pages written")
