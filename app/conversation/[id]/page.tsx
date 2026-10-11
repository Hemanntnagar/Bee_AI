import { getConversation } from "@/lib/bee/client";
import { ProcessConversation } from "./ProcessConversation";

type Props = { params: Promise<{ id: string }> };

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  let conversation;
  try {
    conversation = await getConversation(id);
  } catch {
    return <p className="text-[var(--text-muted)]">Conversation not found.</p>;
  }

  return (
    <>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--accent)] mb-6">
        Process conversation
      </h1>
      <ProcessConversation
        conversationId={String(conversation.id)}
        summary={conversation.summary}
      />
    </>
  );
}
