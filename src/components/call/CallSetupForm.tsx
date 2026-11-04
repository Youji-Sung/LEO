"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { callSetup, common, themes as themeText } from "@/content/ko";
import { apiJson } from "@/lib/client-fetch";

type Theme = { id: string; label: string; description: string };
type Portfolio = { id: string; title: string };
type MicState = "unknown" | "checking" | "granted" | "denied" | "unavailable";

export function CallSetupForm({
  themes,
  portfolios,
  defaultMinutes,
  durationOptions,
}: {
  themes: Theme[];
  portfolios: Portfolio[];
  defaultMinutes: number;
  durationOptions: number[];
}) {
  const router = useRouter();
  const [theme, setTheme] = useState("interview");
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id ?? "");
  const [mic, setMic] = useState<MicState>("unknown");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sttSupported = useSyncExternalStore(
    () => () => undefined,
    () => {
      const w = window as unknown as {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      };
      return (
        Boolean(w.SpeechRecognition || w.webkitSpeechRecognition) ||
        Boolean(window.__LEO_FAKE_VOICE)
      );
    },
    () => true,
  );

  async function checkMic() {
    setMic("checking");
    if (window.__LEO_FAKE_VOICE) {
      setMic("granted");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMic("unavailable");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMic("granted");
    } catch {
      setMic("denied");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { conversation } = await apiJson<{ conversation: { id: string } }>(
        "/api/conversations",
        {
          method: "POST",
          body: JSON.stringify({
            kind: "call",
            theme,
            durationMin: minutes,
            portfolioId: theme === "portfolio" ? portfolioId || null : null,
          }),
        },
      );
      router.push(`/call/${conversation.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const micLabel: Record<MicState, string> = {
    unknown: callSetup.micUnknown,
    checking: callSetup.micChecking,
    granted: callSetup.micGranted,
    denied: callSetup.micDenied,
    unavailable: callSetup.micUnavailable,
  };

  return (
    <form onSubmit={onSubmit} className="card stack" aria-label={callSetup.formLabel}>
      <div className="field">
        <label htmlFor="call-theme">{themeText.label}</label>
        <select id="call-theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} — {t.description}
            </option>
          ))}
        </select>
      </div>
      {theme === "portfolio" && (
        <div className="field">
          <label htmlFor="call-portfolio">{callSetup.portfolioLabel}</label>
          {portfolios.length === 0 ? (
            <>
              <p className="muted">{callSetup.portfolioEmpty}</p>
              <Link className="btn" href="/portfolios">
                {callSetup.portfolioAdd}
              </Link>
            </>
          ) : (
            <select
              id="call-portfolio"
              value={portfolioId}
              onChange={(e) => setPortfolioId(e.target.value)}
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      <fieldset className="field" style={{ border: 0, padding: 0 }}>
        <legend>{callSetup.durationLegend}</legend>
        <div className="row">
          {durationOptions.map((m) => (
            <label key={m} className="row" style={{ gap: 4 }}>
              <input
                type="radio"
                name="minutes"
                value={m}
                checked={minutes === m}
                onChange={() => setMinutes(m)}
              />
              {m <= 0 ? callSetup.durationTest : common.minutes(m)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <span>{callSetup.micLegend}</span>
        <div className="row">
          <button type="button" className="btn" onClick={checkMic} disabled={mic === "checking"}>
            {callSetup.micCheck}
          </button>
          <span className={mic === "denied" ? "error" : "muted"} role="status">
            {micLabel[mic]}
          </span>
        </div>
        {!sttSupported && <p className="muted">{callSetup.sttUnsupported}</p>}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="muted">{callSetup.nextHint}</p>
      <div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || (theme === "portfolio" && !portfolioId)}
        >
          {busy ? callSetup.creating : callSetup.next}
        </button>
      </div>
    </form>
  );
}
