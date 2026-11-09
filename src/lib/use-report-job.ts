"use client";

import { useEffect, useRef, useState } from "react";
import { report as text } from "@/content/ko";
import { ApiError, apiJson } from "@/lib/client-fetch";

// 새로고침 전 요청한 작업임을 기억한다. 내용이나 인증 정보는 저장하지 않는다.
function marker(key: string, pending?: boolean): boolean {
  try {
    if (pending === true) sessionStorage.setItem(key, "1");
    if (pending === false) sessionStorage.removeItem(key);
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function useReportJob(conversationId: string, onReady: () => void, openExisting = false) {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasReport, setHasReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const busyRef = useRef(true);
  const activeRef = useRef(false);
  const url = `/api/conversations/${conversationId}/report`;
  const key = `leo-report-pending:${conversationId}`;

  useEffect(() => {
    activeRef.current = true;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    let recovering = marker(key);
    let retries = 0;
    const poll = async () => {
      try {
        const result = await apiJson<{ status?: "generating"; report?: unknown }>(url, {
          cache: "no-store", signal: controller.signal,
        });
        if (stopped) return;
        if (result.status === "generating") {
          recovering = true;
          retries = 0;
          busyRef.current = true;
          setBusy(true);
          marker(key, true);
          timer = setTimeout(poll, 2000);
          return;
        }
        if (result.report) {
          setHasReport(true);
          marker(key, false);
          if (recovering || openExisting) onReady();
        }
        busyRef.current = false;
        setBusy(false);
      } catch (err) {
        if (stopped) return;
        const missing = err instanceof ApiError && err.code === "report_not_found";
        // 새로고침이 원래 POST의 접수보다 빨랐거나 연결이 잠시 끊긴 경우 GET만 재시도한다.
        if (recovering && (missing || !(err instanceof ApiError)) && retries++ < 3) {
          busyRef.current = true;
          setBusy(true);
          timer = setTimeout(poll, 2000);
          return;
        }
        busyRef.current = false;
        setBusy(false);
        if (missing) {
          marker(key, false);
          if (recovering) setError(text.interrupted);
        } else {
          if (err instanceof ApiError && err.code === "report_failed") marker(key, false);
          setError(err instanceof ApiError ? err.message : text.statusError);
        }
      } finally {
        if (!stopped) setChecking(false);
      }
    };
    void poll();
    return () => {
      stopped = true;
      activeRef.current = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [key, url, onReady, openExisting, generation]);

  async function generate() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    marker(key, true);
    let accepted = false;
    try {
      const result = await apiJson<{ status?: string }>(url, { method: "POST" });
      if (result.status === "generating") {
        accepted = true;
        if (activeRef.current) setGeneration((value) => value + 1);
        return;
      }
      marker(key, false);
      if (activeRef.current) {
        setHasReport(true);
        onReady();
      }
    } catch (err) {
      // 연결이 끊겨도 서버 처리가 계속될 수 있으므로 새로고침 시 상태 확인을 남긴다.
      if (err instanceof ApiError) marker(key, false);
      if (activeRef.current) setError((err as Error).message);
    } finally {
      if (!accepted) {
        busyRef.current = false;
        if (activeRef.current) setBusy(false);
      }
    }
  }

  return { busy, checking, busyRef, hasReport, error, generate };
}
