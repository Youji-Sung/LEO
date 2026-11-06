"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Button, Card, EmptyState, Spinner, StatusMessage } from "@/components/ui";
import { common, report } from "@/content/ko";
import { useReportJob } from "@/lib/use-report-job";

// 리포트가 없거나(빈 상태) 만들지 못했을 때(오류): 상황과 다음 행동 하나.
export function ReportRetry({
  conversationId,
  initialError,
}: {
  conversationId: string;
  initialError: string | null;
}) {
  const router = useRouter();
  const ready = useCallback(() => router.refresh(), [router]);
  const job = useReportJob(conversationId, ready, true);
  const error = job.error ?? initialError;
  const busy = job.busy || job.checking;

  return (
    <div data-testid="report-retry">
      {busy ? (
        <Card>
          <Spinner label={`${report.making} · ${report.makingHint}`} />
        </Card>
      ) : error ? (
        <StatusMessage
          focus
          tone="error"
          action={
            <Button variant="primary" onClick={job.generate}>
              {common.retry}
            </Button>
          }
        >
          {error}
        </StatusMessage>
      ) : (
        <EmptyState
          title={report.missing}
          body={report.missingHint}
          action={
            <Button variant="primary" onClick={job.generate}>
              {report.make}
            </Button>
          }
        />
      )}
    </div>
  );
}
