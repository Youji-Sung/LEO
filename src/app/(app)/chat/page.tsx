import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { NewChatForm } from "@/components/chat/NewChatForm";
import { chat, common } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { listConversations } from "@/services/conversation";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: common.pageTitle(chat.pageTitle) };

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
      <h1>{chat.pageTitle}</h1>
      <NewChatForm themes={themes} hintsDefault={settings?.hintsDefault ?? false} />
      <h2>{chat.previousTitle}</h2>
      {conversations.length === 0 ? (
        <p className="muted">{chat.previousEmpty}</p>
      ) : (
        <ul className="list">
          {conversations.map((c) => (
            <li key={c.id} className="list-item">
              <Link href={`/chat/${c.id}`}>{c.title ?? chat.untitled}</Link>
              <span className="muted">
                {THEMES[c.theme as keyof typeof THEMES]?.label ?? c.theme} · {common.messagesCount(c._count.messages)} · {formatDateTime(c.updatedAt)}
                {c.report ? ` · ${common.hasReport}` : ""}
                {c.endedAt ? ` · ${common.ended}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
