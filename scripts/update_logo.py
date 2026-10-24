#!/usr/bin/env python3
"""
LTMsav logo updater — ONE source of truth.

Usage:
    python3 scripts/update_logo.py <path-to-logo-image>

What it does:
  1. Copies your image verbatim to  assets/logo-source.<ext>   (100% unchanged, master copy)
  2. Regenerates every app icon from it:
       public/pwa-192x192.png, pwa-512x512.png, pwa-maskable-512x512.png,
       public/apple-touch-icon.png, public/favicon.ico, public/icon.png,
       public/logo.png  (used inline in the UI header / splash)
  3. Regenerates Android launcher icons:
       mipmap-*/ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png
  4. Writes android/app/src/main/res/values/ic_launcher_background.xml from the
     image's corner colour.

The image is NEVER cropped or redrawn — it is only scaled/composited onto the
required canvas sizes. To update the logo on a future release you only need to:
    python3 scripts/update_logo.py /path/to/new-logo.png
  then rebuild (npm run build && cap sync && gradle assembleRelease).
"""
import os
import shutil
import sys

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is required. Install with: pip install pillow")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
ASSETS = os.path.join(ROOT, "assets")
ANDROID_RES = os.path.join(ROOT, "mobile", "android", "app", "src", "main", "res")

# Android mipmap densities -> launcher icon px size
MIPMAPS = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def load_source(path: str) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    side = max(im.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    return canvas


def save_png(im: Image.Image, path: str, size: int):
    im.resize((size, size), Image.LANCZOS).save(path, "PNG", optimize=True)
    print("  ", os.path.relpath(path, ROOT), f"{size}x{size}")


def corner_color(im: Image.Image):
    px = im.convert("RGB").resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    return "#{:02X}{:02X}{:02X}".format(*px)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = sys.argv[1]
    if not os.path.isfile(src):
        print(f"ERROR: file not found: {src}")
        sys.exit(1)

    os.makedirs(ASSETS, exist_ok=True)
    ext = os.path.splitext(src)[1].lower() or ".png"
    master = os.path.join(ASSETS, f"logo-source{ext}")
    if os.path.realpath(src) != os.path.realpath(master):
        shutil.copy2(src, master)
    print(f"Master logo saved verbatim -> {os.path.relpath(master, ROOT)}")

    im = load_source(master)
    bg = corner_color(im)

    print("Web / PWA icons:")
    save_png(im, os.path.join(PUBLIC, "pwa-192x192.png"), 192)
    save_png(im, os.path.join(PUBLIC, "pwa-512x512.png"), 512)
    save_png(im, os.path.join(PUBLIC, "pwa-maskable-512x512.png"), 512)
    save_png(im, os.path.join(PUBLIC, "apple-touch-icon.png"), 180)
    save_png(im, os.path.join(PUBLIC, "logo.png"), 512)
    save_png(im, os.path.join(PUBLIC, "icon.png"), 512)

    # favicon.ico (multi-size)
    ico = im.convert("RGBA")
    ico.save(os.path.join(PUBLIC, "favicon.ico"),
             sizes=[(16, 16), (32, 32), (48, 48)])
    print("   public/favicon.ico")

    print("Android launcher icons:")
    for folder, size in MIPMAPS.items():
        d = os.path.join(ANDROID_RES, folder)
        if not os.path.isdir(d):
            continue
        save_png(im, os.path.join(d, "ic_launcher.png"), size)
        save_png(im, os.path.join(d, "ic_launcher_round.png"), size)
        # adaptive foreground: image at ~66% inside transparent canvas
        inner = int(size * 0.66)
        fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        scaled = im.resize((inner, inner), Image.LANCZOS)
        off = (size - inner) // 2
        fg.paste(scaled, (off, off), scaled)
        fg.save(os.path.join(d, "ic_launcher_foreground.png"), "PNG", optimize=True)

    bg_xml = os.path.join(ANDROID_RES, "values", "ic_launcher_background.xml")
    if os.path.isdir(os.path.dirname(bg_xml)):
        with open(bg_xml, "w") as f:
            f.write('<?xml version="1.0" encoding="utf-8"?>\n')
            f.write('<resources>\n')
            f.write(f'    <color name="ic_launcher_background">{bg}</color>\n')
            f.write('</resources>\n')
        print(f"   ic_launcher_background.xml -> {bg}")

    print("\nDone. Now rebuild:")
    print("   npm run build && cd mobile && npx cap sync android")
    print("   cd android && ./gradlew assembleRelease bundleRelease")


if __name__ == "__main__":
    main()
