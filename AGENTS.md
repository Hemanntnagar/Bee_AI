# AGENTS.md — Bee Loop

## Product

Bee Loop turns Bee wearable conversations into spaced-repetition study cards and Bee todos. Data path: Bee device → Bee cloud → `bee proxy` (`127.0.0.1:8787`) → Next.js APIs → UI / agent CLI.

## Do

- Prefer localhost Bee proxy; never expose it publicly
- Keep transcripts out of git (`.bee-loop/` is gitignored)
- Use fixtures with `BEE_MOCK=1` when Bee isn’t connected
- For agent workflows, follow `.cursor/skills/bee-loop/SKILL.md`

## Agent entrypoints

| Task | Command / tool |
|------|----------------|
| Health | `npm run agent:status` or Bee MCP `bee_status` |
| Today board | `npm run agent:today` |
| Search | `npm run agent:search -- --query lecture` or MCP `bee_search` |
| Study pack | `npm run agent:process -- --latest [--save]` |
| Due cards | `npm run agent:due` |
| Push todo | `npm run agent:push-todo -- "…"` or MCP `bee_create_todo` |

App base URL: `BEE_LOOP_URL` (default `http://127.0.0.1:3000`).

## Demo

```bash
npm run demo          # fixtures + seed + print script
npm run demo:live     # against bee proxy
npm run demo:reset    # clear .bee-loop
```

In-app: `/demo` (walkthrough, recording shot list, privacy checklist).

## Stack notes

- Next.js 15 App Router; extraction in `lib/extract/*`; SM-2 in `lib/review/sm2.ts`
- Optional `OPENAI_API_KEY` improves extraction; heuristics always available
- Never commit `.bee-loop/`, `.env*`, or transcripts
