"use client";

import Link from "next/link";
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
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/review");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load review deck");
      setDue(data.due ?? []);
      setTotal(data.total ?? 0);
      setIndex(0);
      setFlipped(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const card = due[index];

  async function grade(g: "again" | "hard" | "good") {
    if (!card || grading) return;
    setGrading(true);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, grade: g }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Grade failed");
      if (index + 1 >= due.length) await load();
      else {
        setIndex(index + 1);
        setFlipped(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grade failed");
    } finally {
      setGrading(false);
    }
  }

  if (loading && due.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">Loading review deck…</p>
    );
  }

  if (due.length === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--green)]">
          Review
        </h1>
        {error && <p className="bl-alert-error mt-4">{error}</p>}
        <p className="mt-4 text-[var(--text-muted)]">
          No cards due right now. Process a conversation to generate study
          cards.
          {total > 0 ? ` (${total} cards in deck total.)` : ""}
        </p>
        <Link href="/" className="bl-link mt-6 inline-block text-sm font-medium">
          ← Back to Today
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--green)]">
        Review
      </h1>
      <p className="mb-8 text-sm text-[var(--text-muted)]">
        Card {index + 1} of {due.length} due · conversation{" "}
        <Link
          href={`/conversation/${card.conversationId}`}
          className="bl-link font-medium"
        >
          {card.conversationId}
        </Link>
      </p>

      {error && <p className="bl-alert-error mb-4">{error}</p>}

      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="bl-card w-full min-h-[220px] p-6 text-left transition-shadow hover:shadow-[var(--shadow)] sm:p-8"
      >
        <p className="text-lg leading-relaxed text-[var(--text)]">
          {flipped ? card.back : card.front}
        </p>
        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-[var(--orange)]">
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
            disabled={grading}
            onClick={() => grade("again")}
            className="bl-btn bl-btn-accent"
          >
            Again
          </button>
          <button
            type="button"
            disabled={grading}
            onClick={() => grade("hard")}
            className="bl-btn bl-btn-secondary"
          >
            Hard
          </button>
          <button
            type="button"
            disabled={grading}
            onClick={() => grade("good")}
            className="bl-btn bl-btn-primary"
          >
            {grading ? "Saving…" : "Good"}
          </button>
        </div>
      )}
    </div>
  );
}
