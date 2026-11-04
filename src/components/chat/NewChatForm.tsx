"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { chat, themes as themeText } from "@/content/ko";
import { apiJson } from "@/lib/client-fetch";

type Theme = { id: string; label: string; description: string };

export function NewChatForm({ themes, hintsDefault }: { themes: Theme[]; hintsDefault: boolean }) {
  const router = useRouter();
  const [theme, setTheme] = useState("free");
  const [hints, setHints] = useState(hintsDefault);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { conversation } = await apiJson<{ conversation: { id: string } }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ kind: "chat", theme, hintsEnabled: hints }),
      });
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card stack" aria-label={chat.newChatForm}>
      <div className="field">
        <label htmlFor="theme">{themeText.label}</label>
        <select id="theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} — {t.description}
            </option>
          ))}
        </select>
      </div>
      <label className="row" style={{ gap: 6 }}>
        <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} />
        {chat.hintsToggle}
      </label>
      <span className="muted">{chat.hintsToggleDesc}</span>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? chat.starting : chat.start}
        </button>
      </div>
    </form>
  );
}
