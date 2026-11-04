import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { Bubble, ButtonLink, EmptyState } from "@/components/ui";
import { common, transcript } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { getOwnedReport } from "@/services/report";
import { formatDateTime, formatDuration } from "@/lib/format";
import { displayedCallSec } from "@/services/call/duration";

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
  const meta = [
    theme?.label ?? conversation.theme,
    conversation.kind === "call" ? common.callLabel : common.chatLabel,
    formatDateTime(conversation.startedAt),
    displayedCallSec(conversation) ? formatDuration(displayedCallSec(conversation)!) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{transcript.pageTitle}</h1>
          <p>{meta}</p>
        </div>
        <div className="row">
          {report ? (
            <ButtonLink variant="primary" href={`/history/${conversation.id}/report`}>
              {transcript.viewReport}
            </ButtonLink>
          ) : (
            <ButtonLink variant="primary" href={`/history/${conversation.id}/report`}>
              {transcript.makeReport}
            </ButtonLink>
          )}
          {conversation.kind === "chat" && (
            <ButtonLink href={`/chat/${conversation.id}`}>{transcript.toChat}</ButtonLink>
          )}
        </div>
      </div>
      {conversation.messages.length === 0 ? (
        <EmptyState title={transcript.empty} />
      ) : (
        <div className="chat-messages" role="log" aria-label={transcript.logLabel}>
          {conversation.messages.map((m) => (
            <Bubble
              key={m.id}
              speaker={m.role === "user" ? "me" : "partner"}
              hint={m.hint}
              hintLabel={transcript.hintLabel}
            >
              {m.content}
            </Bubble>
          ))}
        </div>
      )}
    </>
  );
}
