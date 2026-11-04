import { describe, expect, it } from "vitest";
import { formatDateTime, formatDuration, formatDurationWords, formatUsd } from "@/lib/format";

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });
  it("clamps negatives", () => {
    expect(formatDuration(-5)).toBe("0:00");
  });
});

describe("formatDurationWords", () => {
  it("speaks minutes and seconds", () => {
    expect(formatDurationWords(600)).toBe("10분");
    expect(formatDurationWords(630)).toBe("10분 30초");
    expect(formatDurationWords(20)).toBe("20초");
  });
});

describe("formatUsd", () => {
  it("shows two decimals and a floor for sub-cent amounts", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(0.00123)).toBe("$0.01 미만");
    expect(formatUsd(0.1055)).toBe("$0.11");
    expect(formatUsd(12.5)).toBe("$12.50");
  });
});

describe("formatDateTime", () => {
  // 표시 시간대는 Asia/Seoul(UTC+9) 로 고정된다. 입력은 UTC 로 만들어 어느 머신에서나 같은 결과가 나오게 한다.
  const now = new Date(Date.UTC(2026, 10, 4, 6, 0)); // 2026-11-04 15:00 KST
  it("uses relative words for today and yesterday", () => {
    expect(formatDateTime(new Date(Date.UTC(2026, 10, 4, 0, 5)), now)).toBe("오늘 09:05");
    expect(formatDateTime(new Date(Date.UTC(2026, 10, 3, 14, 59)), now)).toBe("어제 23:59");
  });
  it("crosses the day boundary in the display time zone, not UTC", () => {
    // 2026-11-03 16:30 UTC = 11월 4일 01:30 KST → 오늘
    expect(formatDateTime(new Date(Date.UTC(2026, 10, 3, 16, 30)), now)).toBe("오늘 01:30");
  });
  it("drops the year inside the same year and keeps it otherwise", () => {
    expect(formatDateTime(new Date(Date.UTC(2026, 2, 2, 0, 12)), now)).toBe("3월 2일 09:12");
    expect(formatDateTime(new Date(Date.UTC(2025, 2, 2, 0, 12)), now)).toBe("2025년 3월 2일 09:12");
  });
});
