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
  ListResponse,
} from "./types";

const DEFAULT_PROXY = "http://127.0.0.1:8787";

export function isMockMode(): boolean {
  return process.env.BEE_MOCK === "1" || process.env.BEE_MOCK === "true";
}

function proxyBase(): string {
  return (process.env.BEE_PROXY_URL ?? DEFAULT_PROXY).replace(/\/$/, "");
}

async function beeFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${proxyBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
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

export async function listConversations(
  limit = 20,
  cursor?: string
): Promise<{ items: BeeConversation[]; next_cursor: string | null }> {
  if (isMockMode()) {
    return { items: mockConversations, next_cursor: null };
  }
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const data = await beeFetch<ListResponse<BeeConversation>>(
    `/v1/conversations?${params}`
  );
  const items =
    data.items ?? data.conversations ?? (Array.isArray(data) ? data : []);
  return {
    items: items as BeeConversation[],
    next_cursor: data.next_cursor ?? null,
  };
}

export async function getConversation(
  id: string
): Promise<BeeConversation> {
  if (isMockMode()) {
    const found = mockConversations.find((c) => String(c.id) === id);
    if (!found) throw new Error("Conversation not found");
    return found;
  }
  return beeFetch<BeeConversation>(`/v1/conversations/${id}`);
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

export async function listTodoSuggestions(): Promise<BeeTodoSuggestion[]> {
  if (isMockMode()) return mockTodoSuggestions;
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
  if (isMockMode()) return;
  await beeFetch(`/v1/todoSuggestions/${id}/accept`, { method: "POST" });
}

export async function dismissTodoSuggestion(id: string): Promise<void> {
  if (isMockMode()) return;
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
