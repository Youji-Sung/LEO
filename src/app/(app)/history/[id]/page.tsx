import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { common, transcript } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { getOwnedReport } from "@/services/report";
import { formatDateTime, formatDuration } from "@/lib/format";

export const metadata = { title: common.pageTitle(transcript.pageTitle) };

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
        <h1 style={{ margin: 0 }}>{transcript.pageTitle}</h1>
        <div className="row">
          {report ? (
            <Link className="btn btn-primary" href={`/history/${conversation.id}/report`}>
              {transcript.viewReport}
            </Link>
          ) : (
            <Link className="btn" href={`/history/${conversation.id}/report`}>
              {transcript.makeReport}
            </Link>
          )}
          {conversation.kind === "chat" && (
            <Link className="btn" href={`/chat/${conversation.id}`}>
              {transcript.toChat}
            </Link>
          )}
        </div>
      </div>
      <p className="muted">
        {theme?.label ?? conversation.theme} · {conversation.kind === "call" ? common.callLabel : common.chatLabel} · {formatDateTime(conversation.startedAt)}
        {conversation.durationSec ? ` · ${formatDuration(conversation.durationSec)}` : ""}
      </p>
      <div className="chat-messages" role="log" aria-label={transcript.logLabel}>
        {conversation.messages.length === 0 && <p className="muted">{transcript.empty}</p>}
        {conversation.messages.map((m) => (
          <div key={m.id} className={`bubble bubble-${m.role}`}>
            <div className="bubble-text">{m.content}</div>
            {m.hint && (
              <div className="bubble-hint">
                {transcript.hintLabel}: {m.hint}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
