// 숫자·시간 표기 규칙은 docs/design/WRITING.md 2.6 절.
// 날짜는 서버·클라이언트 어디서 렌더해도 같은 글자가 나오도록 표시 시간대를 고정한다(하이드레이션 불일치 방지, DECISIONS 7단계).
export const DISPLAY_TIME_ZONE = "Asia/Seoul";

export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// 분 단위 길이를 말로: 600 → "10분", 630 → "10분 30초", 20 → "20초"
export function formatDurationWords(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}초`;
  return s === 0 ? `${m}분` : `${m}분 ${s}초`;
}

// 소수 둘째 자리. 0 은 "$0.00", 1센트 미만은 "$0.01 미만".
export function formatUsd(usd: number): string {
  if (usd <= 0) return "$0.00";
  if (usd < 0.01) return "$0.01 미만";
  return `$${usd.toFixed(2)}`;
}

type Parts = { year: number; month: number; day: number; hour: string; minute: string };

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function zonedParts(d: Date): Parts {
  const get = (type: string) =>
    partsFormatter.formatToParts(d).find((p) => p.type === type)?.value ?? "0";
  const hour = get("hour");
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    // 일부 런타임은 자정을 "24" 로 준다.
    hour: hour === "24" ? "00" : hour.padStart(2, "0"),
    minute: get("minute").padStart(2, "0"),
  };
}

function dayNumber(p: Parts): number {
  return Date.UTC(p.year, p.month - 1, p.day) / 86_400_000;
}

// 오늘·어제는 상대 표기, 올해는 월·일, 그 밖에는 연도까지.
export function formatDateTime(d: Date | string, now: Date = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const p = zonedParts(date);
  const n = zonedParts(now);
  const time = `${p.hour}:${p.minute}`;
  const diffDays = dayNumber(n) - dayNumber(p);
  if (diffDays === 0) return `오늘 ${time}`;
  if (diffDays === 1) return `어제 ${time}`;
  if (p.year === n.year) return `${p.month}월 ${p.day}일 ${time}`;
  return `${p.year}년 ${p.month}월 ${p.day}일 ${time}`;
}

export function formatTokens(n: number): string {
  return n.toLocaleString("en-US");
}
