// 숫자·시간 표기 규칙은 docs/design/WRITING.md 2.6 절.

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

const pad = (n: number) => n.toString().padStart(2, "0");

// 오늘·어제는 상대 표기, 올해는 월·일, 그 밖에는 연도까지.
export function formatDateTime(d: Date | string, now: Date = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const dayStart = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((dayStart(now) - dayStart(date)) / 86_400_000);
  if (diffDays === 0) return `오늘 ${time}`;
  if (diffDays === 1) return `어제 ${time}`;
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
}

export function formatTokens(n: number): string {
  return n.toLocaleString("en-US");
}
