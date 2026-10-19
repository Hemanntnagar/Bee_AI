---
name: bee-loop
description: >-
  Turns Bee wearable conversations into study flashcards and Bee todos via the
  Bee Loop app (CLI proxy, local APIs, MCP). Use when the user mentions Bee Loop,
  study cards, spaced repetition, process a lecture/conversation, review deck,
  push commitments, Bee MCP, bee proxy, or personal productivity from Bee memory.
---

# Bee Loop — Agent Skill

Bee Loop is a local Next.js app that reads **real Bee wearable data** through the Bee CLI proxy and turns conversations into study cards + commitments.

Prefer **Bee MCP tools** when connected; otherwise use **Bee CLI** or **Bee Loop HTTP APIs** (app must be running).

## Prerequisites

```bash
bee status                    # must be authenticated
bee proxy                     # http://127.0.0.1:8787 — keep running
# optional MCP:
bee mcp connect claude-code   # or: claude | codex
bee mcp status
# Bee Loop app:
npm run dev                   # http://localhost:3000
# fixtures without hardware:
BEE_MOCK=1 npm run dev
```

Install upstream Bee skill for general memory: `npx skills add bee-computer/bee-skill`

## Privacy

- Never expose `bee proxy` beyond `127.0.0.1`
- Do not commit `.bee-loop/`, transcripts, or tokens
- Prefer summarizing over pasting full transcripts into chat logs

## Workflows

### 1) Status check

```bash
npm run agent:status
# or
curl -s http://localhost:3000/api/health
bee status
```

Report: mock vs live, user name, proxy reachability.

### 2) Process latest (or search) conversation into a study pack

1. Find a conversation:
   - MCP: `bee_list_conversations` / `bee_search` with query like `lecture` or `class`
   - CLI: `bee conversations list --json` / `bee search --query "lecture" --json`
   - App: `curl -s 'http://localhost:3000/api/search?q=lecture'`
2. Process via Bee Loop (extracts cards + commitments):

```bash
CONV_ID=<id>
curl -s -X POST "http://localhost:3000/api/conversations/$CONV_ID/process"
```

3. Show the user the title, key concepts, card fronts, and commitment texts.
4. After they confirm, save cards:

```bash
# body: { "conversationId", "cards": [{ "front", "back", "sourceSnippet?", "conversationId" }] }
curl -s -X POST http://localhost:3000/api/cards/save \
  -H 'Content-Type: application/json' \
  -d @- <<'EOF'
{ ... }
EOF
```

5. Optionally save local commitments: `POST /api/commitments/local` with `{ conversationId, items: [{ text }] }`.

Helper (when app is up):

```bash
npm run agent:process -- --latest
npm run agent:process -- --id <conversationId>
npm run agent:process -- --query "office hours"
```

### 3) What's due for review?

```bash
curl -s http://localhost:3000/api/review
# or
npm run agent:due
```

Summarize count of due cards and sample fronts. Link user to `http://localhost:3000/review`.

To grade a card after the user answers:

```bash
curl -s -X POST http://localhost:3000/api/review \
  -H 'Content-Type: application/json' \
  -d '{"cardId":"<id>","grade":"good"}'   # again | hard | good
```

### 4) Push a commitment to Bee

Prefer Bee MCP/CLI when available:

- MCP: `bee_create_todo` with text
- CLI: `bee todos create --text "Send notes by Friday" --json`

Or via Bee Loop (also works in mock mode):

```bash
curl -s -X POST http://localhost:3000/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"text":"Send notes by Friday"}'
```

If pushing a saved local commitment, mark it:

```bash
curl -s -X PATCH http://localhost:3000/api/commitments/local \
  -H 'Content-Type: application/json' \
  -d '{"id":"<localId>","pushed":true,"beeTodoId":"<todoId>"}'
```

Helper:

```bash
npm run agent:push-todo -- "Send Krebs notes to study group by Friday"
```

### 5) Today brief for the user

```bash
curl -s http://localhost:3000/api/today
# or MCP: bee_get_today / bee_list_todos / bee_get_todo_suggestions
```

Summarize: recent conversations, open todos, Bee suggestions, due card count.

## MCP vs Bee Loop

| Goal | Prefer |
|------|--------|
| Read Bee memory (facts, now, search) | Bee MCP / `bee` CLI |
| Extract study cards + SM-2 deck | Bee Loop `/api/conversations/:id/process` + `/api/cards/save` |
| Review/schedule cards | Bee Loop `/api/review` |
| Create/complete todos | Either (MCP/CLI or `/api/todos`) |

## Demo phrases to handle

- "Process my latest lecture into flashcards"
- "What study cards are due?"
- "Push that commitment to Bee"
- "Find office hours conversations and make a study pack"
- "What's on my Bee Loop today board?"

See [reference.md](reference.md) for endpoint and MCP tool catalogs.
