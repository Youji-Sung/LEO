import Link from "next/link";
import { MessageSquare, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { common, home, nav } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { hasContentWhere } from "@/services/conversation";
import { formatDateTime } from "@/lib/format";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";

export const metadata = { title: common.pageTitle(nav.home) };

function themeLabel(theme: string): string {
  return THEMES[theme as keyof typeof THEMES]?.label ?? theme;
}

export default async function HomePage() {
  const user = await requireUser();
  // 내가 한 말도 리포트도 없는 대화는 최근 목록에서 뺀다(AUDIT D1, 외부 피드백 3).
  const recent = await prisma.conversation.findMany({
    where: { userId: user.id, ...hasContentWhere },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { report: { select: { id: true } }, _count: { select: { messages: true } } },
  });

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1>{home.greeting(user.name)}</h1>
          <p>{home.intro}</p>
        </div>
      </div>

      <div className="grid-2">
        <Card as="section" title={home.startCall} titleId="home-start-call">
          <div className="stack">
            <p className="muted">{home.startCallDesc}</p>
            <div>
              <ButtonLink
                href="/call"
                variant="primary"
                icon={<Phone size={18} aria-hidden="true" />}
              >
                {home.startCall}
              </ButtonLink>
            </div>
          </div>
        </Card>
        <Card as="section" title={home.startChat} titleId="home-start-chat">
          <div className="stack">
            <p className="muted">{home.startChatDesc}</p>
            <div>
              <ButtonLink
                href="/chat"
                variant="secondary"
                icon={<MessageSquare size={18} aria-hidden="true" />}
              >
                {home.startChat}
              </ButtonLink>
            </div>
          </div>
        </Card>
      </div>

      <section className="stack" aria-labelledby="home-recent">
        <h2 id="home-recent">{home.recentTitle}</h2>
        {recent.length === 0 ? (
          <EmptyState title={home.recentEmpty} />
        ) : (
          <>
            <ul className="list">
              {recent.map((c) => {
                const kindLabel = c.kind === "call" ? common.callLabel : common.chatLabel;
                const action = c.report
                  ? { href: `/history/${c.id}/report`, label: home.viewReport }
                  : c.kind === "chat" && !c.endedAt
                    ? { href: `/chat/${c.id}`, label: home.continueChat }
                    : { href: `/history/${c.id}`, label: home.viewTranscript };
                return (
                  <li key={c.id} className="list-item">
                    <div className="list-main">
                      <Link href={`/history/${c.id}`}>
                        {kindLabel} · {themeLabel(c.theme)}
                        {c.title ? ` · ${c.title}` : ""}
                      </Link>
                      <span className="list-meta">
                        <span>{formatDateTime(c.updatedAt)}</span>
                        <span>{common.messagesCount(c._count.messages)}</span>
                        {c.report ? <Badge tone="accent">{common.hasReport}</Badge> : null}
                      </span>
                    </div>
                    <div className="list-actions">
                      <ButtonLink href={action.href} variant="secondary">
                        {action.label}
                      </ButtonLink>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div>
              <ButtonLink href="/history" variant="ghost">
                {home.seeAll}
              </ButtonLink>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
