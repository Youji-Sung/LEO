"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { auth } from "@/content/ko";
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
      setError(auth.networkError);
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <form onSubmit={onSubmit} className="card" aria-label={isLogin ? auth.loginTitle : auth.signupTitle}>
      {mode === "signup" && (
        <div className="field">
          <label htmlFor="name">{auth.name}</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </div>
      )}
      <div className="field">
        <label htmlFor="email">{auth.email}</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">{auth.password}</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {isLogin ? (busy ? auth.loginBusy : auth.loginButton) : busy ? auth.signupBusy : auth.signupButton}
      </button>
    </form>
  );
}
