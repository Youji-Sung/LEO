import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { NewChatForm } from "@/components/chat/NewChatForm";
import { THEMES } from "@/services/claude/prompts/themes";
import { listConversations } from "@/services/conversation";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "채팅 — LEO" };

export default async function ChatListPage() {
  const user = await requireUser();
  const [settings, conversations] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
    listConversations(user.id, "chat"),
  ]);
  const themes = Object.values(THEMES)
    .filter((t) => t.id !== "portfolio")
    .map((t) => ({ id: t.id, label: t.label, description: t.description }));

  return (
    <>
      <h1>채팅</h1>
      <NewChatForm themes={themes} hintsDefault={settings?.hintsDefault ?? false} />
      <h2>이전 대화</h2>
      {conversations.length === 0 ? (
        <p className="muted">아직 대화가 없습니다.</p>
      ) : (
        <ul className="list">
          {conversations.map((c) => (
            <li key={c.id} className="list-item">
              <Link href={`/chat/${c.id}`}>{c.title ?? "(제목 없음)"}</Link>
              <span className="muted">
                {THEMES[c.theme as keyof typeof THEMES]?.label ?? c.theme} · 메시지 {c._count.messages}개 · {formatDateTime(c.updatedAt)}
                {c.report ? " · 리포트 있음" : ""}
                {c.endedAt ? " · 종료" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
