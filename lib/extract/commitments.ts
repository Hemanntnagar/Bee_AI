export type CommitmentCandidate = {
  text: string;
  dueHint?: string;
};

const COMMITMENT_PATTERNS = [
  /\bI(?:'ll| will)\s+(.+?)(?:\.|$)/gi,
  /\bI need to\s+(.+?)(?:\.|$)/gi,
  /\bremind me to\s+(.+?)(?:\.|$)/gi,
  /\bby (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|tomorrow|next week)/gi,
];

function heuristicCommitments(transcript: string): CommitmentCandidate[] {
  const found: CommitmentCandidate[] = [];
  const seen = new Set<string>();

  for (const pattern of COMMITMENT_PATTERNS) {
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(transcript)) !== null) {
      const raw = m[0].trim();
      if (raw.length < 8 || seen.has(raw.toLowerCase())) continue;
      seen.add(raw.toLowerCase());
      found.push({ text: raw.replace(/\.$/, "") });
    }
  }

  return found.slice(0, 8);
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
              'List actionable commitments the owner made or was assigned. Return JSON: { "items": [{ "text": string, "dueHint": string|null }] }. Max 6 items.',
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
    return (parsed.items ?? []).map((i) => ({
      text: i.text,
      dueHint: i.dueHint ?? undefined,
    }));
  } catch {
    return heuristicCommitments(transcript);
  }
}
