export type BeeUser = {
  id?: number | string;
  name?: string;
  email?: string;
  timezone?: string;
};

export type BeeUtterance = {
  id?: number | string;
  text?: string;
  speaker?: string;
  startMs?: number;
  endMs?: number;
  timestamp?: number;
};

export type BeeTranscriptionBlock = {
  utterances?: BeeUtterance[];
  lines?: { speaker?: string; text?: string }[];
};

export type BeeConversation = {
  id: number | string;
  summary?: string;
  short_summary?: string;
  title?: string;
  startedAt?: number;
  endedAt?: number;
  started_at?: number | string;
  ended_at?: number | string;
  start_time?: number | string;
  end_time?: number | string;
  state?: string;
  utterances?: BeeUtterance[];
  transcriptions?: BeeTranscriptionBlock[];
};

export type BeeTodo = {
  id: number | string;
  text: string;
  completed?: boolean;
  alarm_at?: number | null;
  createdAt?: number;
};

export type BeeTodoSuggestion = {
  id: number | string;
  text: string;
  conversationId?: number | string;
};

export type ListResponse<T> = {
  items?: T[];
  conversations?: T[];
  todos?: T[];
  suggestions?: T[];
  next_cursor?: string | null;
};

export type SearchHit = {
  type?: string;
  conversation?: BeeConversation;
  daily?: { id: string; date?: string; summary?: string };
  fact?: { id: string; text?: string };
};
