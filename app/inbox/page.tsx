"use client";

import { useCallback, useEffect, useState } from "react";

type Todo = { id: string | number; text: string; completed?: boolean };
type Suggestion = { id: string | number; text: string };
type LocalC = { id: string; text: string; pushed: boolean; conversationId: string };

export default function InboxPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [local, setLocal] = useState<LocalC[]>([]);
  const [newTodo, setNewTodo] = useState("");

  const load = useCallback(async () => {
    const [tRes, sRes, lRes] = await Promise.all([
      fetch("/api/todos"),
      fetch("/api/suggestions"),
      fetch("/api/commitments/local"),
    ]);
    const tData = await tRes.json();
    const sData = await sRes.json();
    const lData = await lRes.json();
    setTodos(tData.todos ?? []);
    setSuggestions(sData.suggestions ?? []);
    setLocal(lData.commitments ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function completeTodo(id: string | number) {
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: String(id), completed: true }),
    });
    load();
  }

  async function suggestionAction(id: string | number, action: "accept" | "dismiss") {
    await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: String(id), action }),
    });
    load();
  }

  async function addTodo() {
    if (!newTodo.trim()) return;
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newTodo.trim() }),
    });
    setNewTodo("");
    load();
  }

  const open = todos.filter((t) => !t.completed);
  const pendingLocal = local.filter((c) => !c.pushed);

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--accent)]">
          Commitment inbox
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Bee todos, suggestions, and commitments extracted from conversations.
        </p>
      </div>

      <section>
        <h2 className="text-lg mb-3 border-b border-[var(--line)] pb-2">Bee todos</h2>
        <ul className="space-y-2">
          {open.map((t) => (
            <li key={String(t.id)} className="flex justify-between gap-4 text-sm">
              <span>{t.text}</span>
              <button
                type="button"
                onClick={() => completeTodo(t.id)}
                className="text-[var(--accent)] shrink-0"
              >
                Done
              </button>
            </li>
          ))}
          {open.length === 0 && (
            <li className="text-sm text-[var(--text-muted)]">All caught up.</li>
          )}
        </ul>
        <div className="mt-4 flex gap-2">
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="New todo to push to Bee…"
            className="flex-1 bg-transparent border border-[var(--line)] rounded px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addTodo}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg-deep)] rounded-md"
          >
            Add
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg mb-3 border-b border-[var(--line)] pb-2">
          Bee suggestions
        </h2>
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li key={String(s.id)} className="text-sm flex flex-wrap gap-3">
              <span className="flex-1">{s.text}</span>
              <button
                type="button"
                onClick={() => suggestionAction(s.id, "accept")}
                className="text-[var(--accent)]"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => suggestionAction(s.id, "dismiss")}
                className="text-[var(--text-muted)]"
              >
                Dismiss
              </button>
            </li>
          ))}
          {suggestions.length === 0 && (
            <li className="text-sm text-[var(--text-muted)]">No suggestions.</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg mb-3 border-b border-[var(--line)] pb-2">
          From processed conversations
        </h2>
        <ul className="space-y-2">
          {pendingLocal.map((c) => (
            <li key={c.id} className="text-sm text-[var(--text-muted)]">
              {c.text}
              <span className="ml-2 text-xs">({c.conversationId})</span>
            </li>
          ))}
          {pendingLocal.length === 0 && (
            <li className="text-sm text-[var(--text-muted)]">None pending.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
