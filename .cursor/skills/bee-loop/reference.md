# Bee Loop — Reference

## Bee Loop HTTP (localhost:3000)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Proxy/mock status + user |
| GET | `/api/today` | Conversations, open todos, suggestions, due cards |
| GET | `/api/search?q=` | Search conversations (`mode=neural` optional) |
| GET | `/api/conversations/:id` | One conversation |
| POST | `/api/conversations/:id/process` | Extract study pack + commitments |
| POST | `/api/cards/save` | Replace cards for conversation + mark processed |
| GET/POST | `/api/review` | List due cards / grade (`again`\|`hard`\|`good`) |
| GET/POST/PATCH | `/api/todos` | List / create / complete Bee todos |
| GET/POST | `/api/suggestions` | List / accept\|dismiss Bee suggestions |
| GET/POST/PATCH | `/api/commitments/local` | Local extracted commitments |

Env: `BEE_PROXY_URL` (default `http://127.0.0.1:8787`), `BEE_MOCK=1`, optional `OPENAI_API_KEY`.

## Bee CLI (selected)

```bash
bee login | status | me
bee proxy                          # local /v1 API
bee now --json                     # last ~10h conversations
bee conversations list --json
bee conversations get <id> --json
bee search --query "lecture" --json
bee todos list|create|complete --json
bee todos suggestions --json
bee mcp connect claude-code
bee mcp serve                      # stdio
bee mcp serve-http --token <32+>   # localhost HTTP MCP
```

## Bee MCP tools (when connected)

Read: `bee_status`, `bee_search`, `bee_list_conversations`, `bee_get_conversation`, `bee_get_conversation_transcript`, `bee_get_today`, `bee_list_todos`, `bee_get_todo_suggestions`, `bee_list_facts`, `bee_get_daily_summary`, …

Write: `bee_create_todo`, `bee_complete_todo`, `bee_accept_todo_suggestion`, `bee_dismiss_todo_suggestion`, `bee_create_fact`, …

Docs: https://docs.bee.computer/docs/mcp

## Local state

`.bee-loop/store.json` — study cards (SM-2), local commitments, processed conversation ids. Gitignored.
