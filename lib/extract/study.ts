import type { StudyPack } from "@/lib/store/types";

type Utterance = { speaker: string; text: string };

function parseUtterances(transcript: string): Utterance[] {
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

function isQuestion(text: string): boolean {
  const t = text.trim();
  if (t.endsWith("?")) return true;
  return /^(what|why|how|when|where|who|which|can you|could you|do you|does|is|are|explain)\b/i.test(
    t
  );
}

function cleanCardText(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/^["']|["']$/g, "");
}

function isJunkCard(front: string, back: string): boolean {
  const f = front.toLowerCase();
  const b = back.toLowerCase();
  if (front.length < 8 || back.length < 8) return true;
  if (front.length > 280 || back.length > 600) return true;
  if (f === b) return true;
  if (/^(um+|uh+|yeah|ok|okay|hmm+)\.?$/i.test(front)) return true;
  if (/^(um+|uh+|yeah|ok|okay|hmm+)\.?$/i.test(back)) return true;
  return false;
}

function dedupeCards(
  cards: StudyPack["cards"]
): StudyPack["cards"] {
  const seen = new Set<string>();
  const out: StudyPack["cards"] = [];
  for (const c of cards) {
    const key = `${c.front.toLowerCase().slice(0, 80)}|${c.back.toLowerCase().slice(0, 80)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function extractDefinitionCards(
  utterances: Utterance[],
  conversationId: string
): StudyPack["cards"] {
  const cards: StudyPack["cards"] = [];
  const defRe =
    /\b([A-Z][A-Za-z0-9\s\-]{2,40}?)\s+(?:is|are|means|refers to|stands for)\s+(.+)/i;

  for (const u of utterances) {
    if (isQuestion(u.text)) continue;
    const m = u.text.match(defRe);
    if (!m) continue;
    const term = cleanCardText(m[1]);
    const def = cleanCardText(m[2]);
    if (/^(what|why|how|when|where|who|which|worst|best)$/i.test(term)) continue;
    if (isJunkCard(`What is ${term}?`, def)) continue;
    cards.push({
      front: `What is ${term}?`,
      back: def.replace(/\.$/, ""),
      conversationId,
      sourceSnippet: u.text.slice(0, 140),
    });
  }
  return cards;
}

function extractQaCards(
  utterances: Utterance[],
  conversationId: string
): StudyPack["cards"] {
  const cards: StudyPack["cards"] = [];
  for (let i = 0; i < utterances.length - 1; i++) {
    const q = utterances[i];
    const a = utterances[i + 1];
    if (!isQuestion(q.text)) continue;
    if (q.speaker === a.speaker && a.text.length < 40) continue;
    const front = cleanCardText(q.text);
    const back = cleanCardText(a.text);
    if (isJunkCard(front, back)) continue;
    cards.push({
      front,
      back,
      conversationId,
      sourceSnippet: q.text.slice(0, 140),
    });
  }
  return cards;
}

function extractConceptTags(transcript: string): string[] {
  const concepts = new Set<string>();
  const known = [
    "ATP",
    "mitochondria",
    "Krebs",
    "electron transport",
    "gradient",
    "photosynthesis",
    "DNA",
    "RNA",
    "algorithm",
    "API",
    "database",
    "estación",
    "tren",
  ];
  const lower = transcript.toLowerCase();
  for (const kw of known) {
    if (lower.includes(kw.toLowerCase())) concepts.add(kw);
  }

  // Capitalized multi-word phrases that look like course terms
  const caps = transcript.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) ?? [];
  for (const c of caps) {
    if (c.length < 4 || c.length > 40) continue;
    if (/^(Speaker|Owner|Summary|I|The|A|An|This|That|We|You)$/.test(c)) continue;
    concepts.add(c);
  }
  return [...concepts].slice(0, 8);
}

function heuristicStudyPack(
  conversationId: string,
  transcript: string,
  summary?: string
): StudyPack {
  const utterances = parseUtterances(transcript);
  let cards = dedupeCards([
    ...extractDefinitionCards(utterances, conversationId),
    ...extractQaCards(utterances, conversationId),
  ]).slice(0, 8);

  if (cards.length === 0 && summary && summary.trim().length >= 12) {
    cards = [
      {
        front: "What was the main topic of this conversation?",
        back: cleanCardText(summary),
        conversationId,
        sourceSnippet: summary.slice(0, 140),
      },
    ];
  }

  if (cards.length === 0) {
    const body = utterances
      .map((u) => u.text)
      .join(" ")
      .slice(0, 280);
    cards = [
      {
        front: "Summarize this conversation in one sentence.",
        back: body || "No transcript available.",
        conversationId,
      },
    ];
  }

  return {
    conversationId,
    title: summary?.slice(0, 80) || cards[0]?.front.slice(0, 60) || "Study session",
    keyConcepts: extractConceptTags(transcript),
    cards,
  };
}

function normalizeLlmPack(
  conversationId: string,
  summary: string | undefined,
  parsed: {
    title?: string;
    keyConcepts?: string[];
    cards?: { front: string; back: string; sourceSnippet?: string }[];
  }
): StudyPack {
  const cards = dedupeCards(
    (parsed.cards ?? [])
      .map((c) => ({
        front: cleanCardText(c.front ?? ""),
        back: cleanCardText(c.back ?? ""),
        conversationId,
        sourceSnippet: c.sourceSnippet?.slice(0, 140),
      }))
      .filter((c) => !isJunkCard(c.front, c.back))
  ).slice(0, 8);

  if (cards.length === 0) {
    return {
      conversationId,
      title: summary?.slice(0, 80) || "Study session",
      keyConcepts: parsed.keyConcepts?.filter(Boolean).slice(0, 8) ?? [],
      cards: summary
        ? [
            {
              front: "What was the main topic of this conversation?",
              back: cleanCardText(summary),
              conversationId,
              sourceSnippet: summary.slice(0, 140),
            },
          ]
        : [],
    };
  }

  return {
    conversationId,
    title: parsed.title?.trim() || summary?.slice(0, 80) || "Study session",
    keyConcepts: (parsed.keyConcepts ?? []).filter(Boolean).slice(0, 8),
    cards,
  };
}

export async function extractStudyPack(
  conversationId: string,
  transcript: string,
  summary?: string
): Promise<StudyPack> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return heuristicStudyPack(conversationId, transcript, summary);
  }

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
              'Extract a study pack for spaced-repetition flashcards. Return JSON: { "title": string, "keyConcepts": string[], "cards": [{ "front": string, "back": string, "sourceSnippet": string }] }. Rules: 3-8 cards; front is a clear question; back is a concise answer; skip chit-chat, ums, and vague lines; prefer definitions and exam-style facts.',
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
    if (!content) throw new Error("Empty LLM");
    const parsed = JSON.parse(content) as {
      title?: string;
      keyConcepts?: string[];
      cards?: { front: string; back: string; sourceSnippet?: string }[];
    };
    return normalizeLlmPack(conversationId, summary, parsed);
  } catch {
    return heuristicStudyPack(conversationId, transcript, summary);
  }
}
