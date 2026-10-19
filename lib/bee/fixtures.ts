import type { BeeConversation, BeeTodo, BeeTodoSuggestion, BeeUser } from "./types";

/** Fixed clock offsets so demo ordering stays stable across reloads. */
const HOUR = 60 * 60 * 1000;
const now = Date.now();

export const mockUser: BeeUser = {
  id: "demo-user",
  name: "Demo Student",
  email: "demo@bee.local",
  timezone: "America/Los_Angeles",
};

/**
 * Fixtures mirror the live demo narrative:
 * search "lecture" / "office hours" → process → cards + commitment → push to Bee.
 * Ordered newest-first (listConversations returns as-is; we sort in today UI by startedAt desc if needed).
 */
export const mockConversations: BeeConversation[] = [
  {
    id: "conv-104",
    summary: "Office hours — clarifying midterm study plan",
    startedAt: now - 25 * 60 * 1000,
    utterances: [
      {
        speaker: "Owner",
        text: "During office hours, can we walk through the recursion problems from class?",
      },
      {
        speaker: "TA",
        text: "Sure. Start with the base case, then the recursive step — same pattern as the lecture examples.",
      },
      {
        speaker: "Owner",
        text: "I'll email you my draft outline by tonight.",
      },
    ],
  },
  {
    id: "conv-103",
    summary: "CS 101 lecture — big-O and hash tables",
    startedAt: now - 90 * 60 * 1000,
    utterances: [
      {
        speaker: "Professor",
        text: "Today in lecture we cover big-O notation and why hash tables average O(1) lookup.",
      },
      {
        speaker: "Owner",
        text: "What is the worst case for a hash table with chaining?",
      },
      {
        speaker: "Professor",
        text: "Worst case is O(n) when every key collides into one bucket — use a good hash and resize.",
      },
      {
        speaker: "Professor",
        text: "Amortized analysis means the average cost over a sequence of operations.",
      },
      {
        speaker: "Owner",
        text: "I need to finish the problem set before office hours tomorrow.",
      },
    ],
  },
  {
    id: "conv-101",
    summary: "Cell biology review — mitochondria and ATP synthesis",
    startedAt: now - 2 * HOUR,
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
        speaker: "Tutor",
        text: "Mitochondria is where cellular respiration finishes and most ATP is made.",
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
    startedAt: now - 5 * HOUR,
    utterances: [
      { speaker: "Owner", text: "How do I ask where the train station is?" },
      { speaker: "Friend", text: "¿Dónde está la estación de tren?" },
      {
        speaker: "Owner",
        text: "I'll practice these phrases before class tomorrow.",
      },
    ],
  },
];

export const mockTodos: BeeTodo[] = [
  { id: "todo-1", text: "Review mitochondria flashcards", completed: false },
  { id: "todo-2", text: "Email professor about lab section", completed: true },
];

export const mockTodoSuggestions: BeeTodoSuggestion[] = [
  {
    id: "sug-2",
    text: "Finish CS 101 problem set before office hours",
    conversationId: "conv-103",
  },
  {
    id: "sug-1",
    text: "Send Krebs cycle notes to study group by Friday",
    conversationId: "conv-101",
  },
];
