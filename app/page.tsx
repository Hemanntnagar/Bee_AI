import { SetupBanner } from "@/components/SetupBanner";
import { TodayDashboard } from "@/components/TodayDashboard";
import {
  checkBeeHealth,
  getMe,
  listConversations,
  listTodoSuggestions,
  listTodos,
} from "@/lib/bee/client";
import { getDueCards, readStore } from "@/lib/store/persist";
import type { TodayPayload } from "@/lib/today/types";

export const dynamic = "force-dynamic";

async function loadToday(): Promise<TodayPayload> {
  const [user, convos, todos, suggestions, store] = await Promise.all([
    getMe(),
    listConversations(20),
    listTodos(),
    listTodoSuggestions(),
    readStore(),
  ]);
  return {
    user,
    conversations: convos.items,
    openTodos: todos.filter((t) => !t.completed),
    suggestions,
    dueCards: getDueCards(store.cards),
    processedConversationIds: store.processedConversationIds,
  };
}

export default async function HomePage() {
  const health = await checkBeeHealth();
  let today: TodayPayload | null = null;
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
        <h1 className="mb-2 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--green)] sm:text-4xl">
          Bee Loop
        </h1>
        <p className="mb-6 max-w-xl text-[var(--text-muted)]">
          Connect your Bee wearable memory to study reviews and commitment
          follow-through — or run <code className="bl-code">npm run demo</code>{" "}
          with fixtures.
        </p>
        <SetupBanner message={health.error} />
      </>
    );
  }

  if (!today) {
    return (
      <>
        <h1 className="mb-2 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--green)] sm:text-4xl">
          Bee Loop
        </h1>
        <SetupBanner message="Connected, but failed to load today data. Retry or check bee proxy logs." />
      </>
    );
  }

  const name = today.user?.name ?? health.user?.name ?? "there";

  return (
    <TodayDashboard
      initial={today}
      greetingName={name}
      mock={health.mock}
    />
  );
}
