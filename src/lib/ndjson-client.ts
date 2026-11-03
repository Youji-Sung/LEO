import type { StreamEvent } from "@/services/conversation";
import { toApiError } from "@/lib/client-fetch";

// 메시지 전송 → NDJSON 스트림을 이벤트 단위로 넘겨준다. 비정상 HTTP 상태는 ApiError(code 포함)로 던진다.
export async function streamMessage(
  conversationId: string,
  content: string,
  onEvent: (ev: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal,
  });
  if (!res.ok) throw await toApiError(res);
  if (!res.body) throw new Error("응답 본문이 비어 있습니다.");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) onEvent(JSON.parse(line) as StreamEvent);
    }
  }
  const tail = buffer.trim();
  if (tail) onEvent(JSON.parse(tail) as StreamEvent);
}
