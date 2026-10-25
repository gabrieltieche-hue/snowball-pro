#!/usr/bin/env python3
"""Rend le MP4 Snowball Pro 75s (6 scenes x 12.5s, 1280x720, 30fps) via Pillow + ffmpeg binaire (imageio-ffmpeg)."""
import math, os, random, subprocess, sys

W, H, FPS = 1280, 720, 30
SCENE = 12.5
TOTAL = 75.0
NFRAMES = int(TOTAL * FPS)  # 2250
BG = (18, 16, 14)
GOLD = (201, 168, 106)
IVOIRE = (245, 242, 235)
DIM = (140, 130, 120)
GREEN = (110, 200, 150)
RED = (230, 120, 120)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "snowball-pro-75s.mp4")
OUT = os.path.abspath(OUT)

from PIL import Image, ImageDraw, ImageFont  # noqa: E402

def font(size, bold=True):
    for p in [
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans-{'Bold' if bold else ''}.ttf".replace("-.ttf", ".ttf"),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()

F_TITLE = font(72, True)
F_BIG = font(110, True)
F_MED = font(40, True)
F_SMALL = font(28, False)
F_TINY = font(22, False)

def ease_out(t):
    return 1 - (1 - t) ** 3

def ease_inout(t):
    return t * t * (3 - 2 * t)

def txt_center(d, y, s, f, fill):
    bb = d.textbbox((0, 0), s, font=f)
    d.text(((W - (bb[2] - bb[0])) / 2, y), s, font=f, fill=fill)

def money(v):
    return f"{int(round(v)):,} €".replace(",", " ")

# Trajectoires deterministes (mensualisation exacte)
def growth(monthly, years, annual):
    m = (1 + annual) ** (1 / 12) - 1
    n = years * 12
    cap, out = 0.0, []
    for _ in range(n):
        cap = cap * (1 + m) + monthly
        out.append(cap)
    return out

G_OPT = growth(500, 25, 0.1007)
G_CEN = growth(500, 25, 0.0822)
G_PRU = growth(500, 25, 0.0599)
FINAL_CEN = G_CEN[-1]

random.seed(7)
MC = []
for _ in range(60):
    drift = random.uniform(0.04, 0.11)
    vol = random.uniform(0.10, 0.22)
    cap, path = 0.0, []
    for k in range(300):
        shock = random.gauss(0, vol / math.sqrt(12))
        cap = cap * (1 + (drift / 12) + shock * 0.28) + 500
        path.append(max(cap, 0))
    MC.append(path)
P10 = sorted(p[-1] for p in MC)[6]
P50 = sorted(p[-1] for p in MC)[30]
P90 = sorted(p[-1] for p in MC)[53]

def round_rect(d, xy, r, fill, outline=None):
    d.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=2 if outline else 1)

