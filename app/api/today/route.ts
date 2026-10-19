import {
  checkBeeHealth,
  getMe,
  isMockMode,
  listConversations,
  listTodoSuggestions,
  listTodos,
} from "@/lib/bee/client";
import { getDueCards, readStore } from "@/lib/store/persist";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const health = await checkBeeHealth();
    if (!health.ok && !health.mock) {
      return NextResponse.json(
        { error: health.error ?? "Bee proxy not connected", ok: false },
        { status: 502 }
      );
    }

    const [user, convos, todos, suggestions, store] = await Promise.all([
      getMe(),
      listConversations(20),
      listTodos(),
      listTodoSuggestions(),
      readStore(),
    ]);
    const dueCards = getDueCards(store.cards);
    const openTodos = todos.filter((t) => !t.completed);
    return NextResponse.json({
      ok: true,
      mock: isMockMode() || health.mock,
      user,
      conversations: convos.items,
      todos,
      openTodos,
      suggestions,
      dueCards,
      processedConversationIds: store.processedConversationIds,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load today" },
      { status: 502 }
    );
  }
}
