import { formatTranscript, getConversation } from "@/lib/bee/client";
import { extractCommitments } from "@/lib/extract/commitments";
import { extractStudyPack } from "@/lib/extract/study";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const conversation = await getConversation(id);
    const transcript = formatTranscript(conversation);
    const [studyPack, commitments] = await Promise.all([
      extractStudyPack(id, transcript, conversation.summary),
      extractCommitments(transcript),
    ]);
    return NextResponse.json({ studyPack, commitments, conversation });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Process failed" },
      { status: 500 }
    );
  }
}
