"""Generate PWA icons (simple gradient heart on rounded square)."""
from PIL import Image, ImageDraw
import os, math

OUT = os.path.join(os.path.dirname(__file__), "..", "docs", "icons")
os.makedirs(OUT, exist_ok=True)

def heart_path(cx, cy, size):
    pts = []
    for t in [i/200 for i in range(201)]:
        a = t * 2 * math.pi
        x = 16 * math.sin(a)**3
        y = 13 * math.cos(a) - 5 * math.cos(2*a) - 2 * math.cos(3*a) - math.cos(4*a)
        pts.append((cx + x*size/40, cy - y*size/40))
    return pts

def rounded_rect_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, size-1, size-1), radius=radius, fill=255)
    return m

def make_icon(size, bg=(255, 67, 94), fg=(255, 255, 255)):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # gradient background
    grad = Image.new("RGB", (size, size), bg)
    gd = ImageDraw.Draw(grad)
    for i in range(size):
        f = i / size
        r = int(bg[0] * (1 - f*0.25) + 255 * f*0.05)
        g = int(bg[1] * (1 - f*0.25))
        b = int(bg[2] * (1 - f*0.25) + 80 * f*0.25)
        gd.line([(0, i), (size, i)], fill=(r, g, b))
    mask = rounded_rect_mask(size, int(size * 0.22))
    img.paste(grad, (0, 0), mask)

    # heart
    pts = heart_path(size/2, size/2 + size*0.03, size * 0.68)
    draw.polygon(pts, fill=fg)
    return img

for s in [180, 192, 512]:
    img = make_icon(s)
    img.save(os.path.join(OUT, f"icon-{s}.png"))
    print("wrote", f"icon-{s}.png")

# maskable (padded)
img = Image.new("RGBA", (512, 512), (255, 67, 94, 255))
inner = make_icon(384)
img.paste(inner, (64, 64), inner)
img.save(os.path.join(OUT, "icon-maskable-512.png"))
print("wrote icon-maskable-512.png")

# favicon
make_icon(64).save(os.path.join(OUT, "favicon.png"))
print("wrote favicon.png")
