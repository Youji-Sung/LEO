import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { THEMES } from "@/services/claude/prompts/themes";
import { listConversations } from "@/services/conversation";
import { formatDateTime, formatDuration } from "@/lib/format";

export const metadata = { title: "기록 — LEO" };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const user = await requireUser();
  const { kind } = await searchParams;
  const filter = kind === "chat" || kind === "call" ? kind : undefined;
  const conversations = await listConversations(user.id, filter);
  return (
    <>
      <h1>기록</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <Link className={`btn ${!filter ? "btn-primary" : ""}`} href="/history">
          전체
        </Link>
        <Link className={`btn ${filter === "call" ? "btn-primary" : ""}`} href="/history?kind=call">
          전화 영어
        </Link>
        <Link className={`btn ${filter === "chat" ? "btn-primary" : ""}`} href="/history?kind=chat">
          채팅
        </Link>
      </div>
      {conversations.length === 0 ? (
        <p className="muted">기록이 없습니다.</p>
      ) : (
        <ul className="list" data-testid="history-list">
          {conversations.map((c) => (
            <li key={c.id} className="list-item">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <Link href={`/history/${c.id}`}>
                  {c.kind === "call" ? "📞 " : "💬 "}
                  {THEMES[c.theme as keyof typeof THEMES]?.label ?? c.theme}
                  {c.title ? ` · ${c.title}` : ""}
                </Link>
                <span className="row">
                  {c.report ? (
                    <Link className="btn" href={`/history/${c.id}/report`}>
                      리포트
                    </Link>
                  ) : c.kind === "chat" && !c.endedAt ? (
                    <Link className="btn" href={`/chat/${c.id}`}>
                      이어서 채팅
                    </Link>
                  ) : (
                    <Link className="btn" href={`/history/${c.id}/report`}>
                      리포트 생성
                    </Link>
                  )}
                </span>
              </div>
              <span className="muted">
                {formatDateTime(c.startedAt)} · 메시지 {c._count.messages}개
                {c.durationSec ? ` · ${formatDuration(c.durationSec)}` : ""}
                {c.endedAt ? " · 종료" : " · 진행 중"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
