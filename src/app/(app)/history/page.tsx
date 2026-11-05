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
  const conversations = await listConversations(user.id, filter);

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
            const hasMessages = c._count.messages > 0;
            // 메시지가 없는 대화에는 리포트 버튼을 두지 않는다(AUDIT K2).
            const action = c.report
              ? { href: `/history/${c.id}/report`, label: history.report }
              : !isCall && !c.endedAt
                ? { href: `/chat/${c.id}`, label: history.continueChat }
                : hasMessages
                  ? { href: `/history/${c.id}/report`, label: history.makeReport }
                  : null;
            return (
              <li key={c.id} className="list-item">
                <div className="list-main">
                  <Link href={`/history/${c.id}`}>
                    {kindLabel} · {themeLabel(c.theme)}
                    {c.title ? ` · ${c.title}` : ""}
                  </Link>
                  <span className="list-meta">
                    <span>{formatDateTime(c.startedAt)}</span>
                    <span>
                      {hasMessages ? common.messagesCount(c._count.messages) : history.noMessages}
                    </span>
                    {displayedCallSec(c) ? <span>{formatDurationWords(displayedCallSec(c)!)}</span> : null}
                    {c.endedAt ? (
                      <Badge>{common.ended}</Badge>
                    ) : (
                      <Badge tone="positive">{common.inProgress}</Badge>
                    )}
                    {c.report ? <Badge tone="accent">{common.hasReport}</Badge> : null}
                  </span>
                </div>
                {action ? (
                  <div className="list-actions">
                    <ButtonLink href={action.href} variant="secondary">
                      {action.label}
                    </ButtonLink>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
