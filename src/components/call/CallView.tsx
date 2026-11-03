"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { apiJson } from "@/lib/client-fetch";
import { formatDuration } from "@/lib/format";
import { streamMessage } from "@/lib/ndjson-client";
import { getVoiceAdapter } from "@/lib/voice";
import { SentenceSplitter } from "@/lib/voice/sentence-splitter";
import type { VoiceAdapter, VoiceSupport } from "@/lib/voice/types";

type Entry = { id: string; role: string; content: string };
type Phase = "idle" | "live" | "ending" | "ended";

type Props = {
  conversationId: string;
  themeLabel: string;
  openingLine: string;
  durationSec: number;
  extendable: boolean;
  ttsVoice: string | null;
  initialMessages: Entry[];
};

export function CallView(props: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [support, setSupport] = useState<VoiceSupport>({ stt: true, tts: true });
  const [entries, setEntries] = useState<Entry[]>(props.initialMessages);
  const [interim, setInterim] = useState("");
  const [partial, setPartial] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(props.durationSec);
  const [durationSec, setDurationSec] = useState(props.durationSec);
  const [extendable, setExtendable] = useState(props.extendable);
  const [muted, setMuted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endReason, setEndReason] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");

  const adapterRef = useRef<VoiceAdapter | null>(null);
  const startedAtRef = useRef<number>(0);
  const durationRef = useRef(props.durationSec);
  const phaseRef = useRef<Phase>("idle");
  const mutedRef = useRef(false);
  const busyRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const speakChainRef = useRef<Promise<void>>(Promise.resolve());
  const speakGenRef = useRef(0);
  const endingRef = useRef(false);
  const restartListeningRef = useRef<() => void>(() => undefined);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const speakSentence = useCallback(
    (sentence: string) => {
      const adapter = adapterRef.current;
      if (!adapter || !adapter.isSupported().tts) return;
      const gen = speakGenRef.current;
      speakChainRef.current = speakChainRef.current.then(async () => {
        if (gen !== speakGenRef.current || phaseRef.current !== "live") return;
        setSpeaking(true);
        try {
          await adapter.speak(sentence, { voiceId: props.ttsVoice });
        } finally {
          if (!adapter.isSpeaking()) setSpeaking(false);
        }
      });
    },
    [props.ttsVoice],
  );

  // 사용자가 말하기 시작하면 TTS 를 끊는다.
  const bargeIn = useCallback(() => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    speakGenRef.current += 1;
    adapter.cancelSpeech();
    setSpeaking(false);
  }, []);

  const endCall = useCallback(
    async (reason: string) => {
      if (endingRef.current) return;
      endingRef.current = true;
      setEndReason(reason);
      setPhaseBoth("ending");
      const adapter = adapterRef.current;
      adapter?.stopListening();
      speakGenRef.current += 1;
      adapter?.cancelSpeech();
      try {
        await apiJson(`/api/conversations/${props.conversationId}`, {
          method: "PATCH",
          body: JSON.stringify({ ended: true }),
        });
      } catch {
        // 종료 표시 실패는 리포트 생성으로 이어서 처리한다.
      }
      try {
        await apiJson(`/api/conversations/${props.conversationId}/report`, { method: "POST" });
      } catch (e) {
        setError((e as Error).message);
      }
      setPhaseBoth("ended");
      router.push(`/history/${props.conversationId}/report`);
    },
    [props.conversationId, router],
  );

  const processQueue = useCallback(async () => {
    if (busyRef.current || phaseRef.current !== "live") return;
    const next = queueRef.current.shift();
    if (!next) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setEntries((e) => [...e, { id: `tmp-${Date.now()}`, role: "user", content: next }]);
    setPartial("");
    const splitter = new SentenceSplitter((s) => speakSentence(s));
    let done = false;
    try {
      await streamMessage(props.conversationId, next, (ev) => {
        if (ev.type === "delta") {
          setPartial((p) => (p ?? "") + ev.text);
          splitter.push(ev.text);
        } else if (ev.type === "done") {
          done = true;
          splitter.flush();
          setEntries((e) => [
            ...e,
            { id: ev.message.id, role: "assistant", content: ev.message.content },
          ]);
        } else if (ev.type === "error") {
          setError(ev.message);
          if (ev.code === "turn_cap") void endCall("turn_cap");
        }
      });
      if (!done) splitter.flush();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPartial(null);
      busyRef.current = false;
      setBusy(false);
      if (queueRef.current.length > 0) void processQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.conversationId, speakSentence]);

  const enqueueUtterance = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || phaseRef.current !== "live") return;
      queueRef.current.push(t);
      void processQueue();
    },
    [processQueue],
  );

  const startListening = useCallback(() => {
    const adapter = adapterRef.current;
    if (!adapter || !adapter.isSupported().stt || mutedRef.current || phaseRef.current !== "live")
      return;
    adapter.startListening({
      onInterim: (text) => {
        if (text.trim()) bargeIn();
        setInterim(text);
      },
      onFinal: (text) => {
        setInterim("");
        bargeIn();
        enqueueUtterance(text);
      },
      onError: (message) => setError(message),
      onEnd: () => {
        // 브라우저가 무음 등으로 인식을 멈추면 다시 켠다.
        if (phaseRef.current === "live" && !mutedRef.current)
          setTimeout(() => restartListeningRef.current(), 300);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bargeIn]);

  useEffect(() => {
    restartListeningRef.current = startListening;
  }, [startListening]);

  function startCall() {
    const adapter = getVoiceAdapter();
    adapterRef.current = adapter;
    const sup = adapter.isSupported();
    setSupport(sup);
    startedAtRef.current = Date.now();
    setPhaseBoth("live");
    setRemaining(durationRef.current);
    speakSentence(props.openingLine);
    startListening();
  }

  // 타이머: 만료되면 자동 종료 → 리포트
  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const left = durationRef.current - elapsed;
      setRemaining(Math.max(0, left));
      if (left <= 0) void endCall("timeout");
    }, 500);
    return () => clearInterval(t);
  }, [phase, endCall]);

  useEffect(() => {
    return () => {
      adapterRef.current?.stopListening();
      adapterRef.current?.cancelSpeech();
    };
  }, []);

  function toggleMute() {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      adapterRef.current?.stopListening();
      setInterim("");
    } else startListening();
  }

  async function extend() {
    try {
      const r = await apiJson<{ durationSec: number; canExtend: boolean }>(
        `/api/conversations/${props.conversationId}/extend`,
        { method: "POST" },
      );
      durationRef.current = r.durationSec;
      setDurationSec(r.durationSec);
      setExtendable(r.canExtend);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function onTextSubmit(e: FormEvent) {
    e.preventDefault();
    const t = textInput.trim();
    if (!t) return;
    setTextInput("");
    bargeIn();
    enqueueUtterance(t);
  }

  const showExtend = phase === "live" && extendable && remaining <= 60;

  return (
    <div className="call">
      <div className="call-head">
        <div>
          <strong>{props.themeLabel}</strong>
          <span className="muted"> · {formatDuration(durationSec)} 통화</span>
        </div>
        <div
          className="call-timer"
          role="timer"
          aria-live="off"
          aria-label="남은 시간"
          data-testid="timer"
        >
          {formatDuration(remaining)}
        </div>
      </div>

      {phase === "idle" && (
        <div className="card stack call-start">
          <p>
            상대가 먼저 인사를 건넵니다. 영어로 자연스럽게 대답하세요. 통화가 끝나면 교정 리포트가
            만들어집니다.
          </p>
          <div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startCall}
              data-testid="start-call"
            >
              통화 시작
            </button>
          </div>
        </div>
      )}

      {phase !== "idle" && (
        <>
          {!support.stt && (
            <p className="muted" role="status">
              이 브라우저는 음성 인식을 지원하지 않아 텍스트로 대화합니다.
              {!support.tts ? " 음성 합성도 지원하지 않아 답변은 글로만 표시됩니다." : ""}
            </p>
          )}
          <div className="call-status row" aria-live="polite">
            {phase === "live" && (
              <>
                <span className={`pill ${speaking ? "pill-on" : ""}`}>
                  {speaking
                    ? "상대가 말하는 중"
                    : busy
                      ? "상대가 생각하는 중…"
                      : muted
                        ? "음소거"
                        : support.stt
                          ? "듣는 중"
                          : "입력 대기"}
                </span>
                {phase === "live" && (
                  <span className="muted" data-testid="opening-line">
                    {entries.length === 0 && !partial ? props.openingLine : ""}
                  </span>
                )}
              </>
            )}
            {phase === "ending" && (
              <span role="status">통화를 마치고 리포트를 만드는 중입니다… (30초~1분)</span>
            )}
            {phase === "ended" && <span role="status">리포트로 이동합니다…</span>}
          </div>

          <div
            className="chat-messages call-transcript"
            role="log"
            aria-label="실시간 트랜스크립트"
          >
            {entries.map((m) => (
              <div key={m.id} className={`bubble bubble-${m.role}`} data-testid={`msg-${m.role}`}>
                {m.content}
              </div>
            ))}
            {partial !== null && (
              <div className="bubble bubble-assistant" data-testid="streaming">
                {partial || "…"}
              </div>
            )}
            {interim && (
              <div className="bubble bubble-user interim" data-testid="interim">
                {interim}
              </div>
            )}
          </div>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {phase === "live" && !support.stt && (
            <form onSubmit={onTextSubmit} className="chat-input row">
              <label htmlFor="call-text" className="sr-only">
                말할 내용
              </label>
              <textarea
                id="call-text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={2}
                placeholder="영어로 입력하고 Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    onTextSubmit(e);
                  }
                }}
              />
              <button type="submit" className="btn btn-primary" disabled={!textInput.trim()}>
                말하기
              </button>
            </form>
          )}

          <div className="call-controls row">
            {support.stt && (
              <button
                type="button"
                className="btn"
                onClick={toggleMute}
                disabled={phase !== "live"}
                aria-pressed={muted}
              >
                {muted ? "음소거 해제" : "음소거"}
              </button>
            )}
            {showExtend && (
              <button type="button" className="btn" onClick={extend} data-testid="extend">
                10분 연장
              </button>
            )}
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => endCall("hangup")}
              disabled={phase !== "live"}
              data-testid="hangup"
            >
              끊기
            </button>
            {endReason === "turn_cap" && (
              <span className="muted">턴 상한에 도달해 통화를 마칩니다.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
