"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, EmptyState, Spinner, StatusMessage } from "@/components/ui";
import { common, report } from "@/content/ko";
import { apiJson } from "@/lib/client-fetch";

// 리포트가 없거나(빈 상태) 만들지 못했을 때(오류): 상황과 다음 행동 하나.
export function ReportRetry({
  conversationId,
  initialError,
}: {
  conversationId: string;
  initialError: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);

  async function retry() {
    setBusy(true);
    setError(null);
    try {
      await apiJson(`/api/conversations/${conversationId}/report`, { method: "POST" });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

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
            <Button variant="primary" onClick={retry}>
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
            <Button variant="primary" onClick={retry}>
              {report.make}
            </Button>
          }
        />
      )}
    </div>
  );
}
