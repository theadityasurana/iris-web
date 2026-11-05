#!/usr/bin/env python3
"""
Original artwork for Iris. Paints with brush strokes, so everything has the same hand.

  paint-art.py scene <hero|dusk> <out.webp>       a landscape built from noise
  paint-art.py photo <in> <out.webp>              repaints a photo in the same style
"""
import math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter, map_coordinates, zoom


def fbm(h, w, rng, scale=6, octaves=6, persist=0.5):
    out = np.zeros((h, w), np.float32); amp = 1.0; total = 0.0
    for o in range(octaves):
        gw, gh = int(scale * 2 ** o * w / max(w, h)) + 3, int(scale * 2 ** o * h / max(w, h)) + 3
        grid = rng.random((gh, gw), dtype=np.float32)
        out += amp * zoom(grid, (h / gh, w / gw), order=3)[:h, :w]
        total += amp; amp *= persist
    out /= total
    return (out - out.min()) / (out.max() - out.min())


def hex3(c):
    return np.array([int(c[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255


def mix(a, b, t):
    t = np.clip(t, 0, 1)[..., None]
    return a * (1 - t) + b * t


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


PALETTES = {
    'hero': dict(top='#a9c3cc', mid='#e9dcc4', low='#fdd9a0', shade='#a6a2c6', lit='#fff1cf', glow='#ffc98a', sun=(0.52, 0.62),
                 hills=['#b9c2b0', '#9cae86', '#7f9a62', '#6b8a48'], gold='#e6c368', field='#c9b163'),
    'dusk': dict(top='#8d9ec6', mid='#e6c3bf', low='#fbb98a', shade='#8680b4', lit='#ffdcc0', glow='#ff9e6e', sun=(0.4, 0.6),
                 hills=['#a79fb4', '#8a8a93', '#6c7a68', '#56693f'], gold='#e9a95c', field='#a98d55'),
}


def scene(name, w=2400, h=1350, seed=11):
    P = PALETTES[name]
    rng = np.random.default_rng(seed + (name == 'dusk') * 40)
    Y, X = np.mgrid[0:h, 0:w].astype(np.float32)
    y, x = Y / h, X / w
    horizon = 0.62
    # Sky
    sky = mix(np.ones((h, w, 3)) * hex3(P['top']), np.ones((h, w, 3)) * hex3(P['mid']), smooth(0.0, horizon * 0.72, y))
    sky = mix(sky, np.ones((h, w, 3)) * hex3(P['low']), smooth(horizon * 0.55, horizon, y))
    sx, sy = P['sun']
    d = np.sqrt(((x - sx) * 1.5) ** 2 + (y - sy) ** 2)
    sky = mix(sky, np.ones((h, w, 3)) * hex3(P['glow']), 0.75 * np.exp(-(d / 0.3) ** 2))
    sky = mix(sky, np.ones((h, w, 3)) * hex3(P['lit']), 0.9 * np.exp(-(d / 0.1) ** 2))
    # Clouds: banks of overlapping puffs, each lit from the sun. Heavier at the sides so the middle stays calm for type.
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer, 'RGBA')
    shade, lit, glow = hex3(P['shade']) * 255, hex3(P['lit']) * 255, hex3(P['glow']) * 255
    banks = [(.05, .30, .24, .26), (.95, .28, .22, .30), (.22, .50, .17, .07), (.80, .52, .17, .07), (.30, .09, .10, .05), (.70, .07, .12, .05)]
    for cx, cy, sw, sh in banks:
        n = int(70 * sw / .2)
        puffs = sorted(((cx + rng.normal(0, sw * .42), cy + rng.normal(0, sh * .42)) for _ in range(n)), key=lambda p: p[1])
        for px, py in puffs:
            spread = max(0.0, 1 - ((px - cx) / sw) ** 2 - ((py - cy) / sh) ** 2)
            R = (22 + 96 * spread * (0.55 + rng.random() * .7)) * w / 2400 * 1.5
            X0, Y0 = px * w, py * h
            lx, ly = sx - px, (sy - py) * h / w
            ln = math.hypot(lx, ly) + 1e-3
            lx, ly = lx / ln, ly / ln
            warm = np.clip(py / horizon, 0, 1)
            base_c = (shade * .72 + lit * .28) * (1 - warm * .35) + glow * warm * .35
            top_c = lit * (1 - warm * .25) + glow * warm * .25
            for k, f in ((0, 1.0), (1, .84), (2, .66), (3, .46)):
                t = k / 3
                c = base_c * (1 - t) + top_c * t
                ox, oy = lx * R * (1 - f) * .85, ly * R * (1 - f) * .85
                ld.ellipse([X0 + ox - R * f, Y0 + oy - R * f * .82, X0 + ox + R * f, Y0 + oy + R * f * .82], fill=tuple(int(v) for v in c) + (255 if k else 215,))
    layer = layer.filter(ImageFilter.GaussianBlur(9))
    cl = np.asarray(layer, np.float32) / 255
    img = mix(sky, cl[..., :3], cl[..., 3] * smooth(horizon + .03, horizon - .1, y) * .96)
    # Hills, far to near
    for i, colour in enumerate(P['hills']):
        top = horizon + i * 0.052
        ridge = np.array([0.0] * w, np.float32)
        for f, a in ((1.4, .05), (3.1, .022), (7.3, .009), (17, .004)):
            ridge += a * np.sin(x[0] * f * 2 * math.pi + rng.random() * 6.28)
        line = (top + ridge * (0.7 + i * 0.25)) * h
        mask = smooth(-2, 2, Y - line[None, :])
        tex = fbm(h, w, rng, 16, 5)
        c = hex3(colour)
        col = np.ones((h, w, 3)) * c
        col = mix(col, np.ones((h, w, 3)) * c * 0.72, smooth(0.52, 0.8, tex))
        col = mix(col, np.ones((h, w, 3)) * hex3(P['gold']), 0.55 * smooth(0.5, 0.78, 1 - tex) * (1 - i * 0.12))
        col = mix(col, np.ones((h, w, 3)) * hex3(P['low']), 0.34 * (1 - i / 4) * np.exp(-((Y - line[None, :]) / (h * 0.03)) ** 2))
        img = mix(img, col, mask)
    # Foreground field
    field_line = (0.83 + 0.02 * np.sin(x[0] * 5 + 1.2) - 0.05 * (x[0] - .5) ** 2) * h
    tex = fbm(h, w, rng, 22, 4)
    col = mix(np.ones((h, w, 3)) * hex3(P['field']), np.ones((h, w, 3)) * hex3(P['hills'][3]) * .9, smooth(.4, .7, tex))
    img = mix(img, col, smooth(-6, 6, Y - field_line[None, :]))
    return (np.clip(img, 0, 1) * 255).astype(np.uint8), rng, field_line


def strokes(src, rng, passes, flow_scale=5):
    """Stroke-based rendering: lays short, oriented dabs of the source's colours."""
    h, w = src.shape[:2]
    a = fbm(h // 4, w // 4, rng, flow_scale, 3)
    a = zoom(a, (h / a.shape[0], w / a.shape[1]), order=1)[:h, :w] * 4 * math.pi
    blur = gaussian_filter(src.astype(np.float32).mean(axis=2), 3)
    gy, gx = np.gradient(blur)
    mag = np.hypot(gx, gy)
    canvas = Image.fromarray(src).filter(ImageFilter.GaussianBlur(passes[0][0]))
    draw = ImageDraw.Draw(canvas)
    for width, length, step in passes:
        smooth_src = gaussian_filter(src.astype(np.float32), (width / 3, width / 3, 0))
        ys = np.arange(0, h, step); xs = np.arange(0, w, step)
        pts = [(int(min(h - 1, yy + rng.integers(-step, step + 1) if yy else 0)), int(min(w - 1, max(0, xx + rng.integers(-step, step + 1))))) for yy in ys for xx in xs]
        rng.shuffle(pts)
        for py, px in pts:
            py = max(0, py)
            # Follow edges where there are edges, drift with the flow elsewhere.
            edge = mag[py, px] > 2.2
            ang = math.atan2(gx[py, px], -gy[py, px]) if edge else a[py, px]
            ln = length * (0.6 if edge else 1) * (0.7 + rng.random() * 0.6)
            c = smooth_src[py, px] + rng.normal(0, 3.5, 3)
            c = tuple(int(v) for v in np.clip(c, 0, 255))
            pts2 = [(px, py)]
            cx, cy, t = px, py, ang
            for _ in range(3):
                cx += math.cos(t) * ln / 3; cy += math.sin(t) * ln / 3; t += rng.normal(0, .16)
                pts2.append((cx, cy))
            draw.line(pts2, fill=c, width=int(width), joint='curve')
    return np.asarray(canvas).copy()


def flowers(img, rng, field_line, palette, sunflowers=True):
    h, w = img.shape[:2]
    im = Image.fromarray(img); d = ImageDraw.Draw(im, 'RGBA')
    gold, cream = hex3(palette['gold']) * 255, np.array([252, 240, 214.])
    peach = hex3(palette['low']) * 255
    # Grasses and small flowers, bigger toward the viewer.
    for _ in range(26000):
        x = rng.integers(0, w)
        top = field_line[x] - 24
        y = top + (rng.random() ** 0.6) * (h - top + 30)
        p = (y - top) / (h - top)
        ln = 8 + 54 * p * rng.random()
        ang = -math.pi / 2 + rng.normal(0, .3)
        col = hex3(palette['hills'][3]) * 255 * (0.8 + rng.random() * .55)
        d.line([(x, y), (x + math.cos(ang) * ln, y + math.sin(ang) * ln)], fill=tuple(int(min(255, v)) for v in col) + (200,), width=max(1, int(1 + 3 * p)))
    for _ in range(9000):
        x = rng.integers(0, w)
        top = field_line[x] - 6
        y = top + (rng.random() ** 0.8) * (h - top)
        p = (y - top) / (h - top)
        r = 1.2 + 7 * p * rng.random()
        c = [gold, cream, peach][rng.integers(0, 3)] * (0.92 + rng.random() * .12)
        d.ellipse([x - r * 1.3, y - r, x + r * 1.3, y + r], fill=tuple(int(min(255, v)) for v in c) + (235,))
    if sunflowers:
        def flower(cx, cy, R):
            for rad, n, c in ((1.0, 22, '#d9951f'), (.92, 22, '#f0bb34'), (.82, 18, '#f8d765')):
                for i in range(n):
                    t = i / n * 2 * math.pi + rng.random() * .15
                    L = R * rad * (0.9 + rng.random() * .2)
                    bx, by = cx + math.cos(t) * R * .34, cy + math.sin(t) * R * .3
                    ex, ey = cx + math.cos(t) * L, cy + math.sin(t) * L * .9
                    nx, ny = -math.sin(t) * R * .09, math.cos(t) * R * .09
                    mx, my = (bx + ex) / 2, (by + ey) / 2
                    col = hex3(c) * 255 * (0.92 + rng.random() * .14)
                    d.polygon([(bx, by), (mx + nx, my + ny), (ex, ey), (mx - nx, my - ny)], fill=tuple(int(min(255, v)) for v in col) + (255,))
            d.ellipse([cx - R * .36, cy - R * .32, cx + R * .36, cy + R * .32], fill=(92, 60, 28, 255))
            d.ellipse([cx - R * .22, cy - R * .2, cx + R * .22, cy + R * .2], fill=(62, 42, 22, 255))
            d.line([(cx, cy), (cx + R * .1, h + 20)], fill=(84, 112, 58, 255), width=int(max(5, R * .09)))
            d.polygon([(cx + R * .05, cy + R * 1.3), (cx + R * 1.1, cy + R * 1.05), (cx + R * .95, cy + R * 1.6)], fill=(98, 128, 66, 255))
        for fx, fy, R in ((.885, .79, 118), (.965, .73, 88), (.80, .885, 74), (.935, .95, 96), (.07, .9, 66), (.022, .83, 46)):
            flower(fx * w, fy * h, R)
    return np.asarray(im.convert('RGB')).copy()


def grade(a):
    f = a.astype(np.float32) / 255
    f = 0.04 + f * 0.95
    lum = f.mean(axis=2, keepdims=True)
    f = f * (np.array([1.05, 1.0, .9]) * lum + np.array([.97, .99, 1.04]) * (1 - lum))
    return (np.clip(f, 0, 1) * 255).astype(np.uint8)


if sys.argv[1] == 'scene':
    name, out = sys.argv[2], sys.argv[3]
    base, rng, line = scene(name)
    base = flowers(base, rng, line, PALETTES[name])
    painted = strokes(base, rng, [(30, 80, 24), (16, 52, 13), (8, 26, 8)], flow_scale=3)
    Image.fromarray(grade(painted)).resize((2000, 1125), Image.LANCZOS).save(out, 'WEBP', quality=80, method=6)
else:
    src, out = sys.argv[2], sys.argv[3]
    rng = np.random.default_rng(5)
    im = Image.open(src).convert('RGB')
    im = im.resize((1056, 1320), Image.LANCZOS)
    painted = strokes(np.asarray(im), rng, [(16, 42, 13), (8, 26, 7), (4, 14, 4)])
    Image.fromarray(grade(painted)).resize((880, 1100), Image.LANCZOS).save(out, 'WEBP', quality=82, method=6)
