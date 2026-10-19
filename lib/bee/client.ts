import {
  mockConversations,
  mockTodoSuggestions,
  mockTodos,
  mockUser,
} from "./fixtures";
import type {
  BeeConversation,
  BeeTodo,
  BeeTodoSuggestion,
  BeeUser,
  BeeUtterance,
  ListResponse,
  SearchHit,
} from "./types";

const DEFAULT_PROXY = "http://127.0.0.1:8787";

export function isMockMode(): boolean {
  // Explicit off wins (local live proxy against a Vercel-like env).
  if (process.env.BEE_MOCK === "0" || process.env.BEE_MOCK === "false") {
    return false;
  }
  // Fixtures on Vercel by default — Bee proxy is localhost-only.
  if (process.env.BEE_MOCK === "1" || process.env.BEE_MOCK === "true") {
    return true;
  }
  return process.env.VERCEL === "1";
}

function proxyBase(): string {
  return (process.env.BEE_PROXY_URL ?? DEFAULT_PROXY).replace(/\/$/, "");
}

async function beeFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${proxyBase()}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (e) {
    const hint =
      e instanceof Error && /fetch failed|ECONNREFUSED|network/i.test(e.message)
        ? ` Cannot reach Bee proxy at ${proxyBase()}. Run: bee login && bee proxy`
        : "";
    throw new Error(
      `Bee proxy unreachable.${hint}${e instanceof Error ? ` (${e.message})` : ""}`
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Bee proxy ${res.status}: ${body.slice(0, 200)}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function checkBeeHealth(): Promise<{
  ok: boolean;
  mock: boolean;
  user?: BeeUser;
  error?: string;
}> {
  if (isMockMode()) {
    return { ok: true, mock: true, user: mockUser };
  }
  try {
    const user = await beeFetch<BeeUser>("/v1/me");
    return { ok: true, mock: false, user };
  } catch (e) {
    return {
      ok: false,
      mock: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function getMe(): Promise<BeeUser> {
  if (isMockMode()) return mockUser;
  return beeFetch<BeeUser>("/v1/me");
}

function toEpochMs(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

/** Normalize Bee API / mock conversation shapes into one client model. */
export function normalizeConversation(raw: BeeConversation): BeeConversation {
  const utterances: BeeUtterance[] = [...(raw.utterances ?? [])];

  for (const block of raw.transcriptions ?? []) {
    for (const u of block.utterances ?? []) {
      utterances.push(u);
    }
    for (const line of block.lines ?? []) {
      if (line.text) {
        utterances.push({ speaker: line.speaker, text: line.text });
      }
    }
  }

  const summary =
    raw.summary ||
    raw.short_summary ||
    raw.title ||
    undefined;

  return {
    ...raw,
    summary,
    startedAt:
      raw.startedAt ??
      toEpochMs(raw.started_at) ??
      toEpochMs(raw.start_time),
    endedAt:
      raw.endedAt ?? toEpochMs(raw.ended_at) ?? toEpochMs(raw.end_time),
    utterances,
  };
}

export async function listConversations(
  limit = 20,
  cursor?: string
): Promise<{ items: BeeConversation[]; next_cursor: string | null }> {
  if (isMockMode()) {
    const items = mockConversations
      .map(normalizeConversation)
      .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
      .slice(0, limit);
    return { items, next_cursor: null };
  }
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const data = await beeFetch<ListResponse<BeeConversation>>(
    `/v1/conversations?${params}`
  );
  const items =
    data.items ?? data.conversations ?? (Array.isArray(data) ? data : []);
  return {
    items: (items as BeeConversation[])
      .map(normalizeConversation)
      .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0)),
    next_cursor: data.next_cursor ?? null,
  };
}

export async function getConversation(
  id: string
): Promise<BeeConversation> {
  if (isMockMode()) {
    const found = mockConversations.find((c) => String(c.id) === id);
    if (!found) throw new Error("Conversation not found");
    return normalizeConversation(found);
  }
  const raw = await beeFetch<BeeConversation>(`/v1/conversations/${id}`);
  return normalizeConversation(raw);
}

export async function listTodos(): Promise<BeeTodo[]> {
  if (isMockMode()) return mockTodos;
  const data = await beeFetch<ListResponse<BeeTodo> | BeeTodo[]>("/v1/todos");
  if (Array.isArray(data)) return data;
  return (data.items ?? data.todos ?? []) as BeeTodo[];
}

export async function createTodo(text: string, alarmAt?: string): Promise<BeeTodo> {
  if (isMockMode()) {
    return { id: `todo-${Date.now()}`, text, completed: false };
  }
  const body: { text: string; alarm_at?: string } = { text };
  if (alarmAt) body.alarm_at = alarmAt;
  return beeFetch<BeeTodo>("/v1/todos", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateTodo(
  id: string,
  patch: { text?: string; completed?: boolean; alarm_at?: string | null }
): Promise<BeeTodo> {
  if (isMockMode()) {
    const t = mockTodos.find((x) => String(x.id) === id);
    const base: BeeTodo = t ?? { id, text: patch.text ?? "" };
    return {
      ...base,
      text: patch.text ?? base.text,
      completed: patch.completed ?? base.completed,
    };
  }
  return beeFetch<BeeTodo>(`/v1/todos/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export type SearchConversationsOpts = {
  query: string;
  limit?: number;
  mode?: "keyword" | "neural";
};

function conversationMatchesQuery(c: BeeConversation, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  const terms = q.split(/\s+/).filter(Boolean);
  const hay = [
    c.summary,
    c.title,
    c.short_summary,
    ...(c.utterances ?? []).map((u) => `${u.speaker ?? ""} ${u.text ?? ""}`),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  return terms.every((t) => hay.includes(t));
}

function hitFromConversation(c: BeeConversation): SearchHit {
  return {
    type: "conversation",
    conversation: normalizeConversation(c),
  };
}

export async function searchConversations(
  opts: SearchConversationsOpts
): Promise<{ hits: SearchHit[]; query: string }> {
  const query = opts.query.trim();
  const limit = opts.limit ?? 20;
  if (!query) return { hits: [], query };

  if (isMockMode()) {
    const hits = mockConversations
      .filter((c) => conversationMatchesQuery(c, query))
      .slice(0, limit)
      .map(hitFromConversation);
    return { hits, query };
  }

  const mode = opts.mode ?? "keyword";
  const path =
    mode === "neural"
      ? "/v1/search/conversations/neural"
      : "/v1/search/conversations";

  try {
    const data = await beeFetch<{
      items?: SearchHit[] | BeeConversation[];
      results?: SearchHit[] | BeeConversation[];
      conversations?: BeeConversation[];
      hits?: SearchHit[];
    }>(path, {
      method: "POST",
      body: JSON.stringify({ query, limit, cursor: null }),
    });

    const raw =
      data.hits ??
      data.items ??
      data.results ??
      data.conversations ??
      [];

    const hits: SearchHit[] = (raw as unknown[]).map((row) => {
      const r = row as SearchHit & BeeConversation;
      if (r.conversation || r.type === "conversation" || r.daily || r.fact) {
        return {
          ...r,
          conversation: r.conversation
            ? normalizeConversation(r.conversation)
            : undefined,
        };
      }
      return hitFromConversation(r as BeeConversation);
    });

    return { hits: hits.slice(0, limit), query };
  } catch {
    // Fallback: local filter over recent conversations if search endpoint fails
    const { items } = await listConversations(Math.max(limit, 30));
    const hits = items
      .filter((c) => conversationMatchesQuery(c, query))
      .slice(0, limit)
      .map(hitFromConversation);
    return { hits, query };
  }
}

/** In-memory mock suggestion state (process lifetime). */
const mockHandledSuggestions = new Set<string>();

export async function listTodoSuggestions(): Promise<BeeTodoSuggestion[]> {
  if (isMockMode()) {
    return mockTodoSuggestions.filter(
      (s) => !mockHandledSuggestions.has(String(s.id))
    );
  }
  try {
    const data = await beeFetch<ListResponse<BeeTodoSuggestion>>(
      "/v1/todoSuggestions"
    );
    return (data.items ?? data.suggestions ?? []) as BeeTodoSuggestion[];
  } catch {
    return [];
  }
}

export async function acceptTodoSuggestion(id: string): Promise<void> {
  if (isMockMode()) {
    mockHandledSuggestions.add(String(id));
    const sug = mockTodoSuggestions.find((s) => String(s.id) === String(id));
    if (sug) {
      mockTodos.push({
        id: `todo-from-sug-${id}`,
        text: sug.text,
        completed: false,
      });
    }
    return;
  }
  await beeFetch(`/v1/todoSuggestions/${id}/accept`, { method: "POST" });
}

export async function dismissTodoSuggestion(id: string): Promise<void> {
  if (isMockMode()) {
    mockHandledSuggestions.add(String(id));
    return;
  }
  await beeFetch(`/v1/todoSuggestions/${id}/dismiss`, { method: "POST" });
}

export function formatTranscript(conv: BeeConversation): string {
  const lines: string[] = [];
  if (conv.summary) lines.push(`Summary: ${conv.summary}`);
  for (const u of conv.utterances ?? []) {
    const who = u.speaker ?? "Speaker";
    const text = u.text?.trim();
    if (text) lines.push(`${who}: ${text}`);
  }
  return lines.join("\n");
}
