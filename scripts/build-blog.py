#!/usr/bin/env python3
"""
Builds the blog from Markdown files.

    content/blog/<slug>.md   →   public/blog/<slug>/index.html
                                 public/blog/index.html  (all posts, newest first)

Each post starts with front matter:

    ---
    title: Headline shown on the page (H1)
    seo_title: Title for search results (≈50–60 characters; defaults to title)
    description: Meta description for search results (≈140–160 characters)
    keywords: comma, separated, search, phrases
    date: 2026-11-02            (published)
    updated: 2026-11-02         (last meaningful edit; defaults to date)
    author: Team Iris
    excerpt: One or two sentences for the blog page cards.
    cover: /media/blog/<slug>.jpg   (1200×750 works well)
    cover_alt: What the cover image shows
    tldr: Two or three sentences that directly answer the post's question.
    ---

The body supports ## / ### headings, paragraphs, - and 1. lists, > quotes,
**bold**, *italic* and [links](url). A "## Frequently asked questions" section
with "### Question" headings becomes FAQ structured data automatically.

Search / AI-engine optimisation built in: canonical URLs, Open Graph and
Twitter cards, JSON-LD (BlogPosting, BreadcrumbList, FAQPage, Blog), an
"In short" answer box from `tldr`, and sitemap.xml, robots.txt and llms.txt.

    python3 scripts/build-blog.py      # then deploy: npm run deploy
"""
import datetime as dt
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "content" / "blog"
OUT = ROOT / "public" / "blog"
SITE = "https://irisjobs.live"
ASSETS = SITE   # absolute host for link-preview images

import sys as _sys
_sys.path.insert(0, str(Path(__file__).parent))
from site_parts import ASK_SECTION as SHARED_ASK, BODY_SCRIPTS, FOOTER as SHARED_FOOTER, HEAD_ASSETS, OG_IMAGE

APP_STORE = "https://apps.apple.com/in/app/nextquark/id6761863089"
PLAY_STORE = "https://play.google.com/store/apps/details?id=app.rork.hireswipe_v3_clone_ceuofke"


# ── Markdown (the small subset the posts use) ────────────────────────────────

def inline(text):
    t = html.escape(text, quote=False)
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", lambda m: f'<a href="{html.escape(m.group(2))}">{m.group(1)}</a>', t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)
    return t


def markdown(md):
    out, para, items, kind = [], [], [], None

    def flush():
        nonlocal para, items, kind
        if para:
            out.append(f"<p>{inline(' '.join(para))}</p>")
            para = []
        if items:
            out.append(f"<{kind}>" + "".join(f"<li>{inline(i)}</li>" for i in items) + f"</{kind}>")
            items, kind = [], None

    table = []

    def flush_table():
        nonlocal table
        if not table:
            return
        rows = [[c.strip() for c in t.strip().strip("|").split("|")] for t in table if not re.match(r"^\|?\s*:?-{2,}", t.strip())]
        head, body = rows[0], rows[1:]
        out.append('<div class="table-wrap"><table><thead><tr>' + "".join(f"<th>{inline(c)}</th>" for c in head)
                   + "</tr></thead><tbody>" + "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body)
                   + "</tbody></table></div>")
        table = []

    for line in md.splitlines():
        s = line.strip()
        if s.startswith("|"):
            flush(); table.append(s); continue
        flush_table()
        if not s:
            flush(); continue
        if m := re.match(r"^(#{2,3})\s+(.*)", s):
            flush(); n = len(m.group(1)); out.append(f"<h{n}>{inline(m.group(2))}</h{n}>"); continue
        if m := re.match(r"^[-*]\s+(.*)", s):
            if para or kind == "ol": flush()
            kind = "ul"; items.append(m.group(1)); continue
        if m := re.match(r"^\d+\.\s+(.*)", s):
            if para or kind == "ul": flush()
            kind = "ol"; items.append(m.group(1)); continue
        if s.startswith(">"):
            flush(); out.append(f"<blockquote><p>{inline(s.lstrip('> ').strip())}</p></blockquote>"); continue
        if items: flush()
        para.append(s)
    flush(); flush_table()
    return "\n".join(out)


