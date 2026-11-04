import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { common, history } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { listConversations } from "@/services/conversation";
import { formatDateTime, formatDuration } from "@/lib/format";

export const metadata = { title: common.pageTitle(history.pageTitle) };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const user = await requireUser();
  const { kind } = await searchParams;
  const filter = kind === "chat" || kind === "call" ? kind : undefined;
  const conversations = await listConversations(user.id, filter);
  return (
    <>
      <h1>{history.pageTitle}</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <Link className={`btn ${!filter ? "btn-primary" : ""}`} href="/history">
          {history.all}
        </Link>
        <Link className={`btn ${filter === "call" ? "btn-primary" : ""}`} href="/history?kind=call">
          {history.calls}
        </Link>
        <Link className={`btn ${filter === "chat" ? "btn-primary" : ""}`} href="/history?kind=chat">
          {history.chats}
        </Link>
      </div>
      {conversations.length === 0 ? (
        <p className="muted">{filter ? history.emptyFiltered : history.empty}</p>
      ) : (
        <ul className="list" data-testid="history-list">
          {conversations.map((c) => (
            <li key={c.id} className="list-item">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <Link href={`/history/${c.id}`}>
                  {c.kind === "call" ? common.callLabel : common.chatLabel} ·{" "}
                  {THEMES[c.theme as keyof typeof THEMES]?.label ?? c.theme}
                  {c.title ? ` · ${c.title}` : ""}
                </Link>
                <span className="row">
                  {c.report ? (
                    <Link className="btn" href={`/history/${c.id}/report`}>
                      {history.report}
                    </Link>
                  ) : c.kind === "chat" && !c.endedAt ? (
                    <Link className="btn" href={`/chat/${c.id}`}>
                      {history.continueChat}
                    </Link>
                  ) : (
                    <Link className="btn" href={`/history/${c.id}/report`}>
                      {history.makeReport}
                    </Link>
                  )}
                </span>
              </div>
              <span className="muted">
                {formatDateTime(c.startedAt)} · {common.messagesCount(c._count.messages)}
                {c.durationSec ? ` · ${formatDuration(c.durationSec)}` : ""}
                {c.endedAt ? ` · ${common.ended}` : ` · ${common.inProgress}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
