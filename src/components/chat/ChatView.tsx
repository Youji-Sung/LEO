"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { chat, common } from "@/content/ko";
import { apiJson } from "@/lib/client-fetch";
import { streamMessage } from "@/lib/ndjson-client";
import type { Report } from "@/services/claude/schemas/report";

export type ChatMessageView = {
  id: string;
  role: string;
  content: string;
  hint: string | null;
  index: number;
};

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
    try {
      await streamMessage(props.conversationId, content, (ev) => {
        if (ev.type === "delta") setStreaming((s) => (s ?? "") + ev.text);
        else if (ev.type === "done") {
          setMessages((m) => [...m, { ...ev.message }]);
        } else if (ev.type === "error") {
          setError(ev.message);
          // 서버가 사용자 턴을 지웠으므로 화면에서도 내린다
          setMessages((m) => m.filter((x) => x.id !== tempId));
          if (ev.code !== "refusal") setLastFailed(content);
        }
      });
    } catch {
      // 네트워크가 끊긴 경우: 서버가 답변을 이미 저장했을 수 있으므로 재전송 대신 다시 불러온다.
      setError(chat.networkError);
      setMessages((m) => m.filter((x) => x.id !== tempId));
      router.refresh();
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
      await apiJson(`/api/conversations/${props.conversationId}`, {
        method: "PATCH",
        body: JSON.stringify({ hintsEnabled: next }),
      });
    } catch (e) {
      setHints(!next);
      setError((e as Error).message);
    }
  }

  async function makeReport() {
    setReportBusy(true);
    setError(null);
    try {
      await apiJson<{ report: Report }>(`/api/conversations/${props.conversationId}/report`, {
        method: "POST",
      });
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
          {chat.hintsToggle}
        </label>
        <button
          type="button"
          className="btn"
          onClick={makeReport}
          disabled={reportBusy || busy || messages.filter((m) => m.role === "user").length === 0}
        >
          {reportBusy ? chat.makingReport : props.hasReport ? chat.remakeReport : chat.makeReport}
        </button>
        {props.hasReport && (
          <a className="btn" href={`/history/${props.conversationId}/report`}>
            {chat.viewReport}
          </a>
        )}
      </div>

      <div className="chat-messages" role="log" aria-live="polite" aria-label={chat.logLabel}>
        {messages.length === 0 && (
          <p className="muted">
            {chat.emptyTitle}
            <br />
            <span lang="en">{chat.emptyExample}</span>
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`bubble bubble-${m.role}`} data-testid={`msg-${m.role}`}>
            <div className="bubble-text">{m.content}</div>
            {m.hint && (
              <div className="bubble-hint" data-testid="hint">
                {chat.hintLabel}: {m.hint}
              </div>
            )}
          </div>
        ))}
        {streaming !== null && (
          <div className="bubble bubble-assistant" data-testid="streaming">
            <div className="bubble-text">{streaming || chat.waiting}</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="error row" role="alert">
          <span>{error}</span>
          {lastFailed && (
            <button type="button" className="btn" onClick={() => send(lastFailed)} disabled={busy}>
              {common.retrySend}
            </button>
          )}
        </div>
      )}

      {ended ? (
        <p className="muted">
          {chat.endedNotice}{" "}
          <Link className="btn" href="/chat">
            {chat.endedAction}
          </Link>
        </p>
      ) : (
        <form onSubmit={onSubmit} className="chat-input row">
          <label htmlFor="chat-input" className="sr-only">
            {chat.inputLabel}
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
            placeholder={chat.inputPlaceholder}
            rows={2}
            disabled={busy}
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
            {chat.send}
          </button>
        </form>
      )}
    </div>
  );
}
