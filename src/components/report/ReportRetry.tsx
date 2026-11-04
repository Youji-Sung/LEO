"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { common, report } from "@/content/ko";
import { apiJson } from "@/lib/client-fetch";

// 리포트가 없거나 생성에 실패했을 때: 오류 메시지와 재시도 버튼.
export function ReportRetry({ conversationId, initialError }: { conversationId: string; initialError: string | null }) {
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
    <div className="card stack" data-testid="report-retry">
      {busy ? (
        <p role="status">
          {report.making} · {report.makingHint}
        </p>
      ) : (
        <>
          <p role="alert" className={error ? "error" : "muted"}>
            {error ?? report.missing}
          </p>
          {!error && <p className="muted">{report.missingHint}</p>}
          <div>
            <button type="button" className="btn btn-primary" onClick={retry}>
              {error ? common.retry : report.make}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