def extract_faq(md):
    """Question/answer pairs from a '## Frequently asked questions' section."""
    m = re.search(r"^##\s+Frequently asked questions\s*$(.*?)(?=^##\s|\Z)", md, re.M | re.S | re.I)
    if not m:
        return []
    pairs = []
    for q, a in re.findall(r"^###\s+(.+?)\s*$\n(.*?)(?=^###\s|\Z)", m.group(1), re.M | re.S):
        answer = " ".join(l.strip() for l in a.strip().splitlines() if l.strip())
        answer = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", answer).replace("**", "").replace("*", "")
        if answer:
            pairs.append((q.strip(), answer))
    return pairs


def read_post(path):
    raw = path.read_text()
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    if not m:
        raise SystemExit(f"{path.name}: missing front matter")
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    for key in ("title", "date", "excerpt"):
        if not meta.get(key):
            raise SystemExit(f"{path.name}: front matter needs '{key}'")
    meta["slug"] = path.stem
    meta["author"] = meta.get("author") or "Team Iris"
    meta["seo_title"] = meta.get("seo_title") or meta["title"]
    meta["description"] = meta.get("description") or meta["excerpt"]
    meta["date_obj"] = dt.date.fromisoformat(meta["date"])
    meta["updated"] = meta.get("updated") or meta["date"]
    meta["date_human"] = meta["date_obj"].strftime("%B %-d, %Y")
    meta["faq"] = extract_faq(m.group(2))
    meta["body"] = markdown(m.group(2))
    words = len(re.sub(r"<[^>]+>", " ", meta["body"]).split())
    meta["read"] = f"{max(1, round(words / 220))} min read"
    return meta


# ── Page shell (same nav, type and footer as the landing page) ───────────────

