"""Write content/blog/<slug>.md from the post modules in scripts/blog-posts/.
Existing hand-written posts are never overwritten.  python3 scripts/write-blog-posts.py"""
import importlib.util, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "content" / "blog"
DATE = "2026-11-03"
n = 0
for mod_path in sorted((ROOT / "scripts" / "blog-posts").glob("*.py")):
    spec = importlib.util.spec_from_file_location(mod_path.stem, mod_path)
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    for p in mod.POSTS:
        f = OUT / f"{p['slug']}.md"
        if f.exists() and "generated: true" not in f.read_text():
            continue
        front = "\n".join(f"{k}: {p[k]}" for k in ("title", "seo_title", "description", "keywords", "category", "excerpt", "tldr") if p.get(k))
        f.write_text(f"---\n{front}\ndate: {p.get('date', DATE)}\nauthor: Team Iris\ngenerated: true\n---\n\n{p['body'].strip()}\n")
        n += 1
print(f"wrote {n} posts")
