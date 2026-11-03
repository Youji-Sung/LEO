"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { readError } from "@/lib/client-fetch";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { email, password, name } : { email, password }),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도하세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card" aria-label={mode === "login" ? "로그인" : "회원가입"}>
      {mode === "signup" && (
        <div className="field">
          <label htmlFor="name">이름</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </div>
      )}
      <div className="field">
        <label htmlFor="email">이메일</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {mode === "login" ? "로그인" : "가입하기"}
      </button>
    </form>
  );
}
