#!/usr/bin/env python3
"""MP4 Snowball Pro 75s sans Pillow : framebuffer bytearray + freetype-py + ffmpeg.
Usage: /data/data/com.termux/files/usr/bin/python3.13 scripts/render-mp4-nopil.py
"""
import math, os, random, subprocess, sys

W, H, FPS = 1280, 720, 24
SCENE = 12.5
TOTAL = 75.0
NFRAMES = int(TOTAL * FPS)
BG = (18, 16, 14)
GOLD = (201, 168, 106)
IVOIRE = (245, 242, 235)
DIM = (150, 140, 130)
GREEN = (110, 200, 150)
RED = (230, 120, 120)
PANEL = (32, 29, 25)

OUT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "snowball-pro-75s.mp4"))

import ctypes  # noqa: E402
from ctypes import c_int, c_uint, c_long, c_ulong, c_short, c_ushort, c_ubyte, c_char_p, c_void_p, POINTER  # noqa: E402


class _FTBitmap(ctypes.Structure):
    _fields_ = [("rows", c_int), ("width", c_int), ("pitch", c_int),
                ("buffer", c_void_p), ("num_grays", c_short),
                ("pixel_mode", c_ubyte), ("palette_mode", c_ubyte), ("palette", c_void_p)]


class _FTVector(ctypes.Structure):
    _fields_ = [("x", c_long), ("y", c_long)]


class _FTGlyphMetrics(ctypes.Structure):
    _fields_ = [("width", c_long), ("height", c_long),
                ("horiBearingX", c_long), ("horiBearingY", c_long), ("horiAdvance", c_long),
                ("vertBearingX", c_long), ("vertBearingY", c_long), ("vertAdvance", c_long)]


class _FTGlyphSlot(ctypes.Structure):
    _fields_ = [("library", c_void_p), ("face", c_void_p), ("next", c_void_p), ("reserved", c_uint),
                ("generic_data", c_void_p), ("generic_finalizer", c_void_p),
                ("metrics", _FTGlyphMetrics),
                ("linearHoriAdvance", c_long), ("linearVertAdvance", c_long),
                ("advance", _FTVector), ("format", c_int),
                ("bitmap", _FTBitmap), ("bitmap_left", c_int), ("bitmap_top", c_int)]


class _FTFace(ctypes.Structure):
    _fields_ = [("num_faces", c_long), ("face_index", c_long),
                ("face_flags", c_long), ("style_flags", c_long), ("num_glyphs", c_long),
                ("family_name", c_char_p), ("style_name", c_char_p),
                ("num_fixed_sizes", c_int), ("available_sizes", c_void_p),
                ("num_charmaps", c_int), ("charmaps", c_void_p),
                ("generic_data", c_void_p), ("generic_finalizer", c_void_p),
                ("bbox_xmin", c_long), ("bbox_ymin", c_long), ("bbox_xmax", c_long), ("bbox_ymax", c_long),
                ("units_per_EM", c_ushort), ("ascender", c_short), ("descender", c_short), ("height", c_short),
                ("max_advance_width", c_short), ("max_advance_height", c_short),
                ("underline_position", c_short), ("underline_thickness", c_short),
                ("glyph", POINTER(_FTGlyphSlot))]


_FTLIB = None
for _p in ("/system/lib64/libft2.so", "libfreetype.so.6"):
    try:
        _FTLIB = ctypes.CDLL(_p)
        break
    except Exception:
        continue
if _FTLIB is None:
    raise RuntimeError("no freetype lib")
_FTLIB.FT_Init_FreeType.argtypes = [POINTER(c_void_p)]
_FTLIB.FT_Init_FreeType.restype = c_int
_FTLIB.FT_New_Face.argtypes = [c_void_p, c_char_p, c_long, POINTER(c_void_p)]
_FTLIB.FT_New_Face.restype = c_int
_FTLIB.FT_Set_Pixel_Sizes.argtypes = [c_void_p, c_uint, c_uint]
_FTLIB.FT_Set_Pixel_Sizes.restype = c_int
_FTLIB.FT_Load_Char.argtypes = [c_void_p, c_ulong, c_int]
_FTLIB.FT_Load_Char.restype = c_int
_FT_LOAD_RENDER = 4
_libh = c_void_p()
if _FTLIB.FT_Init_FreeType(ctypes.byref(_libh)):
    raise RuntimeError("FT_Init failed")
_FACES = {}


def _face_for(bold):
    if bold not in _FACES:
        for p in [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/system/fonts/DroidSans-Bold.ttf" if bold else "/system/fonts/DroidSans.ttf",
        ]:
            if os.path.exists(p):
                fh = c_void_p()
                if _FTLIB.FT_New_Face(_libh, p.encode(), 0, ctypes.byref(fh)) == 0:
                    _FACES[bold] = fh.value
                    break
        else:
            raise RuntimeError("no font found")
    return _FACES[bold]


