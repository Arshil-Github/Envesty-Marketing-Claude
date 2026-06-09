#!/bin/zsh
# Envesty — local launcher
# Boots Express API (:4001) + Vite dev server (:5273), then opens the browser.

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/tools/web-app"

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run only)..."
  npm install
fi

echo ""
echo "  Envesty — local"
echo "  API:  http://localhost:4001/api/health"
echo "  Web:  http://localhost:5273"
echo ""

(sleep 3 && open "http://localhost:5273") &
npm run dev
