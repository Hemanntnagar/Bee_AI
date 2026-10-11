import type { BeeConversation, BeeTodo, BeeTodoSuggestion, BeeUser } from "./types";

export const mockUser: BeeUser = {
  id: "demo-user",
  name: "Demo Student",
  email: "demo@bee.local",
  timezone: "America/Los_Angeles",
};

export const mockConversations: BeeConversation[] = [
  {
    id: "conv-101",
    summary: "Cell biology review — mitochondria and ATP synthesis",
    startedAt: Date.now() - 2 * 60 * 60 * 1000,
    utterances: [
      {
        speaker: "Owner",
        text: "Can you explain how the electron transport chain produces ATP?",
      },
      {
        speaker: "Tutor",
        text: "The chain pumps protons into the intermembrane space, creating a gradient. ATP synthase uses that flow to phosphorylate ADP into ATP.",
      },
      {
        speaker: "Owner",
        text: "I'll send my notes on Krebs cycle to the study group by Friday.",
      },
    ],
  },
  {
    id: "conv-102",
    summary: "Spanish vocab — travel phrases",
    startedAt: Date.now() - 5 * 60 * 60 * 1000,
    utterances: [
      { speaker: "Owner", text: "How do I ask where the train station is?" },
      { speaker: "Friend", text: "¿Dónde está la estación de tren?" },
    ],
  },
];

export const mockTodos: BeeTodo[] = [
  { id: "todo-1", text: "Review mitochondria flashcards", completed: false },
  { id: "todo-2", text: "Email professor about lab section", completed: true },
];

export const mockTodoSuggestions: BeeTodoSuggestion[] = [
  {
    id: "sug-1",
    text: "Send Krebs cycle notes to study group by Friday",
    conversationId: "conv-101",
  },
];
