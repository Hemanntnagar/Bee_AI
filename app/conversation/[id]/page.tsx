import { formatTranscript, getConversation } from "@/lib/bee/client";
import Link from "next/link";
import { ProcessConversation } from "./ProcessConversation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  let conversation;
  try {
    conversation = await getConversation(id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Conversation not found.";
    return (
      <div className="space-y-4">
        <p className="text-[var(--text-muted)]">{message}</p>
        <Link href="/setup" className="bl-link text-sm font-medium">
          Check Bee setup →
        </Link>
      </div>
    );
  }

  const summary =
    conversation.summary ||
    conversation.title ||
    `Conversation ${conversation.id}`;
  const transcript = formatTranscript(conversation);
  const preview =
    transcript.length > 1200 ? `${transcript.slice(0, 1200)}…` : transcript;

  return (
    <>
      <p className="mb-2 text-sm text-[var(--text-muted)]">
        <Link href="/" className="bl-link font-medium">
          ← Today
        </Link>
      </p>
      <h1 className="mb-6 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--green)]">
        Process conversation
      </h1>
      <ProcessConversation
        conversationId={String(conversation.id)}
        summary={summary}
        transcriptPreview={preview || undefined}
      />
    </>
  );
}
