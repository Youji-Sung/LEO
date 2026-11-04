"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { auth } from "@/content/ko";
import { readError } from "@/lib/client-fetch";
import { Button, Card, StatusMessage, TextField } from "@/components/ui";

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
      // 같은 출처의 경로만 허용한다("//evil.com" 같은 프로토콜 상대 URL 차단).
      const safeNext = next && /^\/(?![\/\\])/.test(next) ? next : "/";
      router.push(safeNext);
      router.refresh();
    } catch {
      setError(auth.networkError);
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <Card as="section">
      <form
        onSubmit={onSubmit}
        className="stack"
        aria-label={isLogin ? auth.loginTitle : auth.signupTitle}
      >
        {isLogin ? null : (
          <TextField
            id="name"
            label={auth.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        )}
        <TextField
          id="email"
          label={auth.email}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <TextField
          id="password"
          label={auth.password}
          type="password"
          hint={isLogin ? undefined : auth.passwordHint}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
        {error ? (
          <StatusMessage tone="error" focus>
            {error}
          </StatusMessage>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          block
          loading={busy}
          loadingLabel={isLogin ? auth.loginBusy : auth.signupBusy}
        >
          {isLogin ? auth.loginButton : auth.signupButton}
        </Button>
      </form>
    </Card>
  );
}
