import {
  getMe,
  listConversations,
  listTodoSuggestions,
  listTodos,
} from "@/lib/bee/client";
import { getDueCards, readStore } from "@/lib/store/persist";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [user, convos, todos, suggestions, store] = await Promise.all([
      getMe(),
      listConversations(15),
      listTodos(),
      listTodoSuggestions(),
      readStore(),
    ]);
    const dueCards = getDueCards(store.cards);
    const openTodos = todos.filter((t) => !t.completed);
    return NextResponse.json({
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
