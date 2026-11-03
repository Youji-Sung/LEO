import { afterEach, describe, expect, it } from "vitest";
import { canExtend, extendedDurationSec, normalizeCallDurationSec } from "@/services/call/duration";

const prev = process.env.LEO_ALLOW_SHORT_CALLS;
afterEach(() => {
  if (prev === undefined) delete process.env.LEO_ALLOW_SHORT_CALLS;
  else process.env.LEO_ALLOW_SHORT_CALLS = prev;
});

describe("call duration", () => {
  it("accepts 10/20/30 minutes and defaults otherwise", () => {
    expect(normalizeCallDurationSec(undefined)).toBe(600);
    expect(normalizeCallDurationSec(20)).toBe(1200);
    expect(normalizeCallDurationSec(30)).toBe(1800);
    expect(normalizeCallDurationSec(15)).toBe(600);
    expect(normalizeCallDurationSec(45)).toBe(600);
  });

  it("allows a 20-second test call only when LEO_ALLOW_SHORT_CALLS=1", () => {
    process.env.LEO_ALLOW_SHORT_CALLS = "1";
    expect(normalizeCallDurationSec(0)).toBe(20);
    process.env.LEO_ALLOW_SHORT_CALLS = "0";
    expect(normalizeCallDurationSec(0)).toBe(600);
  });

  it("extends by 10 minutes up to 30", () => {
    expect(canExtend(600)).toBe(true);
    expect(extendedDurationSec(600)).toBe(1200);
    expect(canExtend(1200)).toBe(true);
    expect(extendedDurationSec(1200)).toBe(1800);
    expect(canExtend(1800)).toBe(false);
    expect(extendedDurationSec(1800)).toBe(1800);
    expect(canExtend(20)).toBe(true);
  });
});
