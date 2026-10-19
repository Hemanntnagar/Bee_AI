#!/usr/bin/env node
/**
 * Clear local Bee Loop state for a clean demo.
 * Usage:
 *   node scripts/reset-local.mjs
 *   node scripts/reset-local.mjs --seed   # also seed 2 due study cards from fixtures narrative
 */

import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const root = process.cwd();
const dir = path.join(root, ".bee-loop");
const file = path.join(dir, "store.json");
const seed = process.argv.includes("--seed");

const empty = {
  processedConversationIds: [],
  cards: [],
  localCommitments: [],
};

if (seed) {
  const now = Date.now();
  empty.processedConversationIds = ["conv-103"];
  empty.cards = [
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
  ];
  empty.localCommitments = [
    {
      id: randomUUID(),
      text: "Finish the problem set before office hours tomorrow",
      conversationId: "conv-103",
      pushed: false,
      createdAt: now,
    },
  ];
}

await fs.mkdir(dir, { recursive: true });
await fs.writeFile(file, JSON.stringify(empty, null, 2), "utf8");
console.log(
  seed
    ? "Reset .bee-loop/store.json with seeded lecture cards (2 due) + 1 commitment."
    : "Reset .bee-loop/store.json to empty."
);
console.log("Path:", file);
