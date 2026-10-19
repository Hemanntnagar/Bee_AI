import type {
  BeeConversation,
  BeeTodo,
  BeeTodoSuggestion,
  BeeUser,
} from "@/lib/bee/types";
import type { StudyCard } from "@/lib/store/types";

export type TodayPayload = {
  user?: BeeUser;
  conversations: BeeConversation[];
  openTodos: BeeTodo[];
  suggestions: BeeTodoSuggestion[];
  dueCards: StudyCard[];
  processedConversationIds: string[];
  mock?: boolean;
};