CSS = """
:root { --ink:#23201b; --ink-2:#4e4a41; --muted:#797366; --line:#e8e2d7; }
* { margin:0; padding:0; box-sizing:border-box; -webkit-font-smoothing:antialiased; }
html, body { background:#f8f5ef; }
body { font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:var(--ink); }
a { color:inherit; text-decoration:none; }
.nav { max-width:1160px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; padding:18px 20px; }
.nav-brand { display:flex; align-items:center; gap:11px; font-weight:800; font-size:1.45rem; letter-spacing:-0.03em; }
.nav-brand img { width:40px; height:40px; border-radius:11px; }
.nav-right { display:flex; align-items:center; gap:22px; }
.nav-link { display:none; font-size:0.95rem; font-weight:500; color:var(--ink-2); }
.nav-link:hover, .nav-link.on { color:var(--ink); }
.pill { display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 16px; border-radius:999px; background:var(--ink); color:#fff; font-weight:600; font-size:0.9rem; white-space:nowrap; }
.pill svg { width:16px; height:16px; }
.pill:hover { opacity:0.86; }

.blog-head { max-width:1160px; margin:0 auto; padding:56px 20px 8px; }
.blog-head h1 { font-size:clamp(2.6rem,11vw,4.4rem); font-weight:800; letter-spacing:-0.05em; line-height:0.95; }
.blog-head p { margin-top:14px; font-size:1.05rem; color:var(--muted); max-width:46ch; line-height:1.5; }
.grid { max-width:1160px; margin:0 auto; padding:36px 20px 72px; display:grid; grid-template-columns:1fr; gap:40px 28px; }
.card { display:flex; flex-direction:column; }
.card-img { display:block; aspect-ratio:16/10; border-radius:20px; overflow:hidden; box-shadow:inset 0 0 0 1px var(--line); background:#fafafa; }
.card-img img { width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.5s ease; }
.card:hover .card-img img { transform:scale(1.03); }
.meta { margin-top:16px; font-size:0.8rem; color:var(--muted); display:flex; gap:8px; }
.card h2 { margin-top:6px; font-size:1.3rem; font-weight:700; letter-spacing:-0.025em; line-height:1.2; }
.card p { margin-top:8px; font-size:0.95rem; color:var(--ink-2); line-height:1.5; }

.post { max-width:720px; margin:0 auto; padding:40px 20px 24px; }
.back { font-size:0.88rem; color:var(--muted); }
.back:hover { color:var(--ink); }
.post h1 { margin-top:20px; font-size:clamp(2rem,8vw,3rem); font-weight:800; letter-spacing:-0.04em; line-height:1.05; }
.post .meta { margin-top:16px; }
.post-cover { margin:28px auto 0; max-width:1000px; padding:0 20px; }
.text-card { padding-top:22px; }
.cat { font-weight:600; color:var(--ink); }
.cat-head { max-width:1120px; margin:44px auto 4px; padding:0 20px; font-size:22px; letter-spacing:-0.02em; }
.table-wrap { overflow-x:auto; margin:22px 0; }
.table-wrap table { width:100%; border-collapse:collapse; font-size:15px; }
.table-wrap th, .table-wrap td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
.table-wrap th { font-weight:600; }
.post-shot { margin:28px 0; }
.post-shot img { width:100%; height:auto; border-radius:14px; box-shadow:inset 0 0 0 1px var(--line), 0 18px 44px rgba(58,48,30,.14); }
.post-shot figcaption { margin-top:10px; font-size:.86rem; color:var(--muted); text-align:center; }
.post-cover img { width:100%; height:auto; aspect-ratio:auto; object-fit:contain; border-radius:22px; box-shadow:inset 0 0 0 1px var(--line); display:block; }
.prose { max-width:720px; margin:0 auto; padding:36px 20px 24px; font-size:1.08rem; line-height:1.7; color:#27272a; }
.prose > * + * { margin-top:1.1em; }
.prose h2 { margin-top:1.9em; font-size:1.5rem; font-weight:800; letter-spacing:-0.03em; line-height:1.2; color:var(--ink); }
.prose h3 { margin-top:1.6em; font-size:1.2rem; font-weight:700; color:var(--ink); }
.prose ul, .prose ol { padding-left:1.3em; }
.prose li + li { margin-top:0.45em; }
.prose a { color:var(--ink); text-decoration:underline; text-underline-offset:3px; }
.prose strong { color:var(--ink); }
.tldr { max-width:720px; margin:32px auto 0; padding:0 20px; }
.tldr div { border-radius:18px; padding:18px 20px; background:#fafafa; box-shadow:inset 0 0 0 1px var(--line); font-size:1rem; line-height:1.6; color:#27272a; }
.tldr b { display:block; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
.prose blockquote { border-left:3px solid var(--ink); padding-left:16px; color:var(--ink-2); }
.cta-box { max-width:720px; margin:32px auto 72px; padding:0 20px; }
.cta-inner { border-radius:22px; padding:26px; box-shadow:inset 0 0 0 1px var(--line); display:flex; flex-direction:column; gap:14px; align-items:flex-start; }
.cta-inner b { font-size:1.25rem; letter-spacing:-0.02em; }
.cta-inner span { color:var(--muted); font-size:0.95rem; }
.more { max-width:1160px; margin:0 auto; padding:0 20px 24px; }
.more h3 { font-size:1.1rem; font-weight:800; letter-spacing:-0.02em; border-top:1px solid var(--line); padding-top:32px; }
.more .grid { padding:24px 0 64px; }

.footer { border-top:1px solid var(--line); margin:0 8px; }
.footer-top { padding:44px 20px 32px; display:flex; flex-direction:column; align-items:center; text-align:center; }
.footer-brand { display:flex; align-items:center; gap:12px; font-size:1.9rem; font-weight:800; letter-spacing:-0.04em; }
.footer-brand img { width:48px; height:48px; border-radius:13px; }
.footer-tag { margin-top:6px; color:var(--muted); }
.footer-bar { border-top:1px solid var(--line); padding:16px 12px calc(16px + env(safe-area-inset-bottom)); display:flex; align-items:center; justify-content:space-between; gap:10px; }
.legal { display:flex; align-items:center; gap:12px; white-space:nowrap; font-size:0.78rem; color:var(--muted); }
.legal a { color:var(--ink-2); }
.legal a:hover { color:var(--ink); text-decoration:underline; text-underline-offset:3px; }
.legal .long { display:none; }
.socials { display:flex; gap:6px; flex-shrink:0; }
.socials a { width:34px; height:34px; border-radius:999px; display:flex; align-items:center; justify-content:center; box-shadow:inset 0 0 0 1px var(--line); transition:background 0.2s, color 0.2s; }
.socials a:hover { background:var(--ink); color:#fff; }
.socials svg { width:16px; height:16px; }

@media (min-width:720px) { .grid { grid-template-columns:repeat(2,1fr); } }
@media (min-width:900px) {
  .nav { padding:22px 32px; }
  .nav-link { display:inline; }
  .blog-head { padding:72px 32px 8px; }
  .grid { grid-template-columns:repeat(3,1fr); padding:44px 32px 96px; }
  .more { padding:0 32px 24px; }
  .footer-bar { padding:18px 24px; }
  .legal { font-size:0.86rem; gap:20px; }
  .legal .long { display:inline; }
  .socials a { width:38px; height:38px; }
}
"""

