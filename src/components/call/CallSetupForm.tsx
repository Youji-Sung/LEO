"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
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
    unknown: "아직 확인하지 않았습니다.",
    checking: "확인 중…",
    granted: "마이크를 사용할 수 있습니다.",
    denied:
      "마이크 권한이 거부되었습니다. 브라우저 주소창의 권한 설정에서 허용하세요. 텍스트 입력으로도 통화할 수 있습니다.",
    unavailable: "이 브라우저에서는 마이크를 쓸 수 없습니다. 텍스트 입력으로 통화합니다.",
  };

  return (
    <form onSubmit={onSubmit} className="card stack" aria-label="통화 설정">
      <div className="field">
        <label htmlFor="call-theme">테마</label>
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
          <label htmlFor="call-portfolio">포트폴리오</label>
          {portfolios.length === 0 ? (
            <p className="muted">
              등록된 포트폴리오가 없습니다. <a href="/portfolios">포트폴리오 관리</a>에서 먼저
              등록하세요.
            </p>
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
        <legend>통화 시간</legend>
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
              {m <= 0 ? "테스트(20초)" : `${m}분`}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <span>마이크</span>
        <div className="row">
          <button type="button" className="btn" onClick={checkMic} disabled={mic === "checking"}>
            마이크 권한 확인
          </button>
          <span className={mic === "denied" ? "error" : "muted"} role="status">
            {micLabel[mic]}
          </span>
        </div>
        {!sttSupported && (
          <p className="muted">
            이 브라우저는 음성 인식(Web Speech API)을 지원하지 않습니다. Chrome 을 권장하며, 텍스트
            입력으로 통화를 진행할 수 있습니다.
          </p>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || (theme === "portfolio" && !portfolioId)}
        >
          다음
        </button>
      </div>
    </form>
  );
}
