import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { BeeLoopStore, LocalCommitment, StudyCard } from "./types";

const STORE_DIR = path.join(process.cwd(), ".bee-loop");
const STORE_FILE = path.join(STORE_DIR, "store.json");

/** Prefer memory on Vercel / serverless (no durable local FS). */
function isMemoryBackend(): boolean {
  return process.env.VERCEL === "1" || process.env.BEE_STORE === "memory";
}

declare global {
  var __beeLoopStore: BeeLoopStore | undefined;
  var __beeLoopStoreSeeded: boolean | undefined;
}

function emptyStore(): BeeLoopStore {
  return {
    processedConversationIds: [],
    cards: [],
    localCommitments: [],
  };
}

function seedDemoStore(): BeeLoopStore {
  const now = Date.now();
  return {
    processedConversationIds: ["conv-103"],
    cards: [
      {
        id: randomUUID(),
        front: "What is the average-case lookup time for a hash table?",
        back: "O(1) with a good hash function and load factor.",
        conversationId: "conv-103",
        sourceSnippet: "hash tables average O(1) lookup",
        ease: 2.5,
        intervalDays: 0,
        repetitions: 0,
        dueAt: now,
        createdAt: now,
      },
      {
        id: randomUUID(),
        front: "What is the worst case for a hash table with chaining?",
        back: "O(n) when every key collides into one bucket.",
        conversationId: "conv-103",
        sourceSnippet: "Worst case is O(n) when every key collides",
        ease: 2.5,
        intervalDays: 0,
        repetitions: 0,
        dueAt: now,
        createdAt: now,
      },
    ],
    localCommitments: [
      {
        id: randomUUID(),
        text: "Finish the problem set before office hours tomorrow",
        conversationId: "conv-103",
        pushed: false,
        createdAt: now,
      },
    ],
  };
}

function getMemoryStore(): BeeLoopStore {
  if (!globalThis.__beeLoopStore) {
    const shouldSeed =
      process.env.BEE_SEED !== "0" &&
      (process.env.VERCEL === "1" ||
        process.env.BEE_MOCK === "1" ||
        process.env.BEE_MOCK === "true");
    globalThis.__beeLoopStore = shouldSeed ? seedDemoStore() : emptyStore();
    globalThis.__beeLoopStoreSeeded = shouldSeed;
  }
  return globalThis.__beeLoopStore;
}

function setMemoryStore(store: BeeLoopStore): void {
  globalThis.__beeLoopStore = store;
}

async function readFileStore(): Promise<BeeLoopStore> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as BeeLoopStore;
    return {
      processedConversationIds: parsed.processedConversationIds ?? [],
      cards: parsed.cards ?? [],
      localCommitments: parsed.localCommitments ?? [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(store: BeeLoopStore): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function readStore(): Promise<BeeLoopStore> {
  if (isMemoryBackend()) {
    return structuredClone(getMemoryStore());
  }
  return readFileStore();
}

async function writeStore(store: BeeLoopStore): Promise<void> {
  if (isMemoryBackend()) {
    setMemoryStore(structuredClone(store));
    return;
  }
  await writeFileStore(store);
}

export async function addCards(cards: StudyCard[]): Promise<BeeLoopStore> {
  const store = await readStore();
  store.cards.push(...cards);
  await writeStore(store);
  return store;
}

/** Replace all cards for a conversation (re-process without stacking duplicates). */
export async function replaceCardsForConversation(
  conversationId: string,
  cards: StudyCard[]
): Promise<BeeLoopStore> {
  const store = await readStore();
  store.cards = [
    ...store.cards.filter((c) => c.conversationId !== conversationId),
    ...cards,
  ];
  await writeStore(store);
  return store;
}

export async function updateCard(
  id: string,
  patch: Partial<StudyCard>
): Promise<StudyCard | null> {
  const store = await readStore();
  const idx = store.cards.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  store.cards[idx] = { ...store.cards[idx], ...patch };
  await writeStore(store);
  return store.cards[idx];
}

export async function markConversationProcessed(id: string): Promise<void> {
  const store = await readStore();
  if (!store.processedConversationIds.includes(id)) {
    store.processedConversationIds.push(id);
    await writeStore(store);
  }
}

export async function addLocalCommitments(
  items: LocalCommitment[]
): Promise<BeeLoopStore> {
  const store = await readStore();
  store.localCommitments.push(...items);
  await writeStore(store);
  return store;
}

export async function updateLocalCommitment(
  id: string,
  patch: Partial<LocalCommitment>
): Promise<void> {
  const store = await readStore();
  const idx = store.localCommitments.findIndex((c) => c.id === id);
  if (idx >= 0) {
    store.localCommitments[idx] = { ...store.localCommitments[idx], ...patch };
    await writeStore(store);
  }
}

export function getDueCards(cards: StudyCard[], now = Date.now()): StudyCard[] {
  return cards.filter((c) => c.dueAt <= now);
}