CSS += """
h1, h2, h3, .blog-head h1 { font-family:'EB Garamond',Georgia,serif; font-weight:500; letter-spacing:-0.012em; }
.nav-brand { font-family:'EB Garamond',Georgia,serif; font-weight:500; letter-spacing:-0.01em; }
.nav-brand img, .footer-brand img { border-radius:0; object-fit:contain; }
.blog-head h1 { line-height:1.04; }
.pill { background:var(--ink); color:#fffdf9; }
.crumbs { display:flex; flex-wrap:wrap; gap:6px; font-size:0.84rem; color:var(--muted); margin-bottom:18px; }
.crumbs a:hover { color:var(--ink); text-decoration:underline; }
.cat-nav { max-width:1160px; margin:18px auto 0; padding:0 20px; display:flex; flex-wrap:wrap; gap:8px; }
.cat-nav a { padding:7px 14px; border-radius:999px; box-shadow:inset 0 0 0 1px #d8d1c4; font-size:0.88rem; color:var(--ink-2); background:#fffdf9; }
.cat-nav a:hover { color:var(--ink); box-shadow:inset 0 0 0 1px var(--muted); }
.cat-head { scroll-margin-top:16px; }
.author-box { max-width:720px; margin:32px auto 0; padding:22px 24px; border-radius:20px; background:#fffdf9; box-shadow:inset 0 0 0 1px var(--line); display:flex; gap:16px; align-items:flex-start; }
.author-box img { flex-shrink:0; }
.author-box b { display:block; font-size:1rem; }
.author-box p { margin-top:4px; font-size:0.92rem; color:var(--ink-2); line-height:1.5; }
.author-box a { text-decoration:underline; text-underline-offset:2px; }
.simple-page { max-width:720px; margin:0 auto; padding:48px 20px 72px; }
.simple-page h1 { font-size:clamp(2.2rem,6vw,3.2rem); line-height:1.08; }
.simple-page p, .simple-page li { margin-top:14px; line-height:1.65; color:var(--ink-2); }
.simple-page ul { margin-top:12px; padding-left:20px; }
.simple-page a { text-decoration:underline; text-underline-offset:2px; }
"""

ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

NAV = f"""<nav class="nav">
  <a class="nav-brand" href="/"><img src="/logo.webp" alt="Iris logo" width="40" height="40"><span>Iris</span></a>
  <div class="nav-right"><a class="nav-link" href="/app/sign-in">Sign in</a><a class="nav-link on" href="/blog/">Blog</a><a class="pill store-link" href="{APP_STORE}">Download {ARROW}</a></div>
</nav>"""

FOOTER = SHARED_ASK + SHARED_FOOTER

# Download buttons go straight to the right store on phones.
SCRIPT = f"""<script>
  (function () {{
    var ua = navigator.userAgent || '';
    var url = /Android/i.test(ua) ? '{PLAY_STORE}' : '{APP_STORE}';
    document.querySelectorAll('.store-link').forEach(function (a) {{ a.href = url; }});
    document.querySelectorAll('.year').forEach(function (y) {{ y.textContent = new Date().getFullYear(); }});
  }})();
</script>"""


