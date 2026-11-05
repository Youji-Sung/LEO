import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { common, history } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { listConversations } from "@/services/conversation";
import { formatDateTime, formatDurationWords } from "@/lib/format";
import { displayedCallSec } from "@/services/call/duration";
import { Badge, ButtonLink, EmptyState, Segmented } from "@/components/ui";

export const metadata = { title: common.pageTitle(history.pageTitle) };

function themeLabel(theme: string): string {
  return THEMES[theme as keyof typeof THEMES]?.label ?? theme;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const user = await requireUser();
  const { kind } = await searchParams;
  const filter = kind === "chat" || kind === "call" ? kind : undefined;
  // 만들기만 하고 말하지 않은 대화는 홈과 같은 기준으로 숨긴다(외부 피드백 3).
  const conversations = await listConversations(user.id, filter, { onlyWithContent: true });

  return (
    <div className="stack">
      <div className="page-head">
        <h1>{history.pageTitle}</h1>
        <Segmented
          label={history.filterLabel}
          value={filter ?? "all"}
          items={[
            { id: "all", label: history.all, href: "/history" },
            { id: "call", label: history.calls, href: "/history?kind=call" },
            { id: "chat", label: history.chats, href: "/history?kind=chat" },
          ]}
        />
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          title={filter ? history.emptyFiltered : history.empty}
          action={
            <ButtonLink href="/call" variant="primary">
              {history.startCall}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="list" data-testid="history-list">
          {conversations.map((c) => {
            const isCall = c.kind === "call";
            const kindLabel = isCall ? common.callLabel : common.chatLabel;
            // 목록의 대화는 모두 내가 한 말이나 리포트가 있으므로 리포트 버튼을 둘 수 있다(AUDIT K2).
            const action = c.report
              ? { href: `/history/${c.id}/report`, label: history.report }
              : !isCall && !c.endedAt
                ? { href: `/chat/${c.id}`, label: history.continueChat }
                : { href: `/history/${c.id}/report`, label: history.makeReport };
            return (
              <li key={c.id} className="list-item">
                <div className="list-main">
                  <Link href={`/history/${c.id}`}>
                    {kindLabel} · {themeLabel(c.theme)}
                    {c.title ? ` · ${c.title}` : ""}
                  </Link>
                  <span className="list-meta">
                    <span>{formatDateTime(c.startedAt)}</span>
                    <span>{common.messagesCount(c._count.messages)}</span>
                    {displayedCallSec(c) ? <span>{formatDurationWords(displayedCallSec(c)!)}</span> : null}
                    {c.endedAt ? (
                      <Badge>{common.ended}</Badge>
                    ) : (
                      <Badge tone="positive">{common.inProgress}</Badge>
                    )}
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
      )}
    </div>
  );
}
