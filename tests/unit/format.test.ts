import { describe, expect, it } from "vitest";
import { formatDuration, formatUsd } from "@/lib/format";

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

describe("formatUsd", () => {
  it("shows four decimals", () => {
    expect(formatUsd(0.00123)).toBe("$0.0012");
  });
});
