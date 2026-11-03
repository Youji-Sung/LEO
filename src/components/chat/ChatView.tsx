"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiJson } from "@/lib/client-fetch";
import { streamMessage } from "@/lib/ndjson-client";
import type { Report } from "@/services/claude/schemas/report";

export type ChatMessageView = { id: string; role: string; content: string; hint: string | null; index: number };

type Props = {
  conversationId: string;
  themeLabel: string;
  title: string | null;
  initialMessages: ChatMessageView[];
  initialHints: boolean;
  ended: boolean;
  hasReport: boolean;
};

export function ChatView(props: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageView[]>(props.initialMessages);
  const [input, setInput] = useState("");
  const [hints, setHints] = useState(props.initialHints);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [ended, setEnded] = useState(props.ended);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, streaming]);

  async function send(content: string) {
    setBusy(true);
    setError(null);
    setLastFailed(null);
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content, hint: null, index: m.length }]);
    setStreaming("");
    let gotDone = false;
    try {
      await streamMessage(props.conversationId, content, (ev) => {
        if (ev.type === "delta") setStreaming((s) => (s ?? "") + ev.text);
        else if (ev.type === "done") {
          gotDone = true;
          setMessages((m) => [...m, { ...ev.message }]);
        } else if (ev.type === "error") {
          setError(ev.message);
          if (ev.code !== "refusal") setLastFailed(content);
        }
      });
      if (!gotDone && !error) {
        // 서버가 done 없이 끝났으면 입력을 되살린다.
      }
    } catch (e) {
      setError((e as Error).message);
      setLastFailed(content);
      setMessages((m) => m.filter((x) => x.id !== tempId));
    } finally {
      setStreaming(null);
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    setInput("");
    await send(content);
  }

  async function toggleHints() {
    const next = !hints;
    setHints(next);
    try {
      await apiJson(`/api/conversations/${props.conversationId}`, { method: "PATCH", body: JSON.stringify({ hintsEnabled: next }) });
    } catch (e) {
      setHints(!next);
      setError((e as Error).message);
    }
  }

  async function makeReport() {
    setReportBusy(true);
    setError(null);
    try {
      await apiJson<{ report: Report }>(`/api/conversations/${props.conversationId}/report`, { method: "POST" });
      setEnded(true);
      router.push(`/history/${props.conversationId}/report`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <div className="chat">
      <div className="chat-toolbar row">
        <strong>{props.themeLabel}</strong>
        {props.title && <span className="muted">· {props.title}</span>}
        <label className="row" style={{ marginLeft: "auto", gap: 6 }}>
          <input type="checkbox" checked={hints} onChange={toggleHints} disabled={ended} />
          교정 힌트
        </label>
        <button type="button" className="btn" onClick={makeReport} disabled={reportBusy || busy || messages.filter((m) => m.role === "user").length === 0}>
          {reportBusy ? "리포트 생성 중…" : props.hasReport ? "리포트 다시 생성" : "리포트 생성"}
        </button>
        {props.hasReport && (
          <a className="btn" href={`/history/${props.conversationId}/report`}>
            리포트 보기
          </a>
        )}
      </div>

      <div className="chat-messages" role="log" aria-live="polite" aria-label="대화">
        {messages.length === 0 && <p className="muted">영어로 첫 메시지를 보내 보세요. 예: &quot;Hi! Can I tell you about my week?&quot;</p>}
        {messages.map((m) => (
          <div key={m.id} className={`bubble bubble-${m.role}`} data-testid={`msg-${m.role}`}>
            <div className="bubble-text">{m.content}</div>
            {m.hint && (
              <div className="bubble-hint" data-testid="hint">
                교정 힌트: {m.hint}
              </div>
            )}
          </div>
        ))}
        {streaming !== null && (
          <div className="bubble bubble-assistant" data-testid="streaming">
            <div className="bubble-text">{streaming || "…"}</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="error row" role="alert">
          <span>{error}</span>
          {lastFailed && (
            <button type="button" className="btn" onClick={() => send(lastFailed)} disabled={busy}>
              다시 시도
            </button>
          )}
        </div>
      )}

      {ended ? (
        <p className="muted">종료된 대화입니다. 새 대화를 시작하세요.</p>
      ) : (
        <form onSubmit={onSubmit} className="chat-input row">
          <label htmlFor="chat-input" className="sr-only">
            메시지
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void onSubmit(e);
              }
            }}
            placeholder="영어로 입력 (Enter 전송, Shift+Enter 줄바꿈)"
            rows={2}
            disabled={busy}
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
            보내기
          </button>
        </form>
      )}
    </div>
  );
}
