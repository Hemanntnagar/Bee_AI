import { addLocalCommitments, readStore } from "@/lib/store/persist";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ commitments: store.localCommitments });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    conversationId: string;
    items: { text: string }[];
  };
  const now = Date.now();
  const commitments = body.items.map((i) => ({
    id: randomUUID(),
    text: i.text,
    conversationId: body.conversationId,
    pushed: false,
    createdAt: now,
  }));
  await addLocalCommitments(commitments);
  return NextResponse.json({ saved: commitments.length, commitments });
}
