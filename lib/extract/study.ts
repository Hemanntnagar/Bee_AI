import type { StudyPack } from "@/lib/store/types";

function heuristicStudyPack(
  conversationId: string,
  transcript: string,
  summary?: string
): StudyPack {
  const lines = transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const utterances = lines.filter((l) => l.includes(":"));
  const questions = utterances.filter((l) => l.includes("?"));
  const concepts = new Set<string>();

  const keywords = [
    "ATP",
    "mitochondria",
    "Krebs",
    "electron",
    "gradient",
    "estación",
    "tren",
  ];
  for (const kw of keywords) {
    if (transcript.toLowerCase().includes(kw.toLowerCase())) concepts.add(kw);
  }

  const cards: StudyPack["cards"] = [];

  for (const q of questions.slice(0, 5)) {
    const idx = utterances.indexOf(q);
    const answer = utterances[idx + 1];
    if (answer) {
      cards.push({
        front: q.replace(/^[^:]+:\s*/, ""),
        back: answer.replace(/^[^:]+:\s*/, ""),
        conversationId,
        sourceSnippet: q.slice(0, 120),
      });
    }
  }

  if (cards.length === 0 && summary) {
    cards.push({
      front: `What was the main topic?`,
      back: summary,
      conversationId,
      sourceSnippet: summary.slice(0, 120),
    });
  }

  if (cards.length === 0) {
    cards.push({
      front: "Summarize this conversation in one sentence.",
      back: transcript.slice(0, 300),
      conversationId,
    });
  }

  return {
    conversationId,
    title: summary?.slice(0, 80) ?? "Study session",
    keyConcepts: [...concepts],
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
              'Extract a study pack from the transcript. Return JSON: { "title": string, "keyConcepts": string[], "cards": [{ "front": string, "back": string, "sourceSnippet": string }] }. 3-8 cards max.',
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
    return {
      conversationId,
      title: parsed.title ?? summary ?? "Study session",
      keyConcepts: parsed.keyConcepts ?? [],
      cards: (parsed.cards ?? []).map((c) => ({
        front: c.front,
        back: c.back,
        conversationId,
        sourceSnippet: c.sourceSnippet,
      })),
    };
  } catch {
    return heuristicStudyPack(conversationId, transcript, summary);
  }
}
