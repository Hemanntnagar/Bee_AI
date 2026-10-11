# Bee Loop

**Study + Commitment Companion** — turns real Bee wearable conversations into spaced-repetition study cards and actionable todos, wired through the [Bee CLI](https://docs.bee.computer/docs/cli) local proxy.

## What it does

1. **Education** — Process a captured lecture or study conversation into a study brief and Q/A cards, then review with lightweight spaced repetition.
2. **Productivity** — Surface commitments from conversations, merge with Bee todos and suggestions, and push confirmed items back to Bee.

## Prerequisites

- Node.js 18+
- Bee iOS app with **Developer Mode** (tap app version in settings)
- `@beeai/cli` authenticated on this machine

Quick setup:

```bash
npm run setup:bee
```

## Run (real Bee data)

Terminal 1 — API bridge (keep running):

```bash
bee login --no-wait   # if not authenticated
bee status
bee proxy             # http://127.0.0.1:8787
```

Terminal 2 — Bee Loop:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Offline / fixtures mode

```bash
BEE_MOCK=1 npm run dev
```

Uses sample conversations and todos so you can develop UI without Bee connected.

## Optional: agents

```bash
npx skills add bee-computer/bee-skill
bee mcp serve
```

This repo includes [`.cursor/skills/bee-loop/SKILL.md`](.cursor/skills/bee-loop/SKILL.md) for Cursor workflows on top of Bee CLI.

## Demo script

1. Authenticate Bee CLI; start `bee proxy` and `npm run dev`.
2. Capture a short study conversation and a verbal commitment on Bee.
3. Open Bee Loop — your profile and new conversation appear.
4. **Process** the conversation → study cards + commitments.
5. **Review** a few cards; **push** a todo to Bee; confirm in `bee todos list` or the Bee app.

## Privacy

Bee data is highly sensitive. The proxy must stay on `127.0.0.1` only — never expose it to the internet. Local generated state lives in `.bee-loop/` (gitignored). Do not commit transcripts or `.env` files.

## Environment

| Variable | Description |
|----------|-------------|
| `BEE_PROXY_URL` | Default `http://127.0.0.1:8787` |
| `BEE_MOCK` | Set to `1` for fixtures |
| `OPENAI_API_KEY` | Optional; improves card/commitment extraction |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible API base |

## License

MIT
