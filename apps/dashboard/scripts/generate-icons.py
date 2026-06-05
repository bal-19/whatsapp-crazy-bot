#!/usr/bin/env python3

"""
Script untuk generate PWA icons dari SVG
Requirements: pip install pillow cairosvg

Usage: python3 generate-icons.py
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
    import cairosvg
except ImportError:
    print("❌ Dependencies tidak terinstall")
    print("Install dengan: pip install pillow cairosvg")
    sys.exit(1)


def get_public_dir():
    """Get public directory path"""
    script_dir = Path(__file__).parent
    return script_dir.parent / "public"


def generate_icon(svg_path: Path, output_path: Path, width: int, height: int):
    """Generate PNG dari SVG"""
    if not svg_path.exists():
        print(f"  ⚠️  {svg_path.name} tidak ditemukan")
        return False

    try:
        cairosvg.svg2png(
            url=str(svg_path),
            write_to=str(output_path),
            output_width=width,
            output_height=height,
        )
        print(f"  ✅ {output_path.name} ({width}x{height})")
        return True
    except Exception as e:
        print(f"  ❌ Error generating {output_path.name}: {e}")
        return False


def generate_favicon_ico(svg_path: Path, output_path: Path):
    """Generate favicon.ico dari SVG"""
    if not svg_path.exists():
        print(f"  ⚠️  {svg_path.name} tidak ditemukan")
        return False

    try:
        # Generate 32x32 dan 16x16 untuk favicon
        temp_32 = output_path.parent / "favicon-temp-32.png"
        temp_16 = output_path.parent / "favicon-temp-16.png"

        cairosvg.svg2png(
            url=str(svg_path), write_to=str(temp_32), output_width=32, output_height=32
        )
        cairosvg.svg2png(
            url=str(svg_path), write_to=str(temp_16), output_width=16, output_height=16
        )

        # Create ICO from PNGs
        img_32 = Image.open(temp_32)
        img_16 = Image.open(temp_16)
        img_32.save(output_path, format="ICO", sizes=[(32, 32), (16, 16)])

        # Cleanup temp files
        temp_32.unlink()
        temp_16.unlink()

        print(f"  ✅ {output_path.name} (32x32, 16x16)")
        return True
    except Exception as e:
        print(f"  ❌ Error generating favicon: {e}")
        return False


def main():
    """Main function"""
    public_dir = get_public_dir()

    if not public_dir.exists():
        print(f"❌ Directory tidak ditemukan: {public_dir}")
        sys.exit(1)

    print("🎨 Generating PWA Icons...")
    print(f"📁 Working directory: {public_dir}")
    print()

    icon_svg = public_dir / "icon.svg"
    success_count = 0

    # PWA Icons
    print("✏️  Generating PWA icons...")
    success_count += generate_icon(icon_svg, public_dir / "pwa-192x192.png", 192, 192)
    success_count += generate_icon(icon_svg, public_dir / "pwa-512x512.png", 512, 512)

    # Maskable Icons
    print("✏️  Generating maskable icons...")
    success_count += generate_icon(
        icon_svg, public_dir / "pwa-192x192-maskable.png", 192, 192
    )
    success_count += generate_icon(
        icon_svg, public_dir / "pwa-512x512-maskable.png", 512, 512
    )

    # Shortcut Icons
    print("✏️  Generating shortcut icons...")
    for icon_type in ["conversations", "analytics", "config"]:
        svg_file = public_dir / f"icon-{icon_type}.svg"
        png_file = public_dir / f"icon-{icon_type}.png"
        success_count += generate_icon(svg_file, png_file, 192, 192)

    # Favicon
    print("✏️  Generating favicon...")
    success_count += generate_favicon_ico(icon_svg, public_dir / "favicon.ico")
    success_count += generate_icon(icon_svg, public_dir / "favicon-32x32.png", 32, 32)
    success_count += generate_icon(icon_svg, public_dir / "favicon-16x16.png", 16, 16)

    # Apple Touch Icon
    print("✏️  Generating Apple touch icon...")
    success_count += generate_icon(
        icon_svg, public_dir / "apple-touch-icon.png", 180, 180
    )

    print()
    if success_count > 0:
        print("✨ Icons berhasil di-generate!")
        print()
        print("Generated files:")
        for file in sorted(public_dir.glob("*.png")) + sorted(public_dir.glob("*.ico")):
            size = file.stat().st_size
            size_kb = size / 1024
            print(f"  {file.name:40} ({size_kb:.1f}KB)")
        print()
        print("🚀 Aplikasi siap untuk PWA installation")
    else:
        print("❌ Gagal generate icons")
        sys.exit(1)


if __name__ == "__main__":
    main()
