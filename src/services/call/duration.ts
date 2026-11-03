export const CALL_DURATION_OPTIONS_MIN = [10, 20, 30] as const;
export const DEFAULT_CALL_MINUTES = 10;
export const MAX_CALL_MINUTES = 30;
export const EXTEND_STEP_MINUTES = 10;

// 테스트에서는 LEO_ALLOW_SHORT_CALLS=1 로 1분 미만(초 단위) 통화를 허용한다.
export function allowShortCalls(): boolean {
  return process.env.LEO_ALLOW_SHORT_CALLS === "1";
}

export function normalizeCallDurationSec(durationMin: number | undefined): number {
  if (durationMin === undefined) return DEFAULT_CALL_MINUTES * 60;
  if (allowShortCalls() && durationMin <= 0) return 20;
  const allowed = (CALL_DURATION_OPTIONS_MIN as readonly number[]).includes(durationMin) ? durationMin : DEFAULT_CALL_MINUTES;
  return allowed * 60;
}

export function canExtend(currentSec: number): boolean {
  return currentSec + EXTEND_STEP_MINUTES * 60 <= MAX_CALL_MINUTES * 60;
}

export function extendedDurationSec(currentSec: number): number {
  if (!canExtend(currentSec)) return currentSec;
  return currentSec + EXTEND_STEP_MINUTES * 60;
}
