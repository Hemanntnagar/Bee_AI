#!/usr/bin/env bash
# Bee Loop — Bee CLI install, login, and smoke checks
set -euo pipefail

echo "==> Bee Loop setup"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install from https://nodejs.org and re-run."
  exit 1
fi

if ! command -v bee >/dev/null 2>&1; then
  echo "Installing @beeai/cli globally..."
  npm install -g @beeai/cli
else
  echo "Bee CLI found: $(bee --version 2>/dev/null || echo unknown)"
fi

echo ""
echo "1) Open the Bee iOS app and enable Developer Mode (tap the app version)."
echo "2) Authenticate the CLI (non-blocking):"
echo ""
echo "     bee login --no-wait"
echo ""
echo "   Open the printed https://bee.computer/connect#... link, approve,"
echo "   then confirm with: bee status"
echo ""

if bee status >/dev/null 2>&1; then
  echo "Bee status: authenticated"
  bee me 2>/dev/null || true
else
  echo "Bee status: not authenticated yet — run bee login --no-wait above."
fi

echo ""
echo "Smoke checks (after login):"
echo "  bee me"
echo "  bee now --json"
echo "  bee todos list --json"
echo ""
echo "Start the local API bridge (keep this running):"
echo "  bee proxy"
echo "  # listens on http://127.0.0.1:8787 by default"
echo ""
echo "Then start Bee Loop:"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "Optional — agent integrations:"
echo "  npx skills add bee-computer/bee-skill"
echo "  bee mcp serve          # stdio MCP for Cursor / Claude / Codex"
echo ""
echo "Offline UI development without Bee:"
echo "  BEE_MOCK=1 npm run dev"
echo ""
echo "Done. Docs: https://docs.bee.computer/"
