"use client";

import { ArrowRight, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { callSetup, common, themes as themeText } from "@/content/ko";
import { apiJson } from "@/lib/client-fetch";
import {
  Button,
  ButtonLink,
  Card,
  Choice,
  ChoiceGroup,
  Select,
  StatusMessage,
} from "@/components/ui";

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
  const micTone = mic === "granted" ? "success" : mic === "denied" ? "error" : "info";
  const portfolioMissing = theme === "portfolio" && portfolios.length === 0;

  return (
    <form onSubmit={onSubmit} className="stack-lg" aria-label={callSetup.formLabel}>
      <Card as="section">
        <ChoiceGroup legend={themeText.legend} stack>
          {themes.map((t) => (
            <Choice
              key={t.id}
              kind="radio"
              name="theme"
              value={t.id}
              checked={theme === t.id}
              onChange={() => setTheme(t.id)}
              title={t.label}
              description={t.description}
            />
          ))}
        </ChoiceGroup>
        {theme === "portfolio" && (
          <div className="stack-sm" style={{ marginTop: "var(--space-4)" }}>
            {portfolios.length === 0 ? (
              <StatusMessage
                tone="warning"
                polite
                action={
                  <ButtonLink href="/portfolios" variant="secondary">
                    {callSetup.portfolioAdd}
                  </ButtonLink>
                }
              >
                {callSetup.portfolioEmpty}
              </StatusMessage>
            ) : (
              <Select
                id="call-portfolio"
                label={callSetup.portfolioLabel}
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}
      </Card>

      <Card as="section">
        <ChoiceGroup legend={callSetup.durationLegend}>
          {durationOptions.map((m) => (
            <Choice
              key={m}
              kind="radio"
              name="minutes"
              value={m}
              compact
              checked={minutes === m}
              onChange={() => setMinutes(m)}
              title={m <= 0 ? callSetup.durationTest : common.minutes(m)}
            />
          ))}
        </ChoiceGroup>
      </Card>

      <Card as="section" title={callSetup.micLegend} titleId="call-mic-title" className="stack">
        <div>
          <Button
            variant="secondary"
            icon={<Mic size={18} />}
            onClick={checkMic}
            loading={mic === "checking"}
            loadingLabel={callSetup.micChecking}
          >
            {callSetup.micCheck}
          </Button>
        </div>
        <StatusMessage tone={micTone} polite data-testid="mic-status">
          {micLabel[mic]}
        </StatusMessage>
        {!sttSupported && <StatusMessage tone="warning">{callSetup.sttUnsupported}</StatusMessage>}
      </Card>

      {error && <StatusMessage tone="error" focus>{error}</StatusMessage>}

      <div className="row">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          icon={<ArrowRight size={20} />}
          disabled={busy || portfolioMissing || (theme === "portfolio" && !portfolioId)}
          loading={busy}
          loadingLabel={callSetup.creating}
        >
          {callSetup.next}
        </Button>
        <span className="muted">{callSetup.nextHint}</span>
      </div>
    </form>
  );
}
