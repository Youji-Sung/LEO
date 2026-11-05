import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { common } from "@/content/ko";

export type Speaker = "me" | "partner";

// 말풍선. 화자는 위치·채움·테두리로 구분되고, 보조 기술에는 화자 이름이 먼저 읽힌다(WCAG 1.4.1).
// 화자 라벨은 말풍선 밖의 `.bubble-speaker` 에 둔다: 기본 디자인은 시각적으로 숨기고(sr-only 상당),
// 서재·무대·콘솔은 각자 모양으로 보여 준다. 구분자(콜론)는 보조 기술에만 읽힌다.
export function Bubble({
  speaker,
  children,
  hint,
  hintLabel,
  interim = false,
  interimLabel,
  waiting = false,
  failed = false,
  failedLabel,
  "data-testid": testId,
}: {
  speaker: Speaker;
  children: ReactNode;
  hint?: string | null;
  hintLabel?: string;
  interim?: boolean;
  interimLabel?: string;
  waiting?: boolean;
  failed?: boolean;
  failedLabel?: string;
  "data-testid"?: string;
}) {
  const speakerLabel = speaker === "me" ? common.me : common.partner;
  return (
    <div className={`bubble-group bubble-group-${speaker}`}>
      <span className="bubble-speaker">
        <span className="bubble-speaker-name">{speakerLabel}</span>
        {interim && interimLabel ? (
          <span className="bubble-speaker-note"> ({interimLabel})</span>
        ) : null}
        <span className="sr-only">: </span>
      </span>
      <div
        className={`bubble bubble-${speaker}${interim ? " bubble-interim" : ""}${waiting ? " bubble-waiting" : ""}${failed ? " bubble-failed" : ""}`}
        data-testid={testId}
      >
        <span lang={waiting ? undefined : "en"}>{children}</span>
      </div>
      {failed && failedLabel ? <span className="bubble-failed-label">{failedLabel}</span> : null}
      {hint ? (
        <div className="bubble-hint" data-testid="hint">
          <Lightbulb size={16} aria-hidden="true" />
          <span>
            <span className="sr-only">{hintLabel ? `${hintLabel}: ` : ""}</span>
            {hint}
          </span>
        </div>
      ) : null}
    </div>
  );
}
