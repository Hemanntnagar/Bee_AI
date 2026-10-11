import { getDueCards, readStore, updateCard } from "@/lib/store/persist";
import { applyReview, type ReviewGrade } from "@/lib/review/sm2";
import { NextResponse } from "next/server";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({
    due: getDueCards(store.cards),
    total: store.cards.length,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { cardId: string; grade: ReviewGrade };
  const store = await readStore();
  const card = store.cards.find((c) => c.id === body.cardId);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  const next = applyReview(card, body.grade);
  const updated = await updateCard(body.cardId, next);
  return NextResponse.json({ card: updated });
}
