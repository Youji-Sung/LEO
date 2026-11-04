import { Keyboard, Loader, Mic, MicOff, Volume2 } from "lucide-react";
import { callLive } from "@/content/ko";

export type CallState =
  "listening" | "speaking" | "thinking" | "muted" | "waiting" | "ending" | "ended";

const ICONS = {
  listening: Mic,
  speaking: Volume2,
  thinking: Loader,
  muted: MicOff,
  waiting: Keyboard,
  ending: Loader,
  ended: Loader,
};

const LABELS: Record<CallState, string> = {
  listening: callLive.status.listening,
  speaking: callLive.status.speaking,
  thinking: callLive.status.thinking,
  muted: callLive.status.muted,
  waiting: callLive.status.waitingInput,
  ending: callLive.status.ending,
  ended: callLive.status.ended,
};

// 아이콘 + 글자 + (reduced-motion 이 아니면) 펄스. 색만으로 상태를 말하지 않는다(P1).
export function CallStatus({ state, sub }: { state: CallState; sub?: string }) {
  const Icon = ICONS[state];
  return (
    <div className="call-status" data-state={state} role="status" data-testid="call-status">
      <span className="call-status-icon">
        <Icon
          size={20}
          aria-hidden="true"
          className={state === "thinking" || state === "ending" ? "spinner-icon" : undefined}
        />
      </span>
      <span className="call-status-text">
        <span>{LABELS[state]}</span>
        {sub ? <span className="call-status-sub">{sub}</span> : null}
      </span>
    </div>
  );
}
