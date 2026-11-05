"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { chat, common } from "@/content/ko";
import { ApiError, apiJson } from "@/lib/client-fetch";
import { streamMessage } from "@/lib/ndjson-client";
import type { Report } from "@/services/claude/schemas/report";
import {
  Badge,
  Bubble,
  Button,
  ButtonLink,
  Dialog,
  EmptyState,
  StatusMessage,
} from "@/components/ui";

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
  const [errorTone, setErrorTone] = useState<"error" | "info">("error");
  const [failedId, setFailedId] = useState<string | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ended, setEnded] = useState(props.ended);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reportHref = `/history/${props.conversationId}/report`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, streaming]);

  // 입력창 높이는 내용만큼 자라고 상한(CSS max-height)에서 스크롤한다.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  async function send(content: string) {
    setBusy(true);
    setError(null);
    setErrorTone("error");
    setLastFailed(null);
    // 이전에 보내지 못한 말풍선은 재전송과 함께 내린다.
    if (failedId) {
      setMessages((m) => m.filter((x) => x.id !== failedId));
      setFailedId(null);
    }
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content, hint: null, index: m.length }]);
    let ok = false;
    setStreaming("");
    try {
      await streamMessage(props.conversationId, content, (ev) => {
        if (ev.type === "delta") setStreaming((s) => (s ?? "") + ev.text);
        else if (ev.type === "done") {
          ok = true;
          setMessages((m) => [...m, { ...ev.message }]);
        } else if (ev.type === "error") {
          setError(ev.message);
          if (ev.code === "refusal") {
            // 거부는 오류가 아니라 안내. 서버가 사용자 턴을 지웠으므로 화면에서도 내린다.
            setErrorTone("info");
            setMessages((m) => m.filter((x) => x.id !== tempId));
          } else {
            // 보내지 못한 말풍선은 남겨 두고(입력 보존) 다시 보내기로 잇는다.
            setFailedId(tempId);
            setLastFailed(content);
          }
        }
      });
    } catch (e) {
      if (e instanceof ApiError) {
        // 서버가 상태 코드로 거절한 경우(대화 횟수 한도, 끝난 대화 등): 서버 문구를 그대로 보여 준다.
        setError(e.message);
        if (e.code !== "turn_cap" && e.code !== "conversation_ended") {
          setFailedId(tempId);
          setLastFailed(content);
        } else {
          // 한도·종료는 사실 고지라 오류색이 아니라 안내(통화 화면과 같은 톤).
          setErrorTone("info");
          setMessages((m) => m.filter((x) => x.id !== tempId));
        }
      } else {
        // 네트워크가 끊긴 경우: 서버가 답변을 이미 저장했을 수 있으므로 재전송 대신 새로고침을 권한다.
        setMessages((m) => m.filter((x) => x.id !== tempId));
        setError(chat.networkError);
      }
    } finally {
      setStreaming(null);
      setBusy(false);
      // 오류일 때는 포커스가 오류 메시지로 가므로 성공했을 때만 입력창으로 돌아간다.
      if (ok) inputRef.current?.focus();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    setInput("");
    await send(content);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (!busy) void onSubmit(e);
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
      router.push(reportHref);
    } catch (e) {
      setError((e as Error).message);
      setConfirmOpen(false);
    } finally {
      setReportBusy(false);
    }
  }

  // 보내지 못한 말풍선은 서버에 없으므로 리포트 대상에서 뺀다.
  const userCount = messages.filter((m) => m.role === "user" && m.id !== failedId).length;
  const reportDisabled = reportBusy || busy || userCount === 0;

  return (
    <div className="chat">
      <div className="chat-toolbar">
        <Badge tone="accent">{props.themeLabel}</Badge>
        {props.title && (
          <span
            className="muted"
            style={{
              flex: "1 1 8rem",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {props.title}
          </span>
        )}
        <span className="spacer" />
        <label className="check-row check-row-switch">
          <input type="checkbox" checked={hints} onChange={toggleHints} disabled={ended} />
          {/* 무대 디자인이 알약 스위치로 그리는 트랙. 기본에서는 보이지 않는다. */}
          <span className="switch-track" aria-hidden="true" />
          <span>{chat.hintsToggle}</span>
        </label>
        <Button
          variant={props.hasReport ? "ghost" : "secondary"}
          onClick={props.hasReport ? () => setConfirmOpen(true) : makeReport}
          disabled={reportDisabled}
          loading={reportBusy}
          loadingLabel={chat.makingReport}
        >
          {props.hasReport ? chat.remakeReport : chat.makeReport}
        </Button>
        {props.hasReport && (
          <ButtonLink href={reportHref} variant="secondary">
            {chat.viewReport}
          </ButtonLink>
        )}
      </div>

      {props.hasReport && (
        <Dialog
          open={confirmOpen}
          title={chat.remakeConfirmTitle}
          description={chat.remakeConfirmBody}
          confirmLabel={chat.remakeConfirmAction}
          onConfirm={makeReport}
          onClose={() => setConfirmOpen(false)}
          busy={reportBusy}
        />
      )}

      <div className="chat-messages" role="log" aria-label={chat.logLabel}>
        {messages.length === 0 && (
          // 예문은 영어라 lang="en" 이 필요해 EmptyState 의 body 대신 행동 자리에 둔다.
          // "예시" 라벨과 따옴표로 예문임을 드러낸다(외부 피드백 2).
          <EmptyState
            title={chat.emptyTitle}
            action={
              <p className="empty-example">
                <Badge>{chat.emptyExampleLabel}</Badge>
                <q lang="en">{chat.emptyExample}</q>
              </p>
            }
          />
        )}
        {messages.map((m) => (
          <Bubble
            key={m.id}
            speaker={m.role === "user" ? "me" : "partner"}
            hint={m.hint}
            hintLabel={chat.hintLabel}
            failed={m.id === failedId}
            failedLabel={chat.failedLabel}
            data-testid={`msg-${m.role}`}
          >
            {m.content}
          </Bubble>
        ))}
        {/* 토큰 단위로 바뀌는 스트리밍 말풍선은 라이브 리전에서 뺀다. */}
        <div aria-live="off">
          {streaming !== null && (
            <Bubble speaker="partner" waiting={!streaming} data-testid="streaming">
              {streaming || chat.waiting}
            </Bubble>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {error && (
        <StatusMessage
          focus
          tone={errorTone}
          action={
            lastFailed ? (
              <Button onClick={() => send(lastFailed)} disabled={busy}>
                {common.retrySend}
              </Button>
            ) : error === chat.networkError ? (
              <Button onClick={() => window.location.reload()}>{chat.refresh}</Button>
            ) : undefined
          }
        >
          {error}
        </StatusMessage>
      )}

      {ended ? (
        <StatusMessage
          tone="info"
          action={
            <ButtonLink href="/chat" variant="secondary">
              {chat.endedAction}
            </ButtonLink>
          }
        >
          {chat.endedNotice}
        </StatusMessage>
      ) : (
        <form onSubmit={onSubmit} className="chat-input">
          <label htmlFor="chat-input" className="sr-only">
            {chat.inputLabel}
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            lang="en"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={chat.inputPlaceholder}
            rows={1}
          />
          <Button
            type="submit"
            variant="primary"
            icon={<Send size={18} />}
            disabled={busy || !input.trim()}
          >
            {chat.send}
          </Button>
          <span className="chat-input-hint">{chat.inputHint}</span>
        </form>
      )}
    </div>
  );
}
