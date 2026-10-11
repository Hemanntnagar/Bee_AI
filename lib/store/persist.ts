import fs from "fs/promises";
import path from "path";
import type { BeeLoopStore, LocalCommitment, StudyCard } from "./types";

const STORE_DIR = path.join(process.cwd(), ".bee-loop");
const STORE_FILE = path.join(STORE_DIR, "store.json");

const emptyStore = (): BeeLoopStore => ({
  processedConversationIds: [],
  cards: [],
  localCommitments: [],
});

export async function readStore(): Promise<BeeLoopStore> {
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

async function writeStore(store: BeeLoopStore): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function addCards(cards: StudyCard[]): Promise<BeeLoopStore> {
  const store = await readStore();
  store.cards.push(...cards);
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
