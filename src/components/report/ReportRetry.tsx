"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
        <p role="status">리포트를 생성하는 중입니다. 보통 30초에서 1분 정도 걸립니다…</p>
      ) : (
        <>
          <p role="alert" className={error ? "error" : "muted"}>
            {error ?? "아직 리포트가 없습니다."}
          </p>
          <div>
            <button type="button" className="btn btn-primary" onClick={retry}>
              {error ? "다시 시도" : "리포트 생성"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
