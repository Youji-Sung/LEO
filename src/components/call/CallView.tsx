"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { callLive, chat } from "@/content/ko";
import { ApiError, apiJson } from "@/lib/client-fetch";
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
  // 서버에 기록된 통화 시작 시각. 새로고침 시 남은 시간 계산에 쓴다.
  startedAtMs: number;
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
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sttDisabledRef = useRef(false);
  const inflightRef = useRef<Promise<void> | null>(null);
  const extendBusyRef = useRef(false);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // gen 은 응답(또는 인사)이 시작될 때의 세대. 끼어들기로 세대가 바뀌면 같은 응답의 뒤 문장도 모두 버린다.
  const speakSentence = useCallback(
    (sentence: string, gen: number) => {
      const adapter = adapterRef.current;
      if (!adapter || !adapter.isSupported().tts) return;
      speakChainRef.current = speakChainRef.current
        .then(async () => {
          if (gen !== speakGenRef.current || phaseRef.current !== "live") return;
          setSpeaking(true);
          try {
            await adapter.speak(sentence, { voiceId: props.ttsVoice });
          } finally {
            if (!adapter.isSpeaking()) setSpeaking(false);
          }
        })
        .catch(() => undefined);
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
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      speakGenRef.current += 1;
      adapter?.cancelSpeech();
      queueRef.current = [];
      // 진행 중인 답변이 있으면 저장될 때까지(최대 30초) 기다려 리포트에 포함한다.
      if (inflightRef.current) {
        await Promise.race([inflightRef.current, new Promise((r) => setTimeout(r, 30_000))]);
      }
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
    const tempId = `tmp-${Date.now()}`;
    setEntries((e) => [...e, { id: tempId, role: "user", content: next }]);
    setPartial("");
    const gen = speakGenRef.current;
    const splitter = new SentenceSplitter((s) => speakSentence(s, gen));
    let done = false;
    let finishInflight: () => void = () => undefined;
    inflightRef.current = new Promise<void>((r) => {
      finishInflight = r;
    });
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
          setEntries((e) => e.filter((x) => x.id !== tempId));
          if (ev.code === "turn_cap") void endCall("turn_cap");
        }
      });
      if (!done) splitter.flush();
    } catch (e) {
      setError((e as Error).message);
      setEntries((en) => en.filter((x) => x.id !== tempId));
      if (e instanceof ApiError && e.code === "turn_cap") void endCall("turn_cap");
    } finally {
      setPartial(null);
      busyRef.current = false;
      setBusy(false);
      finishInflight();
      inflightRef.current = null;
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
    if (
      !adapter ||
      !adapter.isSupported().stt ||
      sttDisabledRef.current ||
      mutedRef.current ||
      phaseRef.current !== "live"
    )
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
      onError: (message, fatal) => {
        setError(message);
        if (fatal) {
          // 권한 거부·마이크 없음: 재시작하지 않고 텍스트 입력으로 바꾼다.
          sttDisabledRef.current = true;
          adapter.stopListening();
          setSupport((sup) => ({ ...sup, stt: false }));
        }
      },
      onEnd: () => {
        // 브라우저가 무음 등으로 인식을 멈추면 다시 켠다.
        if (phaseRef.current === "live" && !mutedRef.current && !sttDisabledRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => restartListeningRef.current(), 300);
        }
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
    const resuming = props.initialMessages.length > 0;
    startedAtRef.current = resuming ? props.startedAtMs : Date.now();
    setPhaseBoth("live");
    setRemaining(
      Math.max(0, durationRef.current - Math.floor((Date.now() - startedAtRef.current) / 1000)),
    );
    if (!resuming) {
      void apiJson(`/api/conversations/${props.conversationId}`, {
        method: "PATCH",
        body: JSON.stringify({ started: true }),
      }).catch(() => undefined);
      speakSentence(props.openingLine, speakGenRef.current);
    }
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
      phaseRef.current = "ended";
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
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
    if (extendBusyRef.current) return;
    extendBusyRef.current = true;
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
    } finally {
      extendBusyRef.current = false;
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
          <span className="muted"> · {callLive.totalDuration(formatDuration(durationSec))}</span>
        </div>
        <div
          className="call-timer"
          role="timer"
          aria-live="off"
          aria-label={callLive.timerLabel}
          data-testid="timer"
        >
          {formatDuration(remaining)}
        </div>
      </div>

      {phase === "idle" && (
        <div className="card stack call-start">
          <h2 style={{ marginTop: 0 }}>{callLive.idleTitle}</h2>
          <p>{callLive.idleBody}</p>
          <ul>
            {callLive.idleTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startCall}
              data-testid="start-call"
            >
              {callLive.start}
            </button>
          </div>
        </div>
      )}

      {phase !== "idle" && (
        <>
          {!support.stt && (
            <p className="muted" role="status">
              {callLive.textModeNotice}
              {!support.tts ? ` ${callLive.noTtsNotice}` : ""}
            </p>
          )}
          <div className="call-status row" aria-live="polite">
            {phase === "live" && (
              <>
                <span className={`pill ${speaking ? "pill-on" : ""}`}>
                  {speaking
                    ? callLive.status.speaking
                    : busy
                      ? callLive.status.thinking
                      : muted
                        ? callLive.status.muted
                        : support.stt
                          ? callLive.status.listening
                          : callLive.status.waitingInput}
                </span>
                {phase === "live" && (
                  <span className="muted" data-testid="opening-line">
                    {entries.length === 0 && !partial ? props.openingLine : ""}
                  </span>
                )}
              </>
            )}
            {phase === "ending" && (
              <span role="status">
                {callLive.status.ending} · {callLive.status.endingHint}
              </span>
            )}
            {phase === "ended" && <span role="status">{callLive.status.ended}</span>}
          </div>

          <div
            className="chat-messages call-transcript"
            role="log"
            aria-label={callLive.logLabel}
          >
            {entries.map((m) => (
              <div key={m.id} className={`bubble bubble-${m.role}`} data-testid={`msg-${m.role}`}>
                {m.content}
              </div>
            ))}
            {partial !== null && (
              <div className="bubble bubble-assistant" data-testid="streaming">
                {partial || chat.waiting}
              </div>
            )}
            {interim && (
              <div className="bubble bubble-user interim" data-testid="interim">
                <span className="sr-only">{callLive.interimLabel}: </span>
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
                {callLive.textInputLabel}
              </label>
              <textarea
                id="call-text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={2}
                placeholder={callLive.textInputPlaceholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    onTextSubmit(e);
                  }
                }}
              />
              <button type="submit" className="btn btn-primary" disabled={!textInput.trim()}>
                {callLive.say}
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
                {muted ? callLive.unmute : callLive.mute}
              </button>
            )}
            {showExtend && (
              <button type="button" className="btn" onClick={extend} data-testid="extend">
                {callLive.extend}
              </button>
            )}
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => endCall("hangup")}
              disabled={phase !== "live"}
              data-testid="hangup"
              aria-label={callLive.hangupLabel}
            >
              {callLive.hangup}
            </button>
            {endReason === "turn_cap" && <span className="muted">{callLive.turnCapEnd}</span>}
          </div>
        </>
      )}
    </div>
  );
}
