"use client";

import Link from "next/link";
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
  transcriptPreview,
}: {
  conversationId: string;
  summary?: string;
  transcriptPreview?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pushingIdx, setPushingIdx] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [concepts, setConcepts] = useState<string[]>([]);
  const [cards, setCards] = useState<CardDraft[]>([]);
  const [commitments, setCommitments] = useState<CommitmentDraft[]>([]);
  const [pushed, setPushed] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  async function process() {
    setLoading(true);
    setError(null);
    setSaved(false);
    setPushed({});
    try {
      const res = await fetch(`/api/conversations/${conversationId}/process`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Process failed");
      setTitle(data.studyPack.title);
      setConcepts(data.studyPack.keyConcepts ?? []);
      setCards(
        (data.studyPack.cards ?? []).map((c: CardDraft) => ({
          ...c,
          conversationId,
        }))
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
      const usableCards = cards.filter((c) => c.front.trim() && c.back.trim());
      if (usableCards.length === 0) {
        throw new Error("Keep at least one card with front and back text");
      }
      const cardRes = await fetch("/api/cards/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, cards: usableCards }),
      });
      const cardData = await cardRes.json();
      if (!cardRes.ok) {
        throw new Error(cardData.error ?? "Save cards failed");
      }
      const usableCommitments = commitments.filter((c) => c.text.trim());
      if (usableCommitments.length) {
        const cRes = await fetch("/api/commitments/local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            items: usableCommitments.map((c) => ({ text: c.text.trim() })),
          }),
        });
        if (!cRes.ok) {
          const d = await cRes.json();
          throw new Error(d.error ?? "Save commitments failed");
        }
      }
      setSavedCount(usableCards.length);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function pushTodo(text: string, index: number) {
    setPushingIdx(index);
    setError(null);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Push to Bee failed");

      // Keep a local record marked pushed so the inbox stays in sync
      const createRes = await fetch("/api/commitments/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          items: [{ text }],
        }),
      });
      const createData = await createRes.json();
      let localId = createData.commitments?.[0]?.id as string | undefined;
      if (!localId) {
        const listRes = await fetch("/api/commitments/local");
        const listData = await listRes.json();
        const match = (listData.commitments ?? []).find(
          (c: { text: string; conversationId: string; pushed: boolean }) =>
            c.conversationId === conversationId &&
            c.text.toLowerCase() === text.toLowerCase()
        );
        localId = match?.id;
      }
      if (localId) {
        await fetch("/api/commitments/local", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: localId,
            pushed: true,
            beeTodoId:
              data.todo?.id != null ? String(data.todo.id) : undefined,
          }),
        });
      }

      setPushed((p) => ({ ...p, [index]: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Push failed");
    } finally {
      setPushingIdx(null);
    }
  }

  function removeCard(i: number) {
    setCards((c) => c.filter((_, idx) => idx !== i));
  }

  function removeCommitment(i: number) {
    setCommitments((c) => c.filter((_, idx) => idx !== i));
    setPushed((p) => {
      const next: Record<number, boolean> = {};
      for (const [k, v] of Object.entries(p)) {
        const n = Number(k);
        if (n < i) next[n] = v;
        else if (n > i) next[n - 1] = v;
      }
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <div className="bl-card p-4 sm:p-5">
        {summary && (
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            {summary}
          </p>
        )}
        {transcriptPreview && (
          <details className="group mt-4">
            <summary className="bl-link cursor-pointer list-none text-sm font-medium">
              Preview transcript
            </summary>
            <pre className="bl-pre mt-3 max-h-48 overflow-auto font-sans text-[var(--text-muted)]">
              {transcriptPreview}
            </pre>
          </details>
        )}
        <button
          type="button"
          onClick={process}
          disabled={loading}
          className="bl-btn bl-btn-primary mt-4"
        >
          {loading && !title
            ? "Extracting…"
            : title
              ? "Re-extract"
              : "Extract study pack + commitments"}
        </button>
      </div>

      {error && <p className="bl-alert-error">{error}</p>}

      {saved && (
        <div className="bl-alert-success">
          Saved {savedCount} card{savedCount === 1 ? "" : "s"} locally.
          <span className="ml-3">
            <Link href="/review" className="font-medium underline">
              Start review
            </Link>
            {" · "}
            <Link href="/inbox" className="font-medium underline">
              Open inbox
            </Link>
          </span>
        </div>
      )}

      {title && (
        <>
          <section className="bl-card p-4 sm:p-5">
            <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--green)]">
              {title}
            </h2>
            {concepts.length > 0 && (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Concepts: {concepts.join(", ")}
              </p>
            )}
            <ul className="mt-4 space-y-4">
              {cards.map((c, i) => (
                <li
                  key={i}
                  className="relative rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-mid)] p-4"
                >
                  <button
                    type="button"
                    onClick={() => removeCard(i)}
                    className="absolute top-3 right-3 text-xs text-[var(--orange)] hover:underline"
                    aria-label="Remove card"
                  >
                    Remove
                  </button>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                    Front
                  </label>
                  <input
                    className="bl-input mb-3 pr-16"
                    value={c.front}
                    onChange={(e) => {
                      const next = [...cards];
                      next[i] = { ...next[i], front: e.target.value };
                      setCards(next);
                      setSaved(false);
                    }}
                  />
                  <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                    Back
                  </label>
                  <textarea
                    className="bl-input min-h-[4rem]"
                    value={c.back}
                    onChange={(e) => {
                      const next = [...cards];
                      next[i] = { ...next[i], back: e.target.value };
                      setCards(next);
                      setSaved(false);
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
            {cards.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">
                No cards left — re-extract or add content manually after extract.
              </p>
            )}
          </section>

          <section className="bl-card p-4 sm:p-5">
            <h3 className="bl-section-title">Commitments</h3>
            {commitments.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No commitments detected. You can still save cards and add todos
                in the inbox.
              </p>
            ) : (
              <ul className="space-y-3">
                {commitments.map((c, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg-mid)] px-3 py-2"
                  >
                    <input
                      className="bl-input min-w-[200px] flex-1"
                      value={c.text}
                      onChange={(e) => {
                        const next = [...commitments];
                        next[i] = { ...next[i], text: e.target.value };
                        setCommitments(next);
                        setSaved(false);
                      }}
                    />
                    {c.dueHint && (
                      <span className="text-xs font-medium text-[var(--orange)]">
                        due: {c.dueHint}
                      </span>
                    )}
                    <button
                      type="button"
                      className="bl-btn bl-btn-accent text-xs"
                      disabled={
                        pushingIdx === i || pushed[i] || !c.text.trim()
                      }
                      onClick={() => pushTodo(c.text.trim(), i)}
                    >
                      {pushed[i]
                        ? "Pushed ✓"
                        : pushingIdx === i
                          ? "Pushing…"
                          : "Push to Bee"}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--orange)]"
                      onClick={() => removeCommitment(i)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveAll}
              disabled={loading || saved}
              className="bl-btn bl-btn-secondary"
            >
              {saved ? "Saved locally" : "Save cards + commitments"}
            </button>
            <Link
              href="/review"
              className="bl-link text-sm font-medium"
            >
              Go to review →
            </Link>
            <Link href="/inbox" className="bl-link text-sm font-medium">
              Commitment inbox →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