def _glyphs(s, size, bold=True):
    fh = _face_for(bold)
    if _FTLIB.FT_Set_Pixel_Sizes(c_void_p(fh), 0, size):
        raise RuntimeError("set size failed")
    out = []
    for ch in s:
        if _FTLIB.FT_Load_Char(c_void_p(fh), ord(ch), _FT_LOAD_RENDER):
            out.append((0, b"", 0, 0, 0, 0, size // 2))
            continue
        slot = _FTFace.from_address(fh).glyph.contents
        bm = slot.bitmap
        buf = ctypes.string_at(bm.buffer, bm.rows * abs(bm.pitch)) if bm.buffer else b""
        out.append((bm.width, buf, bm.rows, abs(bm.pitch), slot.bitmap_left, slot.bitmap_top,
                    slot.advance.x >> 6))
    return out


def text_w(s, size, bold=True):
    return sum(g[6] for g in _glyphs(s, size, bold))

class FB:
    def __init__(self):
        self.b = bytearray(W * H * 3)
    def fill(self, c):
        row = bytes(c) * W
        self.b[:] = row * H
    def rect(self, x0, y0, x1, y1, c, alpha=255):
        x0 = max(0, int(x0)); y0 = max(0, int(y0)); x1 = min(W, int(x1)); y1 = min(H, int(y1))
        if x1 <= x0 or y1 <= y0:
            return
        b = self.b
        if alpha >= 255:
            row = bytes(c) * (x1 - x0)
            for y in range(y0, y1):
                o = (y * W + x0) * 3
                b[o:o + (x1 - x0) * 3] = row
        else:
            a = alpha / 255.0
            r, g, bl = c
            for y in range(y0, y1):
                o = (y * W + x0) * 3
                for x in range(x0, x1):
                    i = o + (x - x0) * 3
                    b[i] = int(r * a + b[i] * (1 - a))
                    b[i + 1] = int(g * a + b[i + 1] * (1 - a))
                    b[i + 2] = int(bl * a + b[i + 2] * (1 - a))
    def px(self, x, y, c):
        if 0 <= x < W and 0 <= y < H:
            o = (y * W + x) * 3
            self.b[o:o + 3] = bytes(c)
    def line(self, x0, y0, x1, y1, c, w=1):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx, dy = abs(x1 - x0), abs(y1 - y0)
        sx, sy = (1 if x1 > x0 else -1), (1 if y1 > y0 else -1)
        err = dx - dy
        r = w // 2
        while True:
            for oy in range(-r, r + 1):
                for ox in range(-r, r + 1):
                    self.px(x0 + ox, y0 + oy, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy; x0 += sx
            if e2 < dx:
                err += dx; y0 += sy
    def rrect(self, x0, y0, x1, y1, rad, c, outline=None):
        self.rect(x0 + rad, y0, x1 - rad, y1, c)
        self.rect(x0, y0 + rad, x1, y1 - rad, c)
        for cx, cy in [(x0 + rad, y0 + rad), (x1 - rad, y0 + rad), (x0 + rad, y1 - rad), (x1 - rad, y1 - rad)]:
            for oy in range(-rad, rad + 1):
                for ox in range(-rad, rad + 1):
                    if ox * ox + oy * oy <= rad * rad:
                        self.px(cx + ox, cy + oy, c)
        if outline:
            self.rect(x0, y0, x1, y0 + 2, outline)
            self.rect(x0, y1 - 2, x1, y1, outline)
            self.rect(x0, y0, x0 + 2, y1, outline)
            self.rect(x1 - 2, y0, x1, y1, outline)
    def text(self, s, x, y, size, c, bold=True, center=False, alpha=255):
        gl = _glyphs(s, size, bold)
        if center:
            x = x - sum(g[6] for g in gl) // 2
        x = int(x); y = int(y)
        b = self.b
        ar, ag, ab = c
        ga = alpha / 255.0
        for wd, buf, rows, pitch, left, top, adv in gl:
            l = x + left
            tp = y - top
            for r in range(rows):
                base = r * pitch
                for cc in range(wd):
                    a = buf[base + cc] / 255.0 * ga
                    if a <= 0:
                        continue
                    xx, yy = l + cc, tp + r
                    if 0 <= xx < W and 0 <= yy < H:
                        o = (yy * W + xx) * 3
                        b[o] = int(ar * a + b[o] * (1 - a))
                        b[o + 1] = int(ag * a + b[o + 1] * (1 - a))
                        b[o + 2] = int(ab * a + b[o + 2] * (1 - a))
            x += adv

def ease_out(t):
    return 1 - (1 - t) ** 3

def ease_inout(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

def money(v):
    return f"{int(round(v)):,} €".replace(",", " ")

def growth(monthly, years, annual):
    m = (1 + annual) ** (1 / 12) - 1
    cap, out = 0.0, []
    for _ in range(years * 12):
        cap = cap * (1 + m) + monthly
        out.append(cap)
    return out

G_OPT = growth(500, 25, 0.1007)
G_CEN = growth(500, 25, 0.0822)
G_PRU = growth(500, 25, 0.0599)
FINAL_CEN = G_CEN[-1]

random.seed(7)
MC = []
for _ in range(40):
    drift = random.uniform(0.04, 0.11)
    vol = random.uniform(0.10, 0.22)
    cap, path = 0.0, []
    for _ in range(300):
        shock = random.gauss(0, vol / math.sqrt(12))
        cap = cap * (1 + (drift / 12) + shock * 0.28) + 500
        path.append(max(cap, 0))
    MC.append(path)
SRT = sorted(p[-1] for p in MC)
P10, P50, P90 = SRT[4], SRT[20], SRT[35]

def draw_frame(fb, i):
    t = i / FPS
    scene = min(int(t / SCENE), 5)
    st = t - scene * SCENE
    fb.fill(BG)
    for k in range(36):
        px = (k * 373) % W
        py = (k * 211) % H
        tw = 0.25 + 0.2 * math.sin(t * 1.5 + k)
        fb.px(px, py, (int(GOLD[0] * tw), int(GOLD[1] * tw), int(GOLD[2] * tw)))

    if scene == 0:
        p = ease_out(min(st / 9, 1))
        fb.text("SNOWBALL PRO", W // 2, 150, 44, GOLD, center=True)
        fb.text("TON NOMBRE MAGIQUE", W // 2, 250, 68, IVOIRE, center=True)
        fb.text(money(FINAL_CEN * p), W // 2, 400, 104, GOLD, center=True)
        fb.text("500 €/mois  x  25 ans  @  8,22 % central", W // 2, 500, 26, DIM, bold=False, center=True)
        for j, btxt in enumerate(["100 ans d'historique", "rendements reels", "inflation 2,1 %"]):
            a = ease_inout((st - 2 - j * 0.8) / 0.8)
            if a > 0:
                x0 = 240 + j * 270
                fb.rrect(x0, 540, x0 + 250, 590, 14, PANEL, outline=GOLD)
                fb.text(btxt, x0 + 125, 573, 20, IVOIRE, bold=False, center=True)
        cap = "500 € par mois. Le temps fait le reste."
    elif scene == 1:
        fb.text("LA PROJECTION", W // 2, 110, 44, GOLD, center=True)
        gx, gy, gw, gh = 140, 160, 1000, 380
        fb.rect(gx, gy, gx + gw, gy + 2, DIM)
        fb.rect(gx, gy, gx + 2, gy + gh, DIM)
        mx = max(G_OPT)
        n = max(2, int(len(G_OPT) * ease_inout(st / 6)))
        for g, col in [(G_PRU, (150, 150, 160)), (G_CEN, GOLD), (G_OPT, GREEN)]:
            prev = None
            for k in range(n):
                x = gx + gw * k / (len(g) - 1)
                y = gy + gh - gh * g[k] / mx
                if prev:
                    fb.line(prev[0], prev[1], x, y, col, 2)
                prev = (x, y)
        for j, (label, col) in enumerate([("Prudent 5,99 %", (150, 150, 160)), ("Central 8,22 %", GOLD), ("Optimiste 10,07 %", GREEN)]):
            a = ease_inout((st - 6 - j * 0.5) / 0.5)
            if a > 0:
                x0 = 200 + j * 300
                y0 = 570 + int((1 - a) * 30)
                fb.rrect(x0, y0, x0 + 280, y0 + 60, 16, PANEL, outline=col)
                fb.text(label, x0 + 140, y0 + 40, 24, IVOIRE, center=True)
        cap = "Trois mondes. Un seul plan : la mediane."
    elif scene == 2:
        fb.text("FISCALITE FRANCAISE 2026", W // 2, 110, 44, GOLD, center=True)
        cards = [("CTO", "PFU 30 % + 1,4 %", "Souple, toujours"), ("PEA", "17,2 % apres 5 ans", "Plafond 150 kE"),
                 ("AV", "17,2 % apres 8 ans", "Abattement fiscal"), ("PER", "TMI puis 30 %", "Deductible")]
        for j, (name, l1, l2) in enumerate(cards):
            a = ease_inout((st - 1 - j * 0.7) / 0.6)
            if a <= 0:
                continue
            x0 = 90 + j * 285
            y0 = 220 + int((1 - a) * 60)
            fb.rrect(x0, y0, x0 + 255, y0 + 260, 18, PANEL, outline=GOLD)
            fb.text(name, x0 + 127, y0 + 90, 44, GOLD, center=True)
            fb.text(l1, x0 + 127, y0 + 160, 20, IVOIRE, bold=False, center=True)
            fb.text(l2, x0 + 127, y0 + 195, 20, IVOIRE, bold=False, center=True)
        cap = "CTO, PEA, AV, PER : le net apres impot."
    elif scene == 3:
        fb.text("10 000 SCENARIOS MONTE CARLO", W // 2, 110, 40, GOLD, center=True)
        gx, gy, gw, gh = 140, 150, 720, 400
        fb.rect(gx, gy, gx + gw, gy + 2, DIM)
        fb.rect(gx, gy, gx + 2, gy + gh, DIM)
        mx = max(max(p) for p in MC) * 1.05
        n = max(2, int(300 * min(st / 8, 1)))
        dot = (95, 85, 68)
        for p in MC:
            for k in range(0, n, 2):
                x = int(gx + gw * k / 299)
                y = int(gy + gh - gh * p[k] / mx)
                fb.px(x, y, dot)
        for j, (lab, v, col) in enumerate([("P10", P10, RED), ("P50", P50, IVOIRE), ("P90", P90, GREEN)]):
            vv = v * ease_out(max(0.0, min((st - 4 - j) / 4, 1.0)))
            fb.text(lab, 920, 240 + j * 110, 40, col)
            fb.text(money(vv), 920, 280 + j * 110, 24, IVOIRE, bold=False)
        cap = "Krachs inclus. Pire, median, meilleur."
    elif scene == 4:
        fb.text("ELLE TIENT EN CRISE ?", W // 2, 110, 44, GOLD, center=True)
        for j, c in enumerate(["1973", "2000", "2008"]):
            on = st > j * 1.2
            x0 = 250 + j * 260
            col = RED if on else DIM
            fb.rect(x0, 220, x0 + 220, 222, col)
            fb.rect(x0, 338, x0 + 220, 340, col)
            fb.rect(x0, 220, x0 + 2, 340, col)
            fb.rect(x0 + 218, 220, x0 + 220, 340, col)
            fb.text(c, x0 + 110, 310, 72, col, center=True)
        a = ease_inout((st - 5) / 1.5)
        if a > 0:
            fb.rrect(340, 400, 940, 500, 18, (30, 45, 35), outline=GREEN)
            fb.text("Garde-fous Guyton-Klinger", W // 2, 465, 28, IVOIRE, center=True)
        fb.text("La rente s'ajuste. Le plan survit.", W // 2, 560, 26, DIM, bold=False, center=True)
        cap = "1973, 2000, 2008 rejoues. La rente s'adapte."
    else:
        fb.text("GRATUIT. LOCAL. SANS INSCRIPTION.", W // 2, 210, 40, IVOIRE, center=True)
        fb.text("SNOWBALL PRO", W // 2, 350, 100, GOLD, center=True)
        a = ease_inout((st - 2) / 1)
        if a > 0:
            fb.rrect(490, 420, 790, 500, 20, GOLD)
            fb.text("Ouvrir l'app", 640, 472, 36, (18, 16, 14), center=True)
        fb.text("Tes donnees ne quittent jamais ton appareil.", W // 2, 560, 24, DIM, bold=False, center=True)
        cap = "A toi. Calcule ton nombre magique."

    prog = t / TOTAL
    fb.rect(0, 0, int(W * prog), 8, GOLD)
    fb.text(f"{int(t // 60)}:{int(t % 60):02d} / 1:15", 20, H - 40, 20, DIM, bold=False)
    fb.text(f"SCENE {scene + 1}/6", W - 20 - text_w(f"SCENE {scene + 1}/6", 20, False), H - 40, 20, DIM, bold=False)
    fb.text(cap, W // 2, H - 78, 26, IVOIRE, bold=False, center=True)

def main():
    ff = None
    try:
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    if not ff:
        import shutil
        ff = shutil.which("ffmpeg")
    if not ff:
        print("NO FFMPEG", flush=True)
        sys.exit(2)
    cmd = [ff, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
           "-movflags", "+faststart", OUT]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    fb = FB()
    for i in range(NFRAMES):
        draw_frame(fb, i)
        p.stdin.write(fb.b)
        if i % 240 == 0:
            print(f"{i}/{NFRAMES}", flush=True)
    p.stdin.close()
    p.wait()
    print("OK " + OUT, flush=True)

if __name__ == "__main__":
    main()
