#!/usr/bin/env bash
# Expose local web UI to the internet (phone on cellular, etc.)
set -euo pipefail
PORT="${PORT:-3000}"
echo "Tunnel → http://localhost:${PORT}"
echo "Start the app first: npm run web"
echo ""
exec npx --yes cloudflared tunnel --url "http://127.0.0.1:${PORT}"
