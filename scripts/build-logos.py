#!/usr/bin/env python3
"""
Builds the "Our users got placed at" logo strip for the landing page.

Downloads every company's logo once, drops ones that are missing (or Google's
generic globe), and packs the rest into ONE sprite image, so the page loads
all logos with a single request from our own domain instead of ~150 requests
to third-party logo services. The list of names is written into index.html.

    python3 scripts/build-logos.py      # then deploy: npm run deploy

Re-run whenever companies are added.
"""
import io
import json
import re
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "public" / "index.html"
SPRITE = ROOT / "public" / "media" / "logos.webp"

TILE = 64          # px per logo in the sprite (shown at 32px → sharp on retina)
COLS = 16
UA = {"User-Agent": "Mozilla/5.0 (iris-landing logo build)"}

page = PAGE.read_text()
SUPABASE_URL = re.search(r"var SUPABASE_URL = '([^']+)'", page).group(1)
SUPABASE_KEY = re.search(r"var SUPABASE_KEY = '([^']+)'", page).group(1)


def get(url, headers=None, timeout=15):
    req = urllib.request.Request(url, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def domain_of(website, name):
    d = re.sub(r"^https?://", "", (website or "").strip(), flags=re.I)
    d = re.sub(r"^www\.", "", d, flags=re.I).split("/")[0].split("?")[0].lower()
    return d or re.sub(r"[^a-z0-9]", "", (name or "").lower()) + ".com"


def load_logo(company):
    sources = [f"https://www.google.com/s2/favicons?domain={urllib.parse.quote(domain_of(company.get('website'), company['name']))}&sz=128"]
    if (company.get("logo_url") or "").startswith("http"):
        sources.append(company["logo_url"])
    for src in sources:
        try:
            img = Image.open(io.BytesIO(get(src))).convert("RGBA")
        except Exception:
            continue
        # Google answers unknown domains with a 16px globe: treat small images as missing.
        if min(img.size) < 32:
            continue
        img.thumbnail((TILE, TILE), Image.LANCZOS)
        tile = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
        tile.paste(img, ((TILE - img.width) // 2, (TILE - img.height) // 2), img)
        return tile
    return None


def main():
    rows = json.loads(get(
        f"{SUPABASE_URL}/rest/v1/companies?select=name,website,logo_url&order=name.asc&limit=1000",
        {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
    ))
    rows = [r for r in rows if r.get("name")]
    with ThreadPoolExecutor(max_workers=16) as pool:
        tiles = list(pool.map(load_logo, rows))
    kept = [(r["name"], t) for r, t in zip(rows, tiles) if t is not None]
    if len(kept) < 6:
        sys.exit(f"only {len(kept)} logos loaded; not updating")

    count = len(kept)
    sheet = Image.new("RGBA", (COLS * TILE, -(-count // COLS) * TILE), (0, 0, 0, 0))
    for i, (_, tile) in enumerate(kept):
        sheet.paste(tile, ((i % COLS) * TILE, (i // COLS) * TILE))
    SPRITE.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(SPRITE, "WEBP", quality=82, method=6)

    names = json.dumps([n for n, _ in kept], ensure_ascii=False)
    meta = json.dumps({"cols": COLS, "tile": TILE, "v": SPRITE.stat().st_mtime_ns // 1_000_000})
    new_page, n = re.subn(
        r"/\*LOGOS\*/.*?/\*END\*/",
        lambda _: f"/*LOGOS*/{{ names: {names}, sprite: {meta} }}/*END*/",
        page, flags=re.S,
    )
    if n != 1:
        sys.exit("marker /*LOGOS*/.../*END*/ not found in index.html")
    PAGE.write_text(new_page)
    print(f"{count}/{len(rows)} logos → {SPRITE.relative_to(ROOT)} ({SPRITE.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
