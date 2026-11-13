import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { NewChatForm } from "@/components/chat/NewChatForm";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";
import { chat, common, home } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { listConversations } from "@/services/conversation";
import { formatDateTime } from "@/lib/format";
import { learningSnapshot } from "@/services/learning";

export const metadata = { title: common.pageTitle(chat.pageTitle) };

export default async function ChatListPage({
  searchParams,
}: {
  searchParams: Promise<{ learn?: string }>;
}) {
  const user = await requireUser();
  const learn = (await searchParams).learn;
  const targets =
    typeof learn === "string"
      ? await learningSnapshot(user.id, learn.split(",").slice(0, 3)).catch(() => [])
      : [];
  const [settings, conversations] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
    // 시작만 하고 아무 말도 하지 않은 채팅은 기록·홈과 같은 기준으로 숨긴다(외부 피드백 3).
    listConversations(user.id, "chat", { onlyWithContent: true }),
  ]);
  const themes = Object.values(THEMES)
    .filter((t) => t.id !== "portfolio")
    .map((t) => ({ id: t.id, label: t.label, description: t.description }));

  return (
    <div className="container-narrow stack-lg" style={{ margin: 0 }}>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <h1>{chat.pageTitle}</h1>
      </div>
      <NewChatForm
        themes={themes}
        hintsDefault={settings?.hintsDefault ?? false}
        learningItemIds={targets.map((target) => target.id)}
        learningPhrases={targets.map((target) => target.phrase)}
      />
      <section className="stack">
        <h2>{chat.previousTitle}</h2>
        {conversations.length === 0 ? (
          <EmptyState title={chat.previousEmpty} />
        ) : (
          <ul className="list">
            {conversations.map((c) => {
              const ended = Boolean(c.endedAt);
              return (
                <li key={c.id} className="list-item">
                  <div className="list-main">
                    <Link href={`/chat/${c.id}`}>{c.title ?? chat.untitled}</Link>
                    <div className="list-meta">
                      <span>{formatDateTime(c.updatedAt)}</span>
                      <span>{common.messagesCount(c._count.messages)}</span>
                      <Badge>{THEMES[c.theme as keyof typeof THEMES]?.label ?? c.theme}</Badge>
                      {c.report ? <Badge tone="positive">{common.hasReport}</Badge> : null}
                      {ended ? <Badge>{common.ended}</Badge> : null}
                    </div>
                  </div>
                  <div className="list-actions">
                    {!ended ? (
                      <ButtonLink href={`/chat/${c.id}`} variant="secondary">
                        {home.continueChat}
                      </ButtonLink>
                    ) : c.report ? (
                      <ButtonLink href={`/history/${c.id}/report`} variant="secondary">
                        {home.viewReport}
                      </ButtonLink>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
