import {
  markConversationProcessed,
  replaceCardsForConversation,
} from "@/lib/store/persist";
import { initialSchedule } from "@/lib/review/sm2";
import type { StudyCard } from "@/lib/store/types";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

type Body = {
  conversationId: string;
  cards: {
    front: string;
    back: string;
    sourceSnippet?: string;
    conversationId?: string;
  }[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.conversationId?.trim()) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const usable = (body.cards ?? []).filter(
      (c) => c.front?.trim() && c.back?.trim()
    );
    if (usable.length === 0) {
      return NextResponse.json(
        { error: "Add at least one card with front and back text" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const sched = initialSchedule(now);
    const toSave: StudyCard[] = usable.map((c) => ({
      id: randomUUID(),
      front: c.front.trim(),
      back: c.back.trim(),
      conversationId: c.conversationId || body.conversationId,
      sourceSnippet: c.sourceSnippet,
      ease: sched.ease,
      intervalDays: sched.intervalDays,
      repetitions: sched.repetitions,
      dueAt: sched.dueAt,
      createdAt: now,
    }));

    const store = await replaceCardsForConversation(
      body.conversationId,
      toSave
    );
    await markConversationProcessed(body.conversationId);
    return NextResponse.json({ saved: toSave.length, store });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 400 }
    );
  }
}
