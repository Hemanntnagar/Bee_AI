import Link from "next/link";
import { SetupBanner } from "@/components/SetupBanner";
import {
  checkBeeHealth,
  getMe,
  listConversations,
  listTodos,
} from "@/lib/bee/client";
import { getDueCards, readStore } from "@/lib/store/persist";

function formatWhen(ms?: number) {
  if (!ms) return "";
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function loadToday() {
  const [user, convos, todos, store] = await Promise.all([
    getMe(),
    listConversations(15),
    listTodos(),
    readStore(),
  ]);
  return {
    user,
    conversations: convos.items,
    openTodos: todos.filter((t) => !t.completed),
    dueCards: getDueCards(store.cards),
    processedConversationIds: store.processedConversationIds,
  };
}

export default async function HomePage() {
  const health = await checkBeeHealth();
  let today: Awaited<ReturnType<typeof loadToday>> | null = null;
  if (health.ok) {
    try {
      today = await loadToday();
    } catch {
      today = null;
    }
  }

  if (!health.ok && !health.mock) {
    return (
      <>
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl text-[var(--accent)] mb-2">
          Bee Loop
        </h1>
        <p className="text-[var(--text-muted)] mb-6 max-w-xl">
          Connect your Bee wearable memory to study reviews and commitment follow-through.
        </p>
        <SetupBanner message={health.error} />
      </>
    );
  }

  const name = today?.user?.name ?? health.user?.name ?? "there";
  const convos = today?.conversations ?? [];
  const openTodos = today?.openTodos ?? [];
  const dueCount = today?.dueCards?.length ?? 0;
  const processed = new Set(today?.processedConversationIds ?? []);

  return (
    <>
      <div className="mb-10">
        <p className="text-sm uppercase tracking-widest text-[var(--text-muted)] mb-1">
          Today Loop
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl text-[var(--accent)]">
          Bee Loop
        </h1>
        <p className="mt-3 text-[var(--text-muted)] max-w-2xl">
          Hello, {name}. Turn captured conversations into study cards and close open commitments.
          {health.mock ? " (fixtures mode)" : ""}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section>
          <h2 className="text-lg font-medium mb-4 border-b border-[var(--line)] pb-2">
            Recent conversations
          </h2>
          <ul className="space-y-3">
            {convos.length === 0 && (
              <li className="text-sm text-[var(--text-muted)]">
                No conversations yet. Capture audio on Bee, then refresh.
              </li>
            )}
            {convos.map((c) => (
              <li key={String(c.id)}>
                <Link
                  href={`/conversation/${c.id}`}
                  className="block rounded-md border border-[var(--line)] px-4 py-3 hover:border-[var(--accent-dim)] transition-colors"
                >
                  <span className="text-xs text-[var(--text-muted)]">
                    {formatWhen(c.startedAt)}
                    {processed.has(String(c.id)) ? " · processed" : ""}
                  </span>
                  <p className="mt-1 text-sm leading-snug">
                    {c.summary ?? `Conversation ${c.id}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4 border-b border-[var(--line)] pb-2">
            Open commitments
          </h2>
          <ul className="space-y-2 mb-4">
            {openTodos.length === 0 && (
              <li className="text-sm text-[var(--text-muted)]">No open Bee todos.</li>
            )}
            {openTodos.slice(0, 6).map((t) => (
              <li
                key={String(t.id)}
                className="text-sm pl-3 border-l-2 border-[var(--accent-dim)]"
              >
                {t.text}
              </li>
            ))}
          </ul>
          <Link
            href="/inbox"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Open commitment inbox →
          </Link>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4 border-b border-[var(--line)] pb-2">
            Study decks due
          </h2>
          <p className="text-5xl font-[family-name:var(--font-fraunces)] text-[var(--accent)]">
            {dueCount}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            cards ready for review from processed conversations
          </p>
          <Link
            href="/review"
            className="mt-6 inline-block rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--bg-deep)] hover:bg-[var(--accent-dim)]"
          >
            Start review
          </Link>
        </section>
      </div>
    </>
  );
}
