import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { CallView } from "@/components/call/CallView";
import { THEMES } from "@/services/claude/prompts/themes";
import { canExtend } from "@/services/call/duration";

export const metadata = { title: "통화 중 — LEO" };

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
  return (
    <CallView
      conversationId={conv.id}
      themeLabel={theme?.label ?? conv.theme}
      openingLine={theme?.openingLine ?? "Hello! Let's get started."}
      durationSec={conv.durationSec ?? 600}
      startedAtMs={conv.startedAt.getTime()}
      extendable={canExtend(conv.durationSec ?? 600)}
      ttsVoice={settings?.ttsVoice ?? null}
      initialMessages={conv.messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
    />
  );
}
