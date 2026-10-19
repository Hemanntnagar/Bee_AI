#!/usr/bin/env bash
# Bee Loop — one-command demo launcher (fixtures by default)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-mock}" # mock | live | reset | reset-seed

print_script() {
  cat <<'EOF'

═══════════════════════════════════════════════════════════
  Bee Loop — 2-minute demo script
═══════════════════════════════════════════════════════════

  FIXTURES (no hardware)
  1. Open http://localhost:3000
  2. Click search chip: lecture  →  open CS 101 lecture
  3. Extract study pack + commitments  →  Save
  4. Review  →  grade Again / Hard / Good
  5. Today: Accept a Bee suggestion  OR  Push to Bee from inbox
  6. (Optional) Ask Cursor: "Process my latest lecture into flashcards"

  LIVE BEE
  1. bee login && bee proxy   (Terminal 1)
  2. Capture a short study talk + "I'll … by Friday"
  3. Home auto-refreshes every 20s — open the new conversation
  4. Same process → save → review → push
  5. Confirm: bee todos list

  Screen recording tip: keep Terminal (proxy) + browser side-by-side;
  narrate: capture → appear → cards → Bee todo.

═══════════════════════════════════════════════════════════
EOF
}

case "$MODE" in
  reset)
    node scripts/reset-local.mjs
    print_script
    ;;
  reset-seed)
    node scripts/reset-local.mjs --seed
    print_script
    ;;
  live)
    print_script
    echo "Checking Bee CLI…"
    if ! command -v bee >/dev/null 2>&1; then
      echo "Bee CLI missing. Run: npm run setup:bee"
      exit 1
    fi
    if ! bee status >/dev/null 2>&1; then
      echo "Not logged in. Run: bee login"
      exit 1
    fi
    echo "Start proxy in another terminal:  bee proxy"
    echo "Starting Bee Loop against live proxy…"
    echo ""
    exec npm run dev
    ;;
  mock|*)
    node scripts/reset-local.mjs --seed
    print_script
    echo "Starting fixtures mode (BEE_MOCK=1)…"
    echo "  Open http://localhost:3000  ·  Demo guide: /demo"
    echo ""
    export BEE_MOCK=1
    exec npm run dev
    ;;
esac
