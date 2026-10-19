# Bee Loop

**Study + Commitment Companion** — turns real Bee wearable conversations into spaced-repetition study cards and actionable todos, wired through the [Bee CLI](https://docs.bee.computer/docs/cli) local proxy.

## What it does

1. **Education** — Process a captured lecture or study conversation into a study brief and Q/A cards, then review with lightweight spaced repetition.
2. **Productivity** — Surface commitments from conversations, merge with Bee todos and suggestions, and push confirmed items back to Bee.

## Quick demo (2 minutes)

Fixtures (no Bee hardware):

```bash
npm install
npm run demo
```

Opens fixtures mode, seeds 2 due cards + 1 commitment, prints the walkthrough. Then open [http://localhost:3000](http://localhost:3000) or the in-app [Demo guide](http://localhost:3000/demo).

| Command | Purpose |
|---------|---------|
| `npm run demo` | Reset+seed fixtures, start `BEE_MOCK=1` dev server |
| `npm run demo:live` | Print live script; start app against `bee proxy` |
| `npm run demo:reset` | Clear `.bee-loop/` only |
| `npm run demo:seed` | Clear and seed lecture cards for instant Review |

### Demo walkthrough

1. **Today** — conversations, suggestions, due count (auto-refresh every 20s when live).
2. Search chip **lecture** → open **CS 101 lecture**.
3. **Extract** → **Save cards + commitments**.
4. **Review** — grade a couple of cards.
5. **Accept** a Bee suggestion or **Push to Bee** from the inbox.
6. Optional agent: *“Process my latest lecture into flashcards.”*

### Screen recording (~2 min)

| Time | Shot |
|------|------|
| 0:00 | Title card: Bee Loop |
| 0:10 | Terminal: `bee proxy` *or* say “fixtures mode” |
| 0:25 | Home + search **lecture** |
| 0:50 | Process → study pack + commitment |
| 1:20 | Save → Review two cards |
| 1:40 | Push / Accept → inbox |
| 2:00 | End: real Bee data · localhost only · MCP optional |

Keep terminal + browser side-by-side. Narrate: *capture → appear → cards → Bee todo*.

## Prerequisites (live Bee)

- Node.js 18+
- Bee iOS / Watch app with **Developer Mode** (tap app version in Settings)
- `@beeai/cli` authenticated: `npm run setup:bee`

## Run (real Bee data)

Terminal 1:

```bash
bee login --no-wait
bee status
bee proxy             # http://127.0.0.1:8787
```

Terminal 2:

```bash
npm run demo:live
# or: npm run dev
```

## Agents (MCP + Skill)

```bash
npx skills add bee-computer/bee-skill
bee mcp connect claude-code   # or: claude | codex
bee mcp status
```

Project skill: [`.cursor/skills/bee-loop/SKILL.md`](.cursor/skills/bee-loop/SKILL.md)

```bash
npm run agent:status
npm run agent:process -- --query lecture --save
npm run agent:due
npm run agent:push-todo -- "Send notes by Friday"
```

## Privacy checklist

- [ ] `bee proxy` stays on **127.0.0.1** — never expose or tunnel publicly ([API docs](https://docs.bee.computer/docs/api))
- [ ] `.bee-loop/` is gitignored (local cards / commitments)
- [ ] No `.env`, transcripts, or `bee-sync/` exports in git
- [ ] Prefer summarizing Bee memory in public demos; don’t paste full transcripts
- [ ] MCP `serve-http` (if used) requires a ≥32-char bearer token on localhost

Copy [`.env.example`](.env.example) → `.env.local` for optional keys. Never commit secrets.

## Environment

| Variable | Description |
|----------|-------------|
| `BEE_PROXY_URL` | Default `http://127.0.0.1:8787` |
| `BEE_MOCK` | `1` for fixtures |
| `BEE_LOOP_URL` | Agent CLI base (default `http://127.0.0.1:3000`) |
| `OPENAI_API_KEY` | Optional; better card/commitment extraction |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible API base |

## License

MIT
