export type CommitmentCandidate = {
  text: string;
  dueHint?: string;
};

const SKIP =
  /\b(i'll be|i will be|i'll just|i'll see|i'll think|i'll try to remember|we'll see)\b/i;

const PATTERNS: { re: RegExp; dueFromMatch?: boolean }[] = [
  { re: /\bI(?:'ll| will)\s+(.+?)(?:\.|$)/gi },
  { re: /\bI need to\s+(.+?)(?:\.|$)/gi },
  { re: /\bI have to\s+(.+?)(?:\.|$)/gi },
  { re: /\bI should\s+(.+?)(?:\.|$)/gi },
  { re: /\bremind me to\s+(.+?)(?:\.|$)/gi },
  { re: /\bdon't let me forget to\s+(.+?)(?:\.|$)/gi },
  { re: /\blet me\s+(send|email|call|finish|write|submit|share)\s+(.+?)(?:\.|$)/gi },
  {
    re: /\b(?:by|before)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|tomorrow|tonight|next week|EOD|end of day)\b/gi,
    dueFromMatch: true,
  },
];

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Turn "I'll send notes by Friday" into a clean todo-like phrase. */
export function normalizeCommitment(raw: string): string {
  let t = raw.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  t = t.replace(/^(Speaker|Owner|Tutor|Friend)\s*:\s*/i, "");
  t = t.replace(/^I(?:'ll| will)\s+/i, "");
  t = t.replace(/^I need to\s+/i, "");
  t = t.replace(/^I have to\s+/i, "");
  t = t.replace(/^I should\s+/i, "");
  t = t.replace(/^remind me to\s+/i, "");
  t = t.replace(/^don't let me forget to\s+/i, "");
  t = t.replace(/^let me\s+/i, "");
  return capitalize(t.trim());
}

function isUsefulCommitment(text: string): boolean {
  const t = text.trim();
  if (t.length < 8 || t.length > 160) return false;
  if (SKIP.test(t)) return false;
  if (/\?$/.test(t)) return false;
  // Prefer verbs / concrete actions
  if (
    !/\b(send|email|call|finish|write|submit|share|review|buy|schedule|book|pay|meet|prepare|study|read|fix|message|deliver|upload|fix|check)\b/i.test(
      t
    ) &&
    !/\b(by|before)\s+\w+/i.test(t)
  ) {
    // Still allow short "I need to X" style after normalize if it has a noun phrase
    if (t.split(/\s+/).length < 3) return false;
  }
  return true;
}

function extractDueHint(text: string): string | undefined {
  const m = text.match(
    /\b(?:by|before)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|tomorrow|tonight|next week|EOD|end of day)\b/i
  );
  return m ? m[1] : undefined;
}

function heuristicCommitments(transcript: string): CommitmentCandidate[] {
  const found: CommitmentCandidate[] = [];
  const seen = new Set<string>();

  // Prefer owner-ish lines when speakers are labeled
  const lines = transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const ownerBias = lines.filter((l) =>
    /^(Owner|Me|I|User|Sunny)\s*:/i.test(l)
  );
  const searchText =
    ownerBias.length > 0 ? ownerBias.join("\n") : transcript;

  for (const { re } of PATTERNS) {
    let m: RegExpExecArray | null;
    const local = new RegExp(re.source, re.flags);
    while ((m = local.exec(searchText)) !== null) {
      const raw = m[0].trim();
      if (SKIP.test(raw)) continue;
      const text = normalizeCommitment(raw);
      const key = text.toLowerCase();
      if (seen.has(key) || !isUsefulCommitment(text)) continue;
      seen.add(key);
      found.push({
        text,
        dueHint: extractDueHint(raw),
      });
    }
  }

  return found.slice(0, 6);
}

export async function extractCommitments(
  transcript: string
): Promise<CommitmentCandidate[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return heuristicCommitments(transcript);

  const base = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'List actionable commitments the OWNER made (promises, tasks, deadlines). Return JSON: { "items": [{ "text": string, "dueHint": string|null }] }. Rules: imperative todo phrasing (e.g. "Send notes to study group by Friday"); max 6; skip vague intentions, questions, and other people\'s tasks.',
          },
          { role: "user", content: transcript.slice(0, 12000) },
        ],
      }),
    });
    if (!res.ok) throw new Error("LLM failed");
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty");
    const parsed = JSON.parse(content) as {
      items?: { text: string; dueHint?: string | null }[];
    };
    const seen = new Set<string>();
    const items: CommitmentCandidate[] = [];
    for (const i of parsed.items ?? []) {
      const text = normalizeCommitment(i.text ?? "");
      const key = text.toLowerCase();
      if (!text || seen.has(key) || !isUsefulCommitment(text)) continue;
      seen.add(key);
      items.push({
        text,
        dueHint: i.dueHint ?? extractDueHint(text) ?? undefined,
      });
    }
    return items.length > 0 ? items.slice(0, 6) : heuristicCommitments(transcript);
  } catch {
    return heuristicCommitments(transcript);
  }
}
