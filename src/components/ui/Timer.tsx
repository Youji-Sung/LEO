import { formatDuration } from "@/lib/format";
import { callLive } from "@/content/ko";

// 남은 시간 링 + 숫자 + 가로 막대. 매초 바뀌므로 aria-live 는 끄고, 1분 경고는 별도 status 영역이 맡는다.
// 링과 막대는 같은 비율을 그리는 장식이며 디자인이 하나를 고른다(기본: 링, 서재·무대·콘솔: 막대).
export function Timer({
  remainingSec,
  totalSec,
  warnAtSec = 60,
  label = callLive.timerLabel,
}: {
  remainingSec: number;
  totalSec: number;
  warnAtSec?: number;
  label?: string;
}) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const ratio = totalSec > 0 ? Math.max(0, Math.min(1, remainingSec / totalSec)) : 0;
  const warning = remainingSec <= warnAtSec;
  return (
    <div
      className="timer"
      role="timer"
      aria-live="off"
      aria-label={label}
      data-warning={warning ? "true" : "false"}
      data-testid="timer"
    >
      <svg className="timer-ring" viewBox="0 0 40 40" aria-hidden="true">
        <circle className="ring-track" cx="20" cy="20" r={r} />
        <circle
          className="ring-fill"
          cx="20"
          cy="20"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="timer-text">{formatDuration(remainingSec)}</span>
      <span className="timer-bar" aria-hidden="true">
        <span className="timer-bar-fill" style={{ width: `${Math.round(ratio * 1000) / 10}%` }} />
      </span>
    </div>
  );
}
