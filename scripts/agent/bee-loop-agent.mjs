#!/usr/bin/env node
/**
 * Agent-friendly CLI for Bee Loop local APIs.
 * Usage:
 *   node scripts/agent/bee-loop-agent.mjs status
 *   node scripts/agent/bee-loop-agent.mjs due
 *   node scripts/agent/bee-loop-agent.mjs today
 *   node scripts/agent/bee-loop-agent.mjs process --latest
 *   node scripts/agent/bee-loop-agent.mjs process --id <id>
 *   node scripts/agent/bee-loop-agent.mjs process --query "lecture"
 *   node scripts/agent/bee-loop-agent.mjs push-todo -- "text here"
 *   node scripts/agent/bee-loop-agent.mjs search --query "office hours"
 */

const BASE = (process.env.BEE_LOOP_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);

async function api(path, init) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(
      json?.error ?? `HTTP ${res.status} ${path}`
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function print(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      out._.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    } else out._.push(a);
  }
  return out;
}

async function cmdStatus() {
  const health = await api("/api/health");
  print({
    beeLoop: BASE,
    ...health,
    hint: health.ok
      ? "Ready"
      : "Start bee proxy and npm run dev (or BEE_MOCK=1 npm run dev)",
  });
}

async function cmdToday() {
  const today = await api("/api/today");
  print({
    user: today.user?.name,
    conversations: (today.conversations ?? []).slice(0, 8).map((c) => ({
      id: c.id,
      summary: c.summary ?? c.title,
      startedAt: c.startedAt,
    })),
    openTodos: (today.openTodos ?? []).map((t) => t.text),
    suggestions: (today.suggestions ?? []).map((s) => ({
      id: s.id,
      text: s.text,
    })),
    dueCount: (today.dueCards ?? []).length,
    processed: today.processedConversationIds?.length ?? 0,
  });
}

async function cmdDue() {
  const data = await api("/api/review");
  print({
    dueCount: (data.due ?? []).length,
    total: data.total,
    due: (data.due ?? []).slice(0, 10).map((c) => ({
      id: c.id,
      front: c.front,
      conversationId: c.conversationId,
    })),
  });
}

async function cmdSearch(args) {
  const q = args.query ?? args.q ?? args._[0];
  if (!q) throw new Error("Usage: search --query <text>");
  const data = await api(`/api/search?q=${encodeURIComponent(q)}&limit=15`);
  print({
    query: data.query,
    hits: (data.hits ?? []).map((h) => ({
      id: h.conversation?.id,
      summary: h.conversation?.summary ?? h.conversation?.title,
    })),
  });
}

async function resolveConversationId(args) {
  if (args.id) return String(args.id);
  if (args.query || args.q) {
    const q = args.query ?? args.q;
    const data = await api(`/api/search?q=${encodeURIComponent(q)}&limit=5`);
    const id = data.hits?.[0]?.conversation?.id;
    if (!id) throw new Error(`No conversation matched query: ${q}`);
    return String(id);
  }
  if (args.latest) {
    const today = await api("/api/today");
    const id = today.conversations?.[0]?.id;
    if (!id) throw new Error("No conversations available");
    return String(id);
  }
  throw new Error("Usage: process --latest | --id <id> | --query <text>");
}

async function cmdProcess(args) {
  const id = await resolveConversationId(args);
  const processed = await api(`/api/conversations/${id}/process`, {
    method: "POST",
  });
  const save = args.save === true || args.save === "true";
  let saved = null;
  if (save && processed.studyPack?.cards?.length) {
    saved = await api("/api/cards/save", {
      method: "POST",
      body: JSON.stringify({
        conversationId: id,
        cards: processed.studyPack.cards,
      }),
    });
    if (processed.commitments?.length) {
      await api("/api/commitments/local", {
        method: "POST",
        body: JSON.stringify({
          conversationId: id,
          items: processed.commitments.map((c) => ({ text: c.text })),
        }),
      });
    }
  }
  print({
    conversationId: id,
    title: processed.studyPack?.title,
    keyConcepts: processed.studyPack?.keyConcepts,
    cards: (processed.studyPack?.cards ?? []).map((c) => ({
      front: c.front,
      back: c.back,
    })),
    commitments: processed.commitments ?? [],
    saved,
    next: save
      ? "Cards saved. Open /review or run: npm run agent:due"
      : "Review output, then re-run with --save to persist cards",
  });
}

async function cmdPushTodo(args) {
  const text = args._.join(" ").trim() || args.text;
  if (!text) throw new Error('Usage: push-todo -- "Todo text"');
  const data = await api("/api/todos", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  print({ pushed: true, todo: data.todo });
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  try {
    switch (cmd) {
      case "status":
        await cmdStatus();
        break;
      case "today":
        await cmdToday();
        break;
      case "due":
        await cmdDue();
        break;
      case "search":
        await cmdSearch(args);
        break;
      case "process":
        await cmdProcess(args);
        break;
      case "push-todo":
        await cmdPushTodo(args);
        break;
      case "help":
      case undefined:
        console.log(`Bee Loop agent CLI (${BASE})

Commands:
  status
  today
  due
  search --query <text>
  process --latest | --id <id> | --query <text> [--save]
  push-todo -- "<text>"

Env: BEE_LOOP_URL (default http://127.0.0.1:3000)
`);
        break;
      default:
        throw new Error(`Unknown command: ${cmd}`);
    }
  } catch (e) {
    console.error(
      JSON.stringify(
        {
          error: e instanceof Error ? e.message : String(e),
          beeLoop: BASE,
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

main();
