import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { ReportView } from "@/components/report/ReportView";
import { ReportRetry } from "@/components/report/ReportRetry";
import { ButtonLink } from "@/components/ui";
import { common, report as text } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { getOwnedReport } from "@/services/report";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: common.pageTitle(text.pageTitle) };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
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
  const kind = conversation.kind === "call" ? "call" : "chat";
  const userMessages = conversation.messages.filter((message) => message.role === "user");
  const wordCount = userMessages.reduce((count, message) => count + (message.content.match(/\S+/g)?.length ?? 0), 0);
  const backHref = kind === "chat" ? `/chat/${conversation.id}` : `/history/${conversation.id}`;
  const meta = [
    theme?.label ?? conversation.theme,
    kind === "call" ? common.callLabel : common.chatLabel,
    formatDateTime(conversation.startedAt),
    conversation.portfolio ? text.portfolioMeta(conversation.portfolio.title) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="report-page">
      <div className="page-head">
        <div>
          <h1>{text.pageTitle}</h1>
          <p>{meta}</p>
        </div>
        <div className="row">
          <ButtonLink href={`/history/${conversation.id}`}>{text.transcript}</ButtonLink>
          <ButtonLink href={backHref}>
            {kind === "chat" ? text.backToChat : text.backToHistory}
          </ButtonLink>
        </div>
      </div>
      {report ? (
        <ReportView report={report} isInterview={Boolean(theme?.isInterview)} kind={kind}
          limitedEvidence={userMessages.length < 3 || wordCount < 50} />
      ) : (
        <ReportRetry
          conversationId={conversation.id}
          initialError={conversation.report ? text.corrupted : null}
        />
      )}
    </div>
  );
}
