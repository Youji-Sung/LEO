import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { ReportView } from "@/components/report/ReportView";
import { ReportRetry } from "@/components/report/ReportRetry";
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
  const backHref = conversation.kind === "chat" ? `/chat/${conversation.id}` : `/history/${conversation.id}`;

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>{text.pageTitle}</h1>
        <div className="row">
          <Link className="btn" href={`/history/${conversation.id}`}>
            {text.transcript}
          </Link>
          <Link className="btn" href={backHref}>
            {conversation.kind === "chat" ? text.backToChat : text.backToHistory}
          </Link>
        </div>
      </div>
      <p className="muted">
        {theme?.label ?? conversation.theme} · {conversation.kind === "call" ? common.callLabel : common.chatLabel} · {formatDateTime(conversation.startedAt)}
        {conversation.portfolio ? ` · ${text.portfolioMeta(conversation.portfolio.title)}` : ""}
      </p>
      {report ? (
        <ReportView report={report} isInterview={Boolean(theme?.isInterview)} />
      ) : (
        <ReportRetry conversationId={conversation.id} initialError={conversation.report ? text.corrupted : null} />
      )}
    </>
  );
}
