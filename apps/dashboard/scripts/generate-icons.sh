#!/bin/bash

# Script untuk generate PWA icons dari SVG
# Requirements: ImageMagick (brew install imagemagick)

set -e

echo "🎨 Generating PWA Icons..."

PUBLIC_DIR="$(cd "$(dirname "$0")/../public" && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Check if ImageMagick installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick tidak terinstall"
    echo "Install dengan: brew install imagemagick"
    exit 1
fi

# Check if SVG files exist
if [ ! -f "$PUBLIC_DIR/icon.svg" ]; then
    echo "❌ File icon.svg tidak ditemukan di $PUBLIC_DIR"
    exit 1
fi

echo "📁 Working directory: $PUBLIC_DIR"

# Generate PWA icons
echo "✏️  Generating PWA icons (192x192, 512x512)..."
convert "$PUBLIC_DIR/icon.svg" -resize 192x192 "$PUBLIC_DIR/pwa-192x192.png"
convert "$PUBLIC_DIR/icon.svg" -resize 512x512 "$PUBLIC_DIR/pwa-512x512.png"
echo "✅ PWA icons generated"

# Generate maskable icons (untuk adaptive)
echo "✏️  Generating maskable icons..."
convert "$PUBLIC_DIR/icon.svg" -resize 192x192 "$PUBLIC_DIR/pwa-192x192-maskable.png"
convert "$PUBLIC_DIR/icon.svg" -resize 512x512 "$PUBLIC_DIR/pwa-512x512-maskable.png"
echo "✅ Maskable icons generated"

# Generate shortcut icons
echo "✏️  Generating shortcut icons..."
for icon in conversations analytics config; do
    if [ -f "$PUBLIC_DIR/icon-$icon.svg" ]; then
        convert "$PUBLIC_DIR/icon-$icon.svg" -resize 192x192 "$PUBLIC_DIR/icon-$icon.png"
        echo "✅ icon-$icon.png generated"
    fi
done

# Generate favicon
echo "✏️  Generating favicon..."
convert "$PUBLIC_DIR/icon.svg" -define icon:auto-resize=32,16 "$PUBLIC_DIR/favicon.ico"
convert "$PUBLIC_DIR/icon.svg" -resize 32x32 "$PUBLIC_DIR/favicon-32x32.png"
convert "$PUBLIC_DIR/icon.svg" -resize 16x16 "$PUBLIC_DIR/favicon-16x16.png"
echo "✅ Favicon generated"

# Generate apple touch icon
echo "✏️  Generating Apple touch icon..."
convert "$PUBLIC_DIR/icon.svg" -resize 180x180 "$PUBLIC_DIR/apple-touch-icon.png"
echo "✅ Apple touch icon generated"

echo ""
echo "✨ Semua icons berhasil di-generate!"
echo ""
echo "Generated files:"
ls -lh "$PUBLIC_DIR"/*.png "$PUBLIC_DIR"/*.ico 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "🚀 Aplikasi siap untuk PWA installation"