def seo_title(t):
    """Add the brand unless it's already there or the title would pass ~60 characters."""
    return t if "Iris" in t or len(t) + 7 > 60 else f"{t} | Iris"


def jsonld(*objs):
    return "".join(f'\n  <script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>' for o in objs if o)


ORG = {"@type": "Organization", "name": "Iris", "url": SITE, "logo": f"{ASSETS}/logo.png",
       "sameAs": ["https://www.instagram.com/irisjobs.live/", "https://x.com/irisjobs_live", "https://www.linkedin.com/company/tryiris/about/"]}


def page(title, description, url, image, body, kind="website", extra_head=""):
    e = html.escape
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>{e(title)}</title>
  <meta name="description" content="{e(description)}">
  <link rel="canonical" href="{e(url)}">
  <link rel="icon" type="image/png" href="/favicon-48.png">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <meta property="og:type" content="{kind}">
  <meta property="og:site_name" content="Iris">
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(description)}">
  <meta property="og:url" content="{e(url)}">
  <meta property="og:image" content="{OG_IMAGE}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{e(title)}">
  <meta name="twitter:description" content="{e(description)}">
  <meta name="twitter:image" content="{e(image)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">{extra_head}
  <link rel="alternate" type="application/rss+xml" title="Iris Blog" href="{SITE}/blog/rss.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=EB+Garamond:wght@400;500&display=swap" rel="stylesheet">
  {HEAD_ASSETS}
  <style>{CSS}</style>
</head>
<body>
{NAV}
{body}
{FOOTER}
{SCRIPT}
{BODY_SCRIPTS}
</body>
</html>
"""


COVER_ART = ["about", "authorization", "compliance", "details", "experience", "final", "goal", "preferences", "roles"]
SCREENS = [
    ("home", "The Iris web dashboard, with job matches ranked by fit"),
    ("jobs", "Swiping through a job card next to its full details in Iris"),
    ("applications", "The Iris applications table, showing live status on each application"),
    ("browse", "Browsing open roles on Iris with search and filters"),
]


def _pick(slug, n):
    return sum(ord(c) for c in slug) % n


def add_images(p):
    """Every post gets a cover for its card and page, and one product image in the article."""
    if not p.get("cover"):
        if p.get("category") in ("Comparisons", "Best tools"):
            shot, alt = SCREENS[_pick(p["slug"], len(SCREENS))]
            p["cover"], p["cover_alt"] = f"/media/web/{shot}.webp", alt
        else:
            art = COVER_ART[_pick(p["slug"], len(COVER_ART))]
            p["cover"], p["cover_alt"] = f"/media/onboarding/{art}.webp", "A painted landscape in warm evening light"
    shot, alt = SCREENS[_pick(p["slug"] + "x", len(SCREENS))]
    figure = f'<figure class="post-shot"><img src="/media/web/{shot}.webp" alt="{html.escape(alt)}" width="1600" height="1000" loading="lazy"><figcaption>{html.escape(alt)}.</figcaption></figure>'
    parts = p["body"].split("</h2>", 2)
    if len(parts) == 3:
        head, rest = parts[2].split("</p>", 1) if "</p>" in parts[2] else (parts[2], "")
        p["body"] = parts[0] + "</h2>" + parts[1] + "</h2>" + head + "</p>" + figure + rest
    else:
        p["body"] += figure
    return p


def card(p):
    e = html.escape
    # Text-only card unless the post has its own cover.
    img = (f'<a class="card-img" href="/blog/{p["slug"]}/"><img src="{e(p["cover"])}" alt="{e(p.get("cover_alt") or p["title"])}" loading="lazy" width="1200" height="750"></a>'
           if p.get("cover") else "")
    cat = f'<span class="cat">{e(p["category"])}</span><span>·</span>' if p.get("category") else ""
    return f"""<article class="card{'' if p.get('cover') else ' text-card'}">
    {img}
    <div class="meta">{cat}<span>{p['date_human']}</span><span>·</span><span>{p['read']}</span></div>
    <a href="/blog/{p['slug']}/"><h2>{e(p['title'])}</h2></a>
    <p>{e(p['excerpt'])}</p>
  </article>"""


CATEGORY_ORDER = ["Guides", "Resumes", "Applications", "Interviews", "Career changes", "Students", "Best tools", "Comparisons"]


def cat_id(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def related(p, posts, n=3):
    """Same category first, then newest, so every post links to its neighbours."""
    same = [o for o in posts if o["slug"] != p["slug"] and o.get("category") == p.get("category")]
    # Rotate through the category so inbound links spread across all posts, not just the newest.
    if same:
        i = sorted(o["slug"] for o in posts).index(p["slug"]) % len(same)
        same = same[i:] + same[:i]
    rest = [o for o in posts if o["slug"] != p["slug"] and o not in same]
    return (same + rest)[:n]


AUTHOR_URL = "/blog/authors/iris-team/"
AUTHOR_BIO = "The people who build Iris, the swipe-to-apply job app. We write about job searching from what we see building application automation."


def sections(posts):
    """Index grouped by category (posts without one go first, under no heading)."""
    groups = {}
    for p in posts:
        groups.setdefault(p.get("category") or "", []).append(p)
    order = [""] + CATEGORY_ORDER + sorted(k for k in groups if k and k not in CATEGORY_ORDER)
    out = []
    for k in order:
        if k not in groups:
            continue
        head = f'<h2 class="cat-head" id="{cat_id(k)}">{html.escape(k)}</h2>' if k else ""
        out.append(f'{head}<section class="grid">{"".join(card(p) for p in groups[k])}</section>')
    return "\n".join(out)


def main():
    posts = sorted((add_images(read_post(f)) for f in SRC.glob("*.md")), key=lambda p: (p["date_obj"], p["title"]), reverse=True)
    if not posts:
        raise SystemExit("no posts in content/blog")
    OUT.mkdir(parents=True, exist_ok=True)

    index_body = f"""<header class="blog-head">
  <h1>The Iris Blog</h1>
  <p>Notes on job hunting, hiring, and what AI is changing about both.</p>
