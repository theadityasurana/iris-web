"""Pieces shared by every public page, so the footer and links only live in one place."""
import urllib.parse

APP_STORE = "https://apps.apple.com/in/app/nextquark/id6761863089"
PLAY_STORE = "https://play.google.com/store/apps/details?id=app.rork.hireswipe_v3_clone_ceuofke"
OG_IMAGE = "https://irisjobs.live/media/iris-og.jpg?v=1"
ASK_PROMPT = "What is Iris (irisjobs.live), the AI job application app known as the Tinder for jobs, and is it good for job seekers?"

_q = urllib.parse.quote(ASK_PROMPT)
_ASK = [
    ("ChatGPT", "chatgpt", f"https://chatgpt.com/?q={_q}&amp;hints=search"),
    ("Claude", "claude", f"https://claude.ai/new?q={_q}"),
    ("Perplexity", "perplexity", f"https://www.perplexity.ai/search?q={_q}"),
    ("Gemini", "gemini", f"https://www.google.com/search?udm=50&amp;q={_q}"),
    ("Grok", "grok", f"https://grok.com/?q={_q}"),
]

ASK_SECTION = '<section class="sf-ask" aria-label="Ask an AI about Iris"><h2>Still curious? Ask your favorite AI about Iris.</h2><div class="sf-ask-chips">' + "".join(
    f'<a href="{u}" target="_blank" rel="noopener nofollow"><img src="/media/llm/{i}.png" alt="{n}" width="22" height="22" loading="lazy">{n}</a>' for n, i, u in _ASK
) + "</div></section>"

FOOTER_LINKS = [
    ("Product", [("How it works", "/#how"), ("Browse jobs", "/jobs/"), ("Pricing", "/#pricing"), ("Wall of love", "/love/"), ("Continue on web", "https://irisjobs.live/app/sign-up"), ("WhatsApp", "/whatsapp/")]),
    ("Company", [("About us", "/about/"), ("Our mission", "/mission/"), ("Blog", "/blog/"), ("Tinder for jobs", "/tinder-for-jobs/")]),
    ("Get the app", [("App Store", APP_STORE), ("Google Play", PLAY_STORE)]),
    ("Social", [("Instagram", "https://www.instagram.com/irisjobs.live/"), ("X", "https://x.com/irisjobs_live"), ("LinkedIn", "https://www.linkedin.com/company/tryiris/about/")]),
]


def _link(label, href):
    ext = href.startswith("http") and "irisjobs.live" not in href
    attrs = ' target="_blank" rel="noopener"' if ext else ""
    return f'<a href="{href}"{attrs}>{label}</a>'


FOOTER = '<footer class="sf"><div class="sf-cols">' + "".join(
    f"<nav aria-label=\"{t}\"><h3>{t}</h3>{''.join(_link(*l) for l in links)}</nav>" for t, links in FOOTER_LINKS
) + """</div>
  <div class="sf-stage" aria-hidden="true">
    <div class="sf-string"></div>
    <div class="sf-charm"><img src="/logo.webp" alt="Iris" width="96" height="96" loading="lazy"></div>
    <div class="sf-word" data-word="Iris"><b>Iris</b></div>
  </div>
  <div class="sf-bar"><span>© <span id="year" class="year">2026</span> Iris</span><nav aria-label="Legal"><a href="https://nextquark.framer.website/terms" target="_blank" rel="noopener">Terms</a><a href="https://nextquark.framer.website/privacy" target="_blank" rel="noopener">Privacy</a></nav></div>
</footer>"""

HEAD_ASSETS = '<link rel="stylesheet" href="/media/site.css?v=1">'
BODY_SCRIPTS = '<script src="/media/lenis.min.js" defer></script><script src="/media/site.js?v=1" defer></script>'
