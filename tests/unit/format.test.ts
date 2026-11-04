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
  const now = new Date(2026, 10, 4, 15, 0);
  it("uses relative words for today and yesterday", () => {
    expect(formatDateTime(new Date(2026, 10, 4, 9, 5), now)).toBe("오늘 09:05");
    expect(formatDateTime(new Date(2026, 10, 3, 23, 59), now)).toBe("어제 23:59");
  });
  it("drops the year inside the same year and keeps it otherwise", () => {
    expect(formatDateTime(new Date(2026, 2, 2, 9, 12), now)).toBe("3월 2일 09:12");
    expect(formatDateTime(new Date(2025, 2, 2, 9, 12), now)).toBe("2025년 3월 2일 09:12");
  });
});
