"use client";

import type { BeeConversation, BeeTodoSuggestion } from "@/lib/bee/types";
import type { TodayPayload } from "@/lib/today/types";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 20_000;

const SEARCH_CHIPS = [
  "lecture",
  "class",
  "office hours",
  "study",
  "midterm",
] as const;

function formatWhen(ms?: number) {
  if (!ms) return "";
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function convoLabel(c: BeeConversation) {
  return c.summary ?? c.title ?? `Conversation ${c.id}`;
}

export function TodayDashboard({
  initial,
  greetingName,
  mock,
}: {
  initial: TodayPayload;
  greetingName: string;
  mock?: boolean;
}) {
  const [data, setData] = useState<TodayPayload>(initial);
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const [polling, setPolling] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchHits, setSearchHits] = useState<BeeConversation[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [busySug, setBusySug] = useState<string | null>(null);
  const [livePaused, setLivePaused] = useState(false);
  const [, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const refresh = useCallback(async (silent = true) => {
    if (!silent) setPolling(true);
    try {
      const res = await fetch("/api/today", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Refresh failed");
      setData({
        user: json.user,
        conversations: json.conversations ?? [],
        openTodos: json.openTodos ?? [],
        suggestions: json.suggestions ?? [],
        dueCards: json.dueCards ?? [],
        processedConversationIds: json.processedConversationIds ?? [],
        mock: json.mock,
      });
      setLastSync(Date.now());
      setPollError(null);
    } catch (e) {
      setPollError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    if (livePaused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      refresh(true);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [livePaused, refresh]);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible" && !livePaused) {
        refresh(true);
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [livePaused, refresh]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    setQuery(trimmed);
    setSearchError(null);
    abortRef.current?.abort();
    if (!trimmed) {
      setSearchHits(null);
      setSearching(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&limit=15`,
        { signal: ctrl.signal }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Search failed");
      const convos = (json.hits ?? [])
        .map((h: { conversation?: BeeConversation }) => h.conversation)
        .filter(Boolean) as BeeConversation[];
      setSearchHits(convos);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setSearchError(e instanceof Error ? e.message : "Search failed");
      setSearchHits([]);
    } finally {
      setSearching(false);
    }
  }, []);

  async function suggestionAction(
    id: string | number,
    action: "accept" | "dismiss"
  ) {
    setBusySug(String(id));
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(id), action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      setData((d) => ({
        ...d,
        suggestions: d.suggestions.filter((s) => String(s.id) !== String(id)),
      }));
      await refresh(false);
    } catch (e) {
      setPollError(e instanceof Error ? e.message : "Suggestion action failed");
    } finally {
      setBusySug(null);
    }
  }

  const processed = new Set(data.processedConversationIds ?? []);
  const list: BeeConversation[] =
    searchHits !== null ? searchHits : data.conversations;
  const dueCount = data.dueCards?.length ?? 0;
  const suggestions = data.suggestions ?? [];
  const openTodos = data.openTodos ?? [];
  const secondsAgo = Math.max(0, Math.round((Date.now() - lastSync) / 1000));

  return (
    <>
      {(mock || data.mock) && (
        <div className="bl-panel mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-[var(--text-muted)]">
          <span>
            Fixtures mode — demo data mirrors a lecture + commitment capture.
          </span>
          <Link href="/demo" className="bl-link shrink-0 font-medium">
            Demo guide →
          </Link>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Today Loop
          </p>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--green)] sm:text-4xl">
            Bee Loop
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--text-muted)]">
            Hello, {data.user?.name ?? greetingName}. Turn captured conversations
            into study cards and close open commitments.
            {mock || data.mock ? " (fixtures mode)" : ""}
          </p>
        </div>
        <div className="space-y-1 text-left text-xs text-[var(--text-muted)] sm:text-right">
          <p>
            {livePaused
              ? "Live updates paused"
              : polling
                ? "Syncing…"
                : `Synced ${secondsAgo}s ago`}
          </p>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => refresh(false)}
              className="bl-link font-medium"
            >
              Refresh now
            </button>
            <button
              type="button"
              onClick={() => setLivePaused((p) => !p)}
              className="hover:text-[var(--text)]"
            >
              {livePaused ? "Resume live" : "Pause live"}
            </button>
          </div>
          {pollError && (
            <p className="max-w-xs text-left text-[var(--orange-dark)] sm:ml-auto sm:text-right">
              {pollError}
            </p>
          )}
        </div>
      </div>

      <div className="bl-card mb-10 space-y-3 p-4 sm:p-5">
        <label className="block text-sm font-medium text-[var(--text)]">
          Find study conversations
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch(query);
            }}
            placeholder="Search Bee memory — lecture, class, office hours…"
            className="bl-input flex-1 min-w-0 sm:min-w-[220px]"
          />
          <button
            type="button"
            onClick={() => runSearch(query)}
            disabled={searching}
            className="bl-btn bl-btn-primary"
          >
            {searching ? "Searching…" : "Search"}
          </button>
          {searchHits !== null && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSearchHits(null);
                setSearchError(null);
              }}
              className="bl-btn bl-btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => runSearch(chip)}
              className="bl-chip"
            >
              {chip}
            </button>
          ))}
        </div>
        {searchError && <p className="bl-alert-error">{searchError}</p>}
        {searchHits !== null && (
          <p className="text-xs text-[var(--text-muted)]">
            {searchHits.length} result{searchHits.length === 1 ? "" : "s"} for “
            {query}”
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <section className="bl-card p-4 sm:p-5">
          <h2 className="bl-section-title">
            {searchHits !== null ? "Search results" : "Recent conversations"}
          </h2>
          <ul className="space-y-3">
            {list.length === 0 && (
              <li className="text-sm text-[var(--text-muted)]">
                {searchHits !== null
                  ? "No matching conversations. Try another chip or clear search."
                  : "No conversations yet. Capture audio on Bee — this list refreshes every 20s."}
              </li>
            )}
            {list.map((c) => (
              <li key={String(c.id)}>
                <Link
                  href={`/conversation/${c.id}`}
                  className="block rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg-mid)] px-4 py-3 transition-colors hover:border-[var(--green)] hover:bg-[var(--green-soft)]"
                >
                  <span className="text-xs text-[var(--text-muted)]">
                    {formatWhen(c.startedAt)}
                    {processed.has(String(c.id)) ? (
                      <span className="ml-1 text-[var(--orange)]">
                        · processed
                      </span>
                    ) : (
                      ""
                    )}
                  </span>
                  <p className="mt-1 text-sm font-medium leading-snug text-[var(--text)]">
                    {convoLabel(c)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-6">
          <div className="bl-card p-4 sm:p-5">
            <h2 className="bl-section-title">Open commitments</h2>
            <ul className="mb-4 space-y-2">
              {openTodos.length === 0 && (
                <li className="text-sm text-[var(--text-muted)]">
                  No open Bee todos.
                </li>
              )}
              {openTodos.slice(0, 6).map((t) => (
                <li
                  key={String(t.id)}
                  className="border-l-[3px] border-[var(--orange)] pl-3 text-sm"
                >
                  {t.text}
                </li>
              ))}
            </ul>
            <Link href="/inbox" className="bl-link text-sm font-medium">
              Open commitment inbox →
            </Link>
          </div>

          <div className="bl-card p-4 sm:p-5">
            <h2 className="bl-section-title">Bee suggestions</h2>
            <ul className="space-y-3">
              {suggestions.length === 0 && (
                <li className="text-sm text-[var(--text-muted)]">
                  No pending suggestions from Bee.
                </li>
              )}
              {suggestions.map((s: BeeTodoSuggestion) => (
                <li
                  key={String(s.id)}
                  className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg-mid)] px-3 py-2.5 text-sm"
                >
                  <p>{s.text}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {s.conversationId != null && (
                      <Link
                        href={`/conversation/${s.conversationId}`}
                        className="text-[var(--text-muted)] hover:text-[var(--green)]"
                      >
                        Source
                      </Link>
                    )}
                    <button
                      type="button"
                      disabled={busySug === String(s.id)}
                      onClick={() => suggestionAction(s.id, "accept")}
                      className="font-medium text-[var(--green)] disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={busySug === String(s.id)}
                      onClick={() => suggestionAction(s.id, "dismiss")}
                      className="text-[var(--text-muted)] disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bl-card flex flex-col p-4 sm:p-5">
          <h2 className="bl-section-title">Study decks due</h2>
          <p className="font-[family-name:var(--font-fraunces)] text-5xl text-[var(--green)] sm:text-6xl">
            {dueCount}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            cards ready for review from processed conversations
          </p>
          <Link
            href="/review"
            className="bl-btn bl-btn-primary mt-6 w-full sm:w-auto"
          >
            Start review
          </Link>
        </section>
      </div>
    </>
  );
}
