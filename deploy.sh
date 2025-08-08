#!/bin/bash
set -e

echo "🛠 Building Hugo blog..."
cd article
hugo
cd ..

echo "🗑 Clearing old /articles..."
rm -rf articles
mkdir -p articles

echo "📂 Copying new build..."
cp -r article/public/* articles/

echo "✅ Blog copied to /articles."

# Optional: auto-commit and push
git add articles
git commit -m "Update blog"
git push

echo "🚀 Deployment triggered. Remember to purge Cloudflare cache if needed."
