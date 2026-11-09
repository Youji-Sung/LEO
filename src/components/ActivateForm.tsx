"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, StatusMessage, TextField } from "@/components/ui";
import { apiJson } from "@/lib/client-fetch";

export function ActivateForm() {
  const router = useRouter();
  const token = useRef("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (window.location.hash) token.current = window.location.hash.slice(1);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!token.current) { setError("운영자가 전달한 초대 링크로 들어와 주세요."); return; }
    if (password !== confirm) { setError("비밀번호가 일치하지 않습니다."); return; }
    setBusy(true); setError(null);
    try {
      await apiJson("/api/auth/activate", { method: "POST", body: JSON.stringify({ token: token.current, password }) });
      router.replace("/login"); router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <Card><form onSubmit={submit} className="stack">
    <TextField id="new-password" label="새 비밀번호" type="password" minLength={12} maxLength={200} required autoComplete="new-password" hint="12자 이상으로 정해 주세요." value={password} onChange={(e) => setPassword(e.target.value)} />
    <TextField id="confirm-password" label="비밀번호 확인" type="password" minLength={12} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
    {error ? <StatusMessage tone="error" focus>{error}</StatusMessage> : null}
    <Button type="submit" variant="primary" loading={busy}>비밀번호 설정 후 로그인</Button>
  </form></Card>;
}
