export type StudyCard = {
  id: string;
  front: string;
  back: string;
  conversationId: string;
  sourceSnippet?: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: number;
  createdAt: number;
};

export type StudyPack = {
  conversationId: string;
  title: string;
  keyConcepts: string[];
  cards: Omit<StudyCard, "id" | "ease" | "intervalDays" | "repetitions" | "dueAt" | "createdAt">[];
};

export type LocalCommitment = {
  id: string;
  text: string;
  conversationId: string;
  pushed: boolean;
  beeTodoId?: string;
  createdAt: number;
};

export type BeeLoopStore = {
  processedConversationIds: string[];
  cards: StudyCard[];
  localCommitments: LocalCommitment[];
};