</header>
<nav class="cat-nav" aria-label="Blog topics">{"".join(f'<a href="#{cat_id(c)}">{html.escape(c)}</a>' for c in CATEGORY_ORDER if any(p.get("category") == c for p in posts))}</nav>
{sections(posts)}"""
    blog_ld = {
        "@context": "https://schema.org", "@type": "Blog", "name": "The Iris Blog", "url": f"{SITE}/blog/",
        "description": "Notes on job hunting, hiring, and what AI is changing about both.", "publisher": ORG,
        "blogPost": [{"@type": "BlogPosting", "headline": p["title"], "url": f"{SITE}/blog/{p['slug']}/",
                      "datePublished": p["date"], "dateModified": p["updated"]} for p in posts],
    }
    (OUT / "index.html").write_text(page(
        "Blog: Job Search Tips & AI Job Applications | Iris", "Practical job search advice from the team behind Iris: ATS-friendly resumes, choosing which jobs to apply to, and applying with AI.",
        f"{SITE}/blog/", OG_IMAGE, index_body, extra_head=jsonld(blog_ld)))

    e = html.escape
    for p in posts:
        others = related(p, posts)
        cover = p.get("cover") or "/media/iris-share.jpg"
        body = f"""<article>
  <header class="post">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Iris</a><span>/</span><a href="/blog/">Blog</a>{f'<span>/</span><a href="/blog/#{cat_id(p["category"])}">{e(p["category"])}</a>' if p.get("category") else ''}</nav>
    <h1>{e(p['title'])}</h1>
    <div class="meta"><a href="{AUTHOR_URL}">{e(p['author'])}</a><span>·</span><time datetime="{p['date']}">{p['date_human']}</time><span>·</span><span>{p['read']}</span></div>
  </header>
  {f'<figure class="post-cover"><img src="{e(p["cover"])}" alt="{e(p.get("cover_alt") or p["title"])}" width="1200" height="750"></figure>' if p.get("cover") else ''}
  {f'<section class="tldr" aria-label="Summary"><div><b>In short</b>{e(p["tldr"])}</div></section>' if p.get("tldr") else ''}
  <div class="prose">
{p['body']}
  </div>
