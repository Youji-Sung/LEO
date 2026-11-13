"use client";
import { useRef, useState } from "react";
import { apiJson } from "@/lib/client-fetch";
import { Button, ButtonLink, StatusMessage } from "@/components/ui";
export function SaveExpression({
  conversationId,
  kind,
  index,
  initiallySaved = false,
}: {
  conversationId: string;
  kind: "vocabulary" | "expression";
  index: number;
  initiallySaved?: boolean;
}) {
  const lock = useRef(false);
  const [saved, setSaved] = useState(initiallySaved),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await apiJson("/api/learning", {
        method: "POST",
        body: JSON.stringify({ conversationId, kind, index }),
      });
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="stack-sm">
      {saved ? (
        <div className="row">
          <span role="status">학습할 표현에 담았어요.</span>
          <ButtonLink href="/learn">표현 익히기</ButtonLink>
        </div>
      ) : (
        <Button onClick={save} loading={busy}>
          학습할 표현에 담기
        </Button>
      )}
      {error && <StatusMessage tone="error">{error}</StatusMessage>}
    </div>
  );
}
