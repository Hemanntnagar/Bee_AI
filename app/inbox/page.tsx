"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Todo = { id: string | number; text: string; completed?: boolean };
type Suggestion = { id: string | number; text: string };
type LocalC = {
  id: string;
  text: string;
  pushed: boolean;
  conversationId: string;
  beeTodoId?: string;
};

export default function InboxPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [local, setLocal] = useState<LocalC[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [tRes, sRes, lRes] = await Promise.all([
        fetch("/api/todos"),
        fetch("/api/suggestions"),
        fetch("/api/commitments/local"),
      ]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      const lData = await lRes.json();
      if (!tRes.ok) throw new Error(tData.error ?? "Could not load Bee todos");
      setTodos(tData.todos ?? []);
      setSuggestions(sData.suggestions ?? []);
      setLocal(lData.commitments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function completeTodo(id: string | number) {
    setBusyId(String(id));
    setError(null);
    try {
      const res = await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(id), completed: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Complete failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Complete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function suggestionAction(
    id: string | number,
    action: "accept" | "dismiss"
  ) {
    setBusyId(`sug-${id}`);
    setError(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(id), action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Suggestion action failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suggestion action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function addTodo() {
    if (!newTodo.trim()) return;
    setBusyId("add");
    setError(null);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTodo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setNewTodo("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusyId(null);
    }
  }

  async function pushLocal(c: LocalC) {
    setBusyId(c.id);
    setError(null);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: c.text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Push to Bee failed");
      await fetch("/api/commitments/local", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: c.id,
          pushed: true,
          beeTodoId: data.todo?.id != null ? String(data.todo.id) : undefined,
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Push failed");
    } finally {
      setBusyId(null);
    }
  }

  const open = todos.filter((t) => !t.completed);
  const pendingLocal = local.filter((c) => !c.pushed);
  const pushedLocal = local.filter((c) => c.pushed);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--green)]">
          Commitment inbox
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Bee todos, suggestions, and commitments extracted from conversations.
        </p>
      </div>

      {error && (
        <div className="bl-alert-error">
          {error}
          {/proxy|unreachable|ECONNREFUSED/i.test(error) && (
            <Link href="/setup" className="ml-2 font-medium underline">
              Fix setup →
            </Link>
          )}
        </div>
      )}

      {loading && (
        <p className="text-sm text-[var(--text-muted)]">Loading inbox…</p>
      )}

      <section className="bl-card p-4 sm:p-5">
        <h2 className="bl-section-title">Bee todos</h2>
        <ul className="space-y-2">
          {open.map((t) => (
            <li
              key={String(t.id)}
              className="flex items-start justify-between gap-4 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg-mid)] px-3 py-2.5 text-sm"
            >
              <span>{t.text}</span>
              <button
                type="button"
                disabled={busyId === String(t.id)}
                onClick={() => completeTodo(t.id)}
                className="shrink-0 font-medium text-[var(--green)] disabled:opacity-50"
              >
                {busyId === String(t.id) ? "…" : "Done"}
              </button>
            </li>
          ))}
          {!loading && open.length === 0 && (
            <li className="text-sm text-[var(--text-muted)]">All caught up.</li>
          )}
        </ul>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTodo();
            }}
            placeholder="New todo to push to Bee…"
            className="bl-input flex-1"
          />
          <button
            type="button"
            onClick={addTodo}
            disabled={busyId === "add" || !newTodo.trim()}
            className="bl-btn bl-btn-primary"
          >
            Add
          </button>
        </div>
      </section>

      <section className="bl-card p-4 sm:p-5">
        <h2 className="bl-section-title">Bee suggestions</h2>
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li
              key={String(s.id)}
              className="flex flex-wrap items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg-mid)] px-3 py-2.5 text-sm"
            >
              <span className="min-w-0 flex-1">{s.text}</span>
              <button
                type="button"
                disabled={busyId === `sug-${s.id}`}
                onClick={() => suggestionAction(s.id, "accept")}
                className="font-medium text-[var(--green)] disabled:opacity-50"
              >
                Accept
              </button>
              <button
                type="button"
                disabled={busyId === `sug-${s.id}`}
                onClick={() => suggestionAction(s.id, "dismiss")}
                className="text-[var(--text-muted)] disabled:opacity-50"
              >
                Dismiss
              </button>
            </li>
          ))}
          {!loading && suggestions.length === 0 && (
            <li className="text-sm text-[var(--text-muted)]">No suggestions.</li>
          )}
        </ul>
      </section>

      <section className="bl-card p-4 sm:p-5">
        <h2 className="bl-section-title">From processed conversations</h2>
        <ul className="space-y-3">
          {pendingLocal.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg-mid)] px-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p>{c.text}</p>
                <Link
                  href={`/conversation/${c.conversationId}`}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--green)]"
                >
                  conversation {c.conversationId}
                </Link>
              </div>
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => pushLocal(c)}
                className="bl-btn bl-btn-accent shrink-0 text-xs"
              >
                {busyId === c.id ? "Pushing…" : "Push to Bee"}
              </button>
            </li>
          ))}
          {!loading && pendingLocal.length === 0 && (
            <li className="text-sm text-[var(--text-muted)]">
              None pending.{" "}
              <Link href="/" className="bl-link font-medium">
                Process a conversation
              </Link>
            </li>
          )}
        </ul>
        {pushedLocal.length > 0 && (
          <div className="mt-6 border-t border-[var(--line)] pt-4">
            <h3 className="mb-2 text-sm font-medium text-[var(--text-muted)]">
              Already pushed ({pushedLocal.length})
            </h3>
            <ul className="space-y-1">
              {pushedLocal.slice(0, 8).map((c) => (
                <li key={c.id} className="text-sm text-[var(--green)]">
                  ✓ {c.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