</article>
<aside class="author-box"><img src="/logo.webp" alt="Iris logo" width="44" height="44" loading="lazy"><div><b>Written by {e(p['author'])}</b><p>{AUTHOR_BIO} <a href="{AUTHOR_URL}">About the team</a></p></div></aside>
<aside class="cta-box"><div class="cta-inner">
  <b>Apply to your next job with one swipe.</b>
  <span>Iris is free to try on iPhone and Android.</span>
  <a class="pill store-link" href="{APP_STORE}">Get Iris {ARROW}</a>
</div></aside>
{('<section class="more"><h3>More from the blog</h3><div class="grid">' + ''.join(card(o) for o in others) + '</div></section>') if others else ''}"""
        url = f"{SITE}/blog/{p['slug']}/"
        image = f"{ASSETS}{cover}" if cover.startswith("/") else cover
        article = {
            "@context": "https://schema.org", "@type": "BlogPosting",
            "headline": p["title"], "description": p["description"], "image": [image],
            "datePublished": p["date"], "dateModified": p["updated"],
            "author": {"@type": "Organization", "name": p["author"], "url": SITE + AUTHOR_URL},
            "publisher": ORG, "mainEntityOfPage": {"@type": "WebPage", "@id": url},
            "keywords": p.get("keywords", ""), "inLanguage": "en",
            "about": {"@type": "MobileApplication", "name": "Iris", "operatingSystem": "iOS, Android",
                      "applicationCategory": "BusinessApplication"},
        }
        crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Iris", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": p["title"], "item": url}]}
        faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faq"]]} if p["faq"] else None
        head = (f'\n  <meta name="keywords" content="{e(p.get("keywords", ""))}">'
                f'\n  <meta property="article:published_time" content="{p["date"]}">'
                f'\n  <meta property="article:modified_time" content="{p["updated"]}">'
                f'\n  <meta property="article:author" content="{e(p["author"])}">'
                + jsonld(article, crumbs, faq))
        d = OUT / p["slug"]
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(page(
            seo_title(p["seo_title"]), p["description"], url, image, body, kind="article", extra_head=head))

    write_simple_pages()

    # Remove pages for posts that were deleted from content/blog.
    keep = {p["slug"] for p in posts} | {"authors"}
    for d in OUT.iterdir():
        if d.is_dir() and d.name not in keep and (d / "index.html").exists():
            (d / "index.html").unlink()
            d.rmdir()
    write_discovery_files(posts)
    print(f"built {len(posts)} posts → public/blog/ (+ sitemap.xml, robots.txt, llms.txt, rss.xml)")


def write_simple_pages():
    e = html.escape
    team = OUT / "authors" / "iris-team"
    team.mkdir(parents=True, exist_ok=True)
    (team / "index.html").write_text(page(
        "The Iris Team: Who Writes the Iris Blog", "Who writes the Iris blog, how we research job search advice, and how we handle claims about Iris and other tools.",
        f"{SITE}{AUTHOR_URL}", OG_IMAGE,
        f"""<main class="simple-page"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Iris</a><span>/</span><a href="/blog/">Blog</a></nav>
<h1>The Iris team</h1>
<p>{AUTHOR_BIO}</p>
<h2>How we write</h2>
<ul><li>We describe Iris as it works today, including its limits.</li><li>We link to sources for outside facts and avoid statistics we cannot trace.</li><li>Comparisons reflect what each company publishes. Features and prices change, so check their site before deciding.</li><li>We are the makers of Iris, so our comparisons are not neutral. We say so.</li></ul>
<h2>Contact</h2>
<p>Found a mistake? Email <a href="mailto:support@nextquark.com">support@nextquark.com</a> and we will fix it.</p></main>""",
        extra_head=jsonld({"@context": "https://schema.org", "@type": "Organization", "name": "The Iris Team", "url": SITE + AUTHOR_URL, "parentOrganization": ORG})))
    credits = json.loads((ROOT / "docs" / "image-credits.json").read_text())
    items = "".join(
        f'<li><a href="{e(c["page"])}" rel="nofollow noopener">{e(c["title"])}</a> by {e(c["artist"] or "unknown")}, {e(c["license"])}. Cropped, resized and colour-graded with a painterly finish.</li>' for c in credits)
    d = ROOT / "public" / "credits"
    d.mkdir(exist_ok=True)
    (d / "index.html").write_text(page(
        "Image and Video Credits | Iris", "Credits and licences for the photographs and video used on the Iris website.",
        f"{SITE}/credits/", OG_IMAGE,
        f"""<main class="simple-page"><h1>Image and video credits</h1>
