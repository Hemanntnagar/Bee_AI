"use client";

import { useCallback, useEffect, useState } from "react";

type Card = {
  id: string;
  front: string;
  back: string;
  conversationId: string;
  sourceSnippet?: string;
};

export default function ReviewPage() {
  const [due, setDue] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/review");
    const data = await res.json();
    setDue(data.due ?? []);
    setTotal(data.total ?? 0);
    setIndex(0);
    setFlipped(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const card = due[index];

  async function grade(g: "again" | "hard" | "good") {
    if (!card) return;
    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, grade: g }),
    });
    if (index + 1 >= due.length) await load();
    else {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  if (due.length === 0) {
    return (
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--accent)]">
          Review
        </h1>
        <p className="mt-4 text-[var(--text-muted)]">
          No cards due right now. Process a conversation to generate study cards.
          ({total} cards in deck total.)
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--accent)] mb-2">
        Review
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Card {index + 1} of {due.length} due · conversation {card.conversationId}
      </p>

      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="w-full min-h-[200px] text-left rounded-lg border border-[var(--line)] p-8 hover:border-[var(--accent-dim)] transition-colors"
      >
        <p className="text-lg leading-relaxed">
          {flipped ? card.back : card.front}
        </p>
        <p className="mt-6 text-xs text-[var(--text-muted)]">
          {flipped ? "Answer" : "Tap to reveal"}
        </p>
      </button>

      {card.sourceSnippet && (
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Bee source: {card.sourceSnippet}
        </p>
      )}

      {flipped && (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => grade("again")}
            className="px-4 py-2 text-sm border border-red-400/50 rounded-md"
          >
            Again
          </button>
          <button
            type="button"
            onClick={() => grade("hard")}
            className="px-4 py-2 text-sm border border-[var(--line)] rounded-md"
          >
            Hard
          </button>
          <button
            type="button"
            onClick={() => grade("good")}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg-deep)] rounded-md"
          >
            Good
          </button>
        </div>
      )}
    </div>
  );
}
