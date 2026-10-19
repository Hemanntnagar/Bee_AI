import {
  addLocalCommitments,
  readStore,
  updateLocalCommitment,
} from "@/lib/store/persist";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ commitments: store.localCommitments });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      conversationId: string;
      items: { text: string }[];
    };
    if (!body.conversationId?.trim()) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }
    const items = (body.items ?? []).filter((i) => i.text?.trim());
    if (items.length === 0) {
      return NextResponse.json({ saved: 0, commitments: [] });
    }

    const store = await readStore();
    const existing = new Set(
      store.localCommitments
        .filter((c) => c.conversationId === body.conversationId)
        .map((c) => c.text.toLowerCase())
    );

    const now = Date.now();
    const commitments = items
      .map((i) => ({
        id: randomUUID(),
        text: i.text.trim(),
        conversationId: body.conversationId,
        pushed: false,
        createdAt: now,
      }))
      .filter((c) => !existing.has(c.text.toLowerCase()));

    if (commitments.length) {
      await addLocalCommitments(commitments);
    }
    return NextResponse.json({ saved: commitments.length, commitments });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id: string;
      pushed?: boolean;
      beeTodoId?: string;
    };
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await updateLocalCommitment(body.id, {
      pushed: body.pushed,
      beeTodoId: body.beeTodoId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}
