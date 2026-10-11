import { formatTranscript, getConversation } from "@/lib/bee/client";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const conversation = await getConversation(id);
    return NextResponse.json({
      conversation,
      transcript: formatTranscript(conversation),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Not found" },
      { status: 404 }
    );
  }
}
