import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { ChatView } from "@/components/chat/ChatView";
import { chat, common } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";

export const metadata = { title: common.pageTitle(chat.pageTitle) };

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const conv = await prisma.conversation.findFirst({
    where: { id, userId: user.id, kind: "chat" },
    include: { messages: { orderBy: { index: "asc" } }, report: { select: { id: true } } },
  });
  if (!conv) notFound();
  return (
    <>
      <h1 className="sr-only">{chat.pageTitle}</h1>
      <ChatView
        conversationId={conv.id}
        themeLabel={THEMES[conv.theme as keyof typeof THEMES]?.label ?? conv.theme}
        title={conv.title}
        initialMessages={conv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          hint: m.hint,
          index: m.index,
        }))}
        initialHints={conv.hintsEnabled}
        ended={Boolean(conv.endedAt)}
        hasReport={Boolean(conv.report)}
      />
    </>
  );
}
