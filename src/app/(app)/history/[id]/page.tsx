import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { THEMES } from "@/services/claude/prompts/themes";
import { getOwnedReport } from "@/services/report";
import { formatDateTime, formatDuration } from "@/lib/format";

export const metadata = { title: "트랜스크립트 — LEO" };

export default async function TranscriptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  let data: Awaited<ReturnType<typeof getOwnedReport>>;
  try {
    data = await getOwnedReport(user.id, id);
  } catch {
    notFound();
  }
  const { conversation, report } = data;
  const theme = THEMES[conversation.theme as keyof typeof THEMES];
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>트랜스크립트</h1>
        <div className="row">
          {report ? (
            <Link className="btn btn-primary" href={`/history/${conversation.id}/report`}>
              리포트 보기
            </Link>
          ) : (
            <Link className="btn" href={`/history/${conversation.id}/report`}>
              리포트 생성
            </Link>
          )}
          {conversation.kind === "chat" && (
            <Link className="btn" href={`/chat/${conversation.id}`}>
              채팅으로
            </Link>
          )}
        </div>
      </div>
      <p className="muted">
        {theme?.label ?? conversation.theme} · {conversation.kind === "call" ? "전화 영어" : "채팅"} · {formatDateTime(conversation.startedAt)}
        {conversation.durationSec ? ` · ${formatDuration(conversation.durationSec)}` : ""}
      </p>
      <div className="chat-messages" role="log" aria-label="대화 트랜스크립트">
        {conversation.messages.length === 0 && <p className="muted">메시지가 없습니다.</p>}
        {conversation.messages.map((m) => (
          <div key={m.id} className={`bubble bubble-${m.role}`}>
            <div className="bubble-text">{m.content}</div>
            {m.hint && <div className="bubble-hint">교정 힌트: {m.hint}</div>}
          </div>
        ))}
      </div>
    </>
  );
}
