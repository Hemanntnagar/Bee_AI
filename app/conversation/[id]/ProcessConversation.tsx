"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CardDraft = {
  front: string;
  back: string;
  sourceSnippet?: string;
  conversationId: string;
};

type CommitmentDraft = { text: string; dueHint?: string };

export function ProcessConversation({
  conversationId,
  summary,
}: {
  conversationId: string;
  summary?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [concepts, setConcepts] = useState<string[]>([]);
  const [cards, setCards] = useState<CardDraft[]>([]);
  const [commitments, setCommitments] = useState<CommitmentDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function process() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/process`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Process failed");
      setTitle(data.studyPack.title);
      setConcepts(data.studyPack.keyConcepts ?? []);
      setCards(
        (data.studyPack.cards ?? []).map(
          (c: CardDraft) => ({ ...c, conversationId })
        )
      );
      setCommitments(data.commitments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    setLoading(true);
    setError(null);
    try {
      const cardRes = await fetch("/api/cards/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, cards }),
      });
      if (!cardRes.ok) {
        const d = await cardRes.json();
        throw new Error(d.error ?? "Save cards failed");
      }
      if (commitments.length) {
        await fetch("/api/commitments/local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            items: commitments.map((c) => ({ text: c.text })),
          }),
        });
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function pushTodo(text: string) {
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-[var(--text-muted)]">{summary}</p>
        <button
          type="button"
          onClick={process}
          disabled={loading}
          className="mt-4 rounded-md bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--bg-deep)] disabled:opacity-50"
        >
          {loading ? "Working…" : "Extract study pack + commitments"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {title && (
        <>
          <section>
            <h2 className="text-xl font-[family-name:var(--font-fraunces)] text-[var(--accent)]">
              {title}
            </h2>
            {concepts.length > 0 && (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Concepts: {concepts.join(", ")}
              </p>
            )}
            <ul className="mt-4 space-y-4">
              {cards.map((c, i) => (
                <li key={i} className="border border-[var(--line)] rounded-md p-4">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Front
                  </label>
                  <input
                    className="w-full bg-transparent border-b border-[var(--line)] pb-1 mb-3"
                    value={c.front}
                    onChange={(e) => {
                      const next = [...cards];
                      next[i] = { ...next[i], front: e.target.value };
                      setCards(next);
                    }}
                  />
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Back
                  </label>
                  <textarea
                    className="w-full bg-transparent border border-[var(--line)] rounded p-2 text-sm min-h-[4rem]"
                    value={c.back}
                    onChange={(e) => {
                      const next = [...cards];
                      next[i] = { ...next[i], back: e.target.value };
                      setCards(next);
                    }}
                  />
                  {c.sourceSnippet && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Source: {c.sourceSnippet}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-lg mb-3">Commitments</h3>
            <ul className="space-y-2">
              {commitments.map((c, i) => (
                <li key={i} className="flex flex-wrap gap-2 items-center">
                  <input
                    className="flex-1 min-w-[200px] bg-transparent border-b border-[var(--line)]"
                    value={c.text}
                    onChange={(e) => {
                      const next = [...commitments];
                      next[i] = { ...next[i], text: e.target.value };
                      setCommitments(next);
                    }}
                  />
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)]"
                    onClick={() => pushTodo(c.text)}
                  >
                    Push to Bee
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={saveAll}
              disabled={loading || saved}
              className="rounded-md border border-[var(--accent)] px-5 py-2 text-sm text-[var(--accent)]"
            >
              {saved ? "Saved locally" : "Save cards + commitments"}
            </button>
            <a href="/review" className="text-sm self-center text-[var(--text-muted)] hover:text-[var(--text)]">
              Go to review →
            </a>
          </div>
        </>
      )}
    </div>
  );
}
