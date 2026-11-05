"use client";

import { Mic, MicOff, Phone, PhoneOff, Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { callLive, chat, common } from "@/content/ko";
import { ApiError, apiJson } from "@/lib/client-fetch";
import { formatDurationWords } from "@/lib/format";
import { streamMessage } from "@/lib/ndjson-client";
import { getVoiceAdapter } from "@/lib/voice";
import { SentenceSplitter } from "@/lib/voice/sentence-splitter";
import type { VoiceAdapter, VoiceSupport } from "@/lib/voice/types";
import { Bubble, Button, CallStatus, Card, StatusMessage, Timer } from "@/components/ui";
import type { CallState } from "@/components/ui/CallStatus";

type Entry = { id: string; role: string; content: string };
type Phase = "idle" | "live" | "ending" | "ended";

type Props = {
  conversationId: string;
  themeLabel: string;
  openingLine: string;
  durationSec: number;
  // 서버에 기록된 통화 시작 시각. 새로고침 시 남은 시간 계산에 쓴다.
  startedAtMs: number;
  // 이미 시작한 통화(첫 인사가 저장됨)면 새로고침 뒤 이어서 진행한다.
  started: boolean;
  extendable: boolean;
  ttsVoice: string | null;
  initialMessages: Entry[];
};

const WARN_AT_SEC = 60;

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
  const [errorTone, setErrorTone] = useState<"error" | "info">("error");
  // 보내지 못한 말: 말풍선은 남기고 다시 보내기로 잇는다(채팅과 같은 규칙, 외부 피드백 5).
  const [failedId, setFailedId] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  // 마이크 권한 거부·장치 없음으로 글 입력으로 바뀐 이유. 오류가 아니라 안내 하나로 보여 준다(외부 피드백 4).
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  // 재시작 가능한 음성 인식 오류(4초 뒤 사라짐). 전송 오류와 자리를 나눠 다시 보내기가 가려지지 않게 한다.
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  // 다시 보내기(키보드 조작)에서 생긴 오류는 포커스를 메시지로 옮긴다. 말로 한 발화의 오류는 흐름을 끊지 않는다.
  const [errorFocus, setErrorFocus] = useState(false);
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
  const failedIdRef = useRef<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  // 통화 시작 PATCH(첫 인사를 index 0 으로 저장). 첫 발화 전송은 이것이 끝난 뒤에 한다.
  const startedRef = useRef<Promise<void>>(Promise.resolve());

  const markFailed = (id: string | null, content: string | null) => {
    failedIdRef.current = id;
    setFailedId(id);
    setLastFailed(content);
  };

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
    setErrorTone("error");
    const tempId = `tmp-${Date.now()}`;
    // 이전에 보내지 못한 말풍선은 새 말과 함께 내린다.
    const previousFailed = failedIdRef.current;
    markFailed(null, null);
    setEntries((e) => [
      ...e.filter((x) => x.id !== previousFailed),
      { id: tempId, role: "user", content: next },
    ]);
    setPartial("");
    const gen = speakGenRef.current;
    const splitter = new SentenceSplitter((s) => speakSentence(s, gen));
    let done = false;
    let finishInflight: () => void = () => undefined;
    inflightRef.current = new Promise<void>((r) => {
      finishInflight = r;
    });
    try {
      await startedRef.current;
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
          if (ev.code === "turn_cap") {
            // 대화 횟수 한도는 종료 안내 한 줄로만 알린다(오류 메시지 중복 금지).
            setEntries((e) => e.filter((x) => x.id !== tempId));
            void endCall("turn_cap");
          } else if (ev.code === "refusal") {
            // 거부는 오류가 아니라 안내. 서버가 사용자 턴을 지웠으므로 화면에서도 내린다.
            setEntries((e) => e.filter((x) => x.id !== tempId));
            setErrorTone("info");
            setError(ev.message);
          } else {
            // 서버가 사용자 턴을 지웠으므로 같은 내용으로 다시 보낼 수 있다.
            markFailed(tempId, next);
            setError(ev.message);
          }
        }
      });
      if (!done) splitter.flush();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "turn_cap") {
          setEntries((en) => en.filter((x) => x.id !== tempId));
          void endCall("turn_cap");
        } else if (e.code === "conversation_ended") {
          setEntries((en) => en.filter((x) => x.id !== tempId));
          setError(e.message);
        } else {
          markFailed(tempId, next);
          setError(e.message);
        }
      } else {
        // 연결이 끊긴 경우: 서버가 답변을 저장했을 수 있어 재전송 대신 새로고침을 권한다(채팅과 같은 규칙).
        setEntries((en) => en.filter((x) => x.id !== tempId));
        setError(callLive.networkError);
      }
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
        setErrorFocus(false);
        bargeIn();
        enqueueUtterance(text);
      },
      onError: (message, fatal) => {
        if (fatal) {
          // 권한 거부·마이크 없음: 재시작하지 않고 글 입력으로 바꾼다. 글로 대화하는 것은 정상 경로라
          // 오류 메시지 대신 이유를 담은 안내 하나만 보여 준다(외부 피드백 4).
          sttDisabledRef.current = true;
          adapter.stopListening();
          setSupport((sup) => ({ ...sup, stt: false }));
          setFallbackNotice(message);
          // 음소거 버튼이 사라지므로 포커스를 새 입력창으로 옮긴다(WCAG 2.4.3).
          setTimeout(() => textInputRef.current?.focus(), 0);
          return;
        }
        setVoiceNotice(message);
        // 재시작 가능한 오류는 다시 듣기 시작하면 지운다.
        setTimeout(() => setVoiceNotice((cur) => (cur === message ? null : cur)), 4000);
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
    const resuming = props.started;
    startedAtRef.current = resuming ? props.startedAtMs : Date.now();
    setPhaseBoth("live");
    setRemaining(
      Math.max(0, durationRef.current - Math.floor((Date.now() - startedAtRef.current) / 1000)),
    );
    if (!resuming) {
      // 첫 발화보다 먼저 서버가 시작(첫 인사 index 0)을 기록해야 하므로 processQueue 가 이 약속을 기다린다.
      // 듣기는 바로 시작하고, 실패해도 통화는 진행한다.
      startedRef.current = apiJson(`/api/conversations/${props.conversationId}`, {
        method: "PATCH",
        body: JSON.stringify({ started: true }),
      })
        .then(() => undefined)
        .catch(() => undefined);
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

  // 새 말풍선이 생기면 대화 영역 끝으로 스크롤한다.
  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: "end" });
  }, [entries, partial, interim]);

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
      // 연장 버튼은 1분 경고 밖에서 사라지므로, 거기 있던 포커스를 끊기 버튼으로 옮긴다(WCAG 2.4.3).
      // Button 은 ref 를 밖으로 내지 않아 testid 로 찾는다.
      if (document.activeElement?.getAttribute("data-testid") === "extend")
        document.querySelector<HTMLElement>('[data-testid="hangup"]')?.focus();
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
    setErrorFocus(false);
    bargeIn();
    enqueueUtterance(t);
  }

  function retryFailed() {
    const text = lastFailed;
    if (!text) return;
    setError(null);
    setErrorFocus(true);
    bargeIn();
    enqueueUtterance(text);
    // 버튼이 담긴 메시지가 사라지므로 포커스를 대화 영역으로 옮긴다. 다시 실패하면 오류 메시지가 포커스를 받는다.
    logRef.current?.focus();
  }

  const showExtend = phase === "live" && extendable && remaining <= WARN_AT_SEC;
  const warn = phase === "live" && remaining <= WARN_AT_SEC;
  const state: CallState =
    phase === "ending"
      ? "ending"
      : phase === "ended"
        ? "ended"
        : speaking
          ? "speaking"
          : busy
            ? "thinking"
            : muted
              ? "muted"
              : support.stt
                ? "listening"
                : "waiting";
  const statusSub =
    phase === "ending"
      ? callLive.status.endingHint
      : state === "speaking"
        ? callLive.idleTips[0]
        : state === "muted"
          ? callLive.status.mutedHint
          : undefined;

  return (
    <main className="call-shell">
      <h1 className="sr-only">{callLive.pageTitle}</h1>
      <div className="call-top">
        <div className="stack-sm" style={{ gap: 0 }}>
          <span className="t-label">{common.brand}</span>
          <span className="muted">
            {callLive.callOf(props.themeLabel, formatDurationWords(durationSec))}
          </span>
        </div>
        {phase !== "ending" && phase !== "ended" ? (
          <Timer remainingSec={remaining} totalSec={durationSec} warnAtSec={WARN_AT_SEC} />
        ) : null}
      </div>

      <div className="call-main">
        {phase === "idle" && (
          <Card
            as="section"
            className="call-idle"
            title={callLive.idleTitle}
            titleId="call-idle-title"
          >
            <p>{callLive.idleBody}</p>
            <ul>
              {callLive.idleTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <Button
              variant="primary"
              size="lg"
              onClick={startCall}
              data-testid="start-call"
              icon={<Phone size={20} />}
            >
              {callLive.start}
            </Button>
          </Card>
        )}

        {phase !== "idle" && (
          <>
            <CallStatus state={state} sub={statusSub} />

            {!support.stt && (
              <StatusMessage tone="info">
                {fallbackNotice ?? callLive.textModeNotice}
                {!support.tts ? ` ${callLive.noTtsNotice}` : ""}
              </StatusMessage>
            )}

            {warn && (
              <StatusMessage tone="warning" polite data-testid="one-minute">
                {callLive.status.oneMinuteLeft}
              </StatusMessage>
            )}

            <div
              ref={logRef}
              className="chat-messages call-transcript"
              role="log"
              tabIndex={-1}
              aria-label={callLive.logLabel}
            >
              <Bubble speaker="partner" data-testid="opening-line">
                {props.openingLine}
              </Bubble>
              {entries.map((m) => (
                <Bubble
                  key={m.id}
                  speaker={m.role === "user" ? "me" : "partner"}
                  failed={m.id === failedId}
                  failedLabel={chat.failedLabel}
                  data-testid={`msg-${m.role}`}
                >
                  {m.content}
                </Bubble>
              ))}
              {/* 토큰 단위로 바뀌는 말풍선은 라이브 리전에서 뺀다(완료 메시지만 읽힘). */}
              <div aria-live="off">
                {partial !== null && (
                  <Bubble speaker="partner" waiting={!partial} data-testid="streaming">
                    {partial || chat.waiting}
                  </Bubble>
                )}
                {interim && (
                  <Bubble
                    speaker="me"
                    interim
                    interimLabel={callLive.interimLabel}
                    data-testid="interim"
                  >
                    {interim}
                  </Bubble>
                )}
              </div>
            </div>

            {voiceNotice && (
              <StatusMessage tone="warning" polite>
                {voiceNotice}
              </StatusMessage>
            )}
            {error && (
              <StatusMessage
                tone={errorTone}
                focus={errorFocus && errorTone === "error"}
                action={
                  lastFailed && phase === "live" ? (
                    <Button onClick={retryFailed} disabled={busy}>
                      {common.retrySend}
                    </Button>
                  ) : error === callLive.networkError ? (
                    <Button onClick={() => window.location.reload()}>{chat.refresh}</Button>
                  ) : undefined
                }
              >
                {error}
              </StatusMessage>
            )}
            {endReason === "turn_cap" && (
              <StatusMessage tone="info">{callLive.turnCapEnd}</StatusMessage>
            )}
          </>
        )}
      </div>

      {phase !== "idle" && (
        <div className="call-controls">
          {phase === "live" && !support.stt && (
            <form onSubmit={onTextSubmit} className="call-text-form">
              <label htmlFor="call-text" className="sr-only">
                {callLive.textInputLabel}
              </label>
              <textarea
                id="call-text"
                ref={textInputRef}
                lang="en"
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
              <Button
                type="submit"
                variant="primary"
                disabled={!textInput.trim()}
                icon={<Send size={18} />}
              >
                {callLive.say}
              </Button>
            </form>
          )}
          <div className="call-buttons">
            <div className="controls-left">
              {support.stt && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={toggleMute}
                  disabled={phase !== "live"}
                  aria-pressed={muted}
                  icon={muted ? <MicOff size={22} /> : <Mic size={22} />}
                >
                  {muted ? callLive.unmute : callLive.mute}
                </Button>
              )}
            </div>
            <Button
              variant="danger"
              size="lg"
              onClick={() => endCall("hangup")}
              disabled={phase !== "live"}
              data-testid="hangup"
              aria-label={callLive.hangupLabel}
              icon={<PhoneOff size={22} />}
            >
              {callLive.hangup}
            </Button>
            <div className="controls-right">
              {showExtend && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={extend}
                  data-testid="extend"
                  icon={<Plus size={22} />}
                >
                  {callLive.extend}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