<p>Photographs used in the Iris web app come from Wikimedia Commons under the licences below.</p><ul>{items}</ul>
<p>The sky video on the sign-in page is from <a href="https://mixkit.co/free-stock-video/clouds/" rel="nofollow noopener">Mixkit</a> under the Mixkit Stock Video Free License.</p></main>"""))


def write_discovery_files(posts):
    pub = ROOT / "public"
    today = dt.date.today().isoformat()
    urls = [(SITE + "/", today), (SITE + "/blog/", max(p["updated"] for p in posts)), (SITE + AUTHOR_URL, today), (SITE + "/credits/", today), (SITE + "/jobs/", today), (SITE + "/tinder-for-jobs/", today), (SITE + "/love/", today), (SITE + "/about/", today), (SITE + "/mission/", today), (SITE + "/whatsapp/", today)]
    urls += [(f"{SITE}/blog/{p['slug']}/", p["updated"]) for p in posts]
    (pub / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n" for u, d in urls)
        + "</urlset>\n")

    # Search engines and AI answer engines are all welcome. Share links (/job, /invite) stay crawlable
    # so link-preview bots (X, WhatsApp, LinkedIn) can read them; the page itself marks them noindex.
    ai_bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot",
               "Google-Extended", "Applebot-Extended", "Bingbot", "Googlebot"]
    (pub / "robots.txt").write_text(
        "".join(f"User-agent: {b}\nAllow: /\n\n" for b in ai_bots)
        + "User-agent: *\nAllow: /\nDisallow: /api/\n\n"
        + f"Sitemap: {SITE}/sitemap.xml\n")

    # llms.txt: a plain summary for AI engines (https://llmstxt.org).
    lines = [
        "# Iris",
        "",
        "> Iris is an AI job application app for iPhone and Android, often called \"Tinder for jobs\". "
        "Users browse job cards and swipe right to apply; Iris completes and submits the application using "
        "the user's resume and profile. Swipe left passes on a job and swipe up saves it. Iris is free to start, "
        "with free applications every month and paid plans for more applications, resume tailoring and automatic applying.",
        "",
        "## Get the app",
        f"- [App Store]({APP_STORE})",
        f"- [Google Play]({PLAY_STORE})",
        f"- [Website]({SITE}/)",
        "",
        "## Blog",
    ]
    lines += [f"- [{p['title']}]({SITE}/blog/{p['slug']}/): {p['description']}" for p in posts]
    lines += ["", "## Social", "- [Instagram](https://www.instagram.com/irisjobs.live/)", "- [X](https://x.com/irisjobs_live)",
              "- [LinkedIn](https://www.linkedin.com/company/tryiris/)", ""]
    (pub / "llms.txt").write_text("\n".join(lines))

    e = html.escape
    items = "".join(
        f"<item><title>{e(p['title'])}</title><link>{SITE}/blog/{p['slug']}/</link><guid>{SITE}/blog/{p['slug']}/</guid>"
        f"<pubDate>{p['date_obj'].strftime('%a, %d %b %Y 00:00:00 +0000')}</pubDate><description>{e(p['description'])}</description></item>"
        for p in posts)
    (OUT / "rss.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>The Iris Blog</title><link>{SITE}/blog/</link>'
        f"<description>Notes on job hunting, hiring, and what AI is changing about both.</description><language>en</language>{items}</channel></rss>\n")


if __name__ == "__main__":
    main()
