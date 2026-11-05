import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { CallView } from "@/components/call/CallView";
import { callLive, common } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { canExtend } from "@/services/call/duration";

export const metadata = { title: common.pageTitle(callLive.pageTitle) };

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [conv, settings] = await Promise.all([
    prisma.conversation.findFirst({
      where: { id, userId: user.id, kind: "call" },
      include: { messages: { orderBy: { index: "asc" } }, report: { select: { id: true } } },
    }),
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
  ]);
  if (!conv) notFound();
  if (conv.endedAt) redirect(`/history/${conv.id}/report`);
  const theme = THEMES[conv.theme as keyof typeof THEMES];
  // 통화를 시작하면 상대의 첫 인사가 index 0 의 assistant 메시지로 저장된다. 화면에서는 따로 그리므로 목록에서 뺀다.
  const opening = conv.messages[0]?.role === "assistant" ? conv.messages[0] : null;
  return (
    <CallView
      conversationId={conv.id}
      themeLabel={theme?.label ?? conv.theme}
      openingLine={opening?.content ?? theme?.openingLine ?? "Hello! Let's get started."}
      durationSec={conv.durationSec ?? 600}
      startedAtMs={conv.startedAt.getTime()}
      started={conv.messages.length > 0}
      extendable={canExtend(conv.durationSec ?? 600)}
      ttsVoice={settings?.ttsVoice ?? null}
      initialMessages={conv.messages
        .filter((m) => m !== opening)
        .map((m) => ({ id: m.id, role: m.role, content: m.content }))}
    />
  );
}