def draw_frame(i):
    t = i / FPS
    scene = min(int(t / SCENE), 5)
    st = t - scene * SCENE  # temps dans scene
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # particules or fixes (subtiles)
    for k in range(40):
        px = (k * 373) % W
        py = (k * 211) % H
        tw = 40 + 30 * math.sin(t * 1.5 + k)
        d.ellipse([px, py, px + 3, py + 3], fill=(int(GOLD[0] * tw / 120), int(GOLD[1] * tw / 120), int(GOLD[2] * tw / 120)))

    if scene == 0:
        p = ease_out(min(st / 9, 1))
        txt_center(d, 120, "SNOWBALL PRO", F_MED, GOLD)
        txt_center(d, 200, "TON NOMBRE MAGIQUE", F_TITLE, IVOIRE)
        val = FINAL_CEN * p
        s = money(val)
        bb = d.textbbox((0, 0), s, font=F_BIG)
        d.text(((W - (bb[2] - bb[0])) / 2, 320), s, font=F_BIG, fill=GOLD)
        txt_center(d, 470, "500 €/mois  ×  25 ans  @  8,22 % central", F_SMALL, DIM)
        for j, b in enumerate(["100 ans d'historique", "rendements réels", "inflation 2,1 %"]):
            x0 = 240 + j * 270
            a = ease_inout(max(0, min((st - 2 - j * 0.8) / 0.8, 1)))
            if a > 0:
                round_rect(d, [x0, 540, x0 + 250, 590], 14, (35, 32, 28), GOLD if a >= 1 else None)
                bb2 = d.textbbox((0, 0), b, font=F_TINY)
                d.text((x0 + (250 - (bb2[2] - bb2[0])) / 2, 553), b, font=F_TINY, fill=IVOIRE)
        cap = "500 € par mois. Le temps fait le reste."
    elif scene == 1:
        txt_center(d, 60, "LA PROJECTION", F_MED, GOLD)
        # cadre graphe
        gx, gy, gw, gh = 140, 160, 1000, 380
        d.rectangle([gx, gy, gx + gw, gy + gh], outline=(60, 55, 48))
        mx = max(G_OPT)
        def path_of(g, frac):
            n = max(2, int(len(g) * ease_inout(min(frac / 6 * 6, 1)) * min(st / 6, 1)))
            pts = []
            for k in range(n):
                x = gx + gw * k / (len(g) - 1)
                y = gy + gh - gh * g[k] / mx
                pts.append((x, y))
            return pts
        # attention: frac simplifie -> draw progressif sur 6s
        for g, col in [(G_PRU, (150, 150, 160)), (G_CEN, GOLD), (G_OPT, GREEN)]:
            pts = path_of(g, 1.0)
            if len(pts) > 1:
                d.line(pts, fill=col, width=4)
        pills = [("Prudent 5,99 %", (150, 150, 160)), ("Central 8,22 %", GOLD), ("Optimiste 10,07 %", GREEN)]
        for j, (label, col) in enumerate(pills):
            a = ease_inout(max(0, min((st - 6 - j * 0.5) / 0.5, 1)))
            if a > 0:
                x0 = 200 + j * 300
                y0 = 570 + int((1 - a) * 30)
                round_rect(d, [x0, y0, x0 + 280, y0 + 60], 16, (35, 32, 28), col)
                bb2 = d.textbbox((0, 0), label, font=F_SMALL)
                d.text((x0 + (280 - (bb2[2] - bb2[0])) / 2, y0 + 12), label, font=F_SMALL, fill=IVOIRE)
        cap = "Trois mondes. Un seul plan : la médiane."
    elif scene == 2:
        txt_center(d, 60, "FISCALITÉ FRANÇAISE 2026", F_MED, GOLD)
        cards = [("CTO", "PFU 30 % + 1,4 %", "Souple, toujours"), ("PEA", "17,2 % après 5 ans", "Plafond 150 k€"), ("AV", "17,2 % après 8 ans", "Abattement 4,6/9,2 k€"), ("PER", "TMI puis 30 %", "Déductible")]
        for j, (name, l1, l2) in enumerate(cards):
            a = ease_inout(max(0, min((st - 1 - j * 0.7) / 0.6, 1)))
            if a <= 0:
                continue
            x0 = 90 + j * 285
            y0 = 220 + int((1 - a) * 60)
            round_rect(d, [x0, y0, x0 + 255, y0 + 260], 18, (32, 29, 25), GOLD)
            txt = name
            bb2 = d.textbbox((0, 0), txt, font=F_MED)
            d.text((x0 + (255 - (bb2[2] - bb2[0])) / 2, y0 + 25), txt, font=F_MED, fill=GOLD)
            for k, line in enumerate([l1, l2]):
                bb3 = d.textbbox((0, 0), line, font=F_TINY)
                d.text((x0 + (255 - (bb3[2] - bb3[0])) / 2, y0 + 120 + k * 40), line, font=F_TINY, fill=IVOIRE)
        cap = "CTO, PEA, AV, PER : le net après impôt, pas le brut."
    elif scene == 3:
        txt_center(d, 60, "10 000 SCÉNARIOS MONTE CARLO", F_MED, GOLD)
        gx, gy, gw, gh = 140, 150, 720, 400
        d.rectangle([gx, gy, gx + gw, gy + gh], outline=(60, 55, 48))
        mx = max(max(p) for p in MC) * 1.05
        n = max(2, int(300 * min(st / 8, 1)))
        for p in MC:
            pts = [(gx + gw * k / 299, gy + gh - gh * p[k] / mx) for k in range(n)]
            d.line(pts, fill=(90, 80, 65), width=1)
        vals = [("P10", P10, RED), ("P50", P50, IVOIRE), ("P90", P90, GREEN)]
        for j, (lab, v, col) in enumerate(vals):
            vv = v * ease_out(max(0, min((st - 4 - j) / 4, 1)))
            d.text((920, 200 + j * 110), lab, font=F_MED, fill=col)
            d.text((920, 250 + j * 110), money(vv), font=F_SMALL, fill=IVOIRE)
        cap = "Krachs inclus. Tu vois le pire, le médian, le meilleur."
    elif scene == 4:
        txt_center(d, 60, "ELLE TIENT EN CRISE ?", F_MED, GOLD)
        crises = [("1973", RED), ("2000", RED), ("2008", RED)]
        for j, (c, col) in enumerate(crises):
            on = (st % 3) >= j * 0.3 and st > j * 1.2
            x0 = 250 + j * 260
            d.rectangle([x0, 220, x0 + 220, 340], outline=col, width=3 if on else 1)
            bb2 = d.textbbox((0, 0), c, font=F_BIG)
            d.text((x0 + (220 - (bb2[2] - bb2[0])) / 2, 240), c, font=F_BIG, fill=col if on else DIM)
        a = ease_inout(max(0, min((st - 5) / 1.5, 1)))
        if a > 0:
            round_rect(d, [340, 400, 940, 500], 18, (30, 45, 35) if a >= 1 else (30, 30, 28), GREEN)
            txt_center(d, 425, "Garde-fous Guyton-Klinger", F_SMALL, IVOIRE)
        txt_center(d, 530, "La rente s'ajuste. Le plan survit.", F_SMALL, DIM)
        cap = "1973, 2000, 2008 rejoués. La rente s'adapte."
    else:
        txt_center(d, 150, "GRATUIT. LOCAL. SANS INSCRIPTION.", F_MED, IVOIRE)
        txt_center(d, 250, "SNOWBALL PRO", F_BIG, GOLD)
        a = ease_inout(max(0, min((st - 2) / 1, 1)))
        if a > 0:
            round_rect(d, [490, 420, 790, 500], 20, GOLD)
            bb2 = d.textbbox((0, 0), "Ouvrir l'app", font=F_MED)
            d.text((640 - (bb2[2] - bb2[0]) / 2, 435), "Ouvrir l'app", font=F_MED, fill=(18, 16, 14))
        txt_center(d, 540, "Tes données ne quittent jamais ton appareil.", F_SMALL, DIM)
        cap = "À toi. Calcule ton nombre magique."

    # barre progression + timer + captions
    prog = t / TOTAL
    d.rectangle([0, 0, W * prog, 8], fill=GOLD)
    mm, ss = int(t // 60), int(t % 60)
    d.text((20, H - 70), f"{mm}:{ss:02d} / 1:15", font=F_TINY, fill=DIM)
    d.text((W - 200, H - 70), f"SCÈNE {scene + 1}/6", font=F_TINY, fill=DIM)
    bb = d.textbbox((0, 0), cap, font=F_SMALL)
    d.text(((W - (bb[2] - bb[0])) / 2, H - 110), cap, font=F_SMALL, fill=IVOIRE)
    return img

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
        print("NO FFMPEG FOUND", flush=True)
        sys.exit(2)
    cmd = [ff, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
           "-movflags", "+faststart", OUT]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for i in range(NFRAMES):
        img = draw_frame(i)
        p.stdin.write(img.tobytes())
        if i % 300 == 0:
            print(f"{i}/{NFRAMES}", flush=True)
    p.stdin.close()
    p.wait()
    print("OK " + OUT)

if __name__ == "__main__":
    main()
