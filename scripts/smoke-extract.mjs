/**
 * Heuristic extractor smoke (no OpenAI). Run: node scripts/smoke-extract.mjs
 * Mirrors the fixture conversation used in lib/bee/fixtures.ts
 */

function parseUtterances(transcript) {
  return transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith("Summary:"))
    .map((l) => {
      const idx = l.indexOf(":");
      if (idx <= 0) return { speaker: "Speaker", text: l };
      return {
        speaker: l.slice(0, idx).trim(),
        text: l.slice(idx + 1).trim(),
      };
    })
    .filter((u) => u.text.length >= 3);
}

function normalizeCommitment(raw) {
  let t = raw.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  t = t.replace(/^I(?:'ll| will)\s+/i, "");
  t = t.replace(/^I need to\s+/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const transcript = `Summary: Cell biology review — mitochondria and ATP synthesis
Owner: Can you explain how the electron transport chain produces ATP?
Tutor: The chain pumps protons into the intermembrane space, creating a gradient. ATP synthase uses that flow to phosphorylate ADP into ATP.
Owner: I will send my notes on Krebs cycle to the study group by Friday.
Owner: Mitochondria is the powerhouse of the cell.`;

const utterances = parseUtterances(transcript);
const qa = [];
for (let i = 0; i < utterances.length - 1; i++) {
  if (utterances[i].text.includes("?")) {
    qa.push({
      front: utterances[i].text,
      back: utterances[i + 1].text,
    });
  }
}
const defs = utterances
  .map((u) => u.text.match(/\b(.+?)\s+is\s+(.+)/i))
  .filter(Boolean)
  .map((m) => ({ front: `What is ${m[1]}?`, back: m[2] }));

const commitMatch = transcript.match(/\bI will\s+(.+?)(?:\.|$)/i);
const commitment = commitMatch
  ? normalizeCommitment(commitMatch[0])
  : null;

console.log("utterances", utterances.length);
console.log("qa_cards", qa.length, qa[0]?.front?.slice(0, 50));
console.log("def_cards", defs.length, defs[0]?.front);
console.log("commitment", commitment);
if (!qa.length || !commitment) {
  console.error("SMOKE FAIL");
  process.exit(1);
}
console.log("SMOKE OK");
