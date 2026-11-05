import { describe, expect, it } from "vitest";
import { displayedCallSec } from "@/services/call/duration";
import { makeTitle } from "@/services/conversation";

describe("displayedCallSec", () => {
  const startedAt = new Date("2026-11-05T01:00:00Z");
  it("끝난 통화는 실제 경과 시간을, 진행 중이면 설정 길이를 돌려준다", () => {
    expect(displayedCallSec({ durationSec: 600, startedAt, endedAt: new Date("2026-11-05T01:01:10Z") })).toBe(70);
    expect(displayedCallSec({ durationSec: 600, startedAt, endedAt: null })).toBe(600);
  });
  it("설정 길이를 넘지 않고, 채팅(durationSec 없음)은 null", () => {
    expect(displayedCallSec({ durationSec: 600, startedAt, endedAt: new Date("2026-11-05T01:30:00Z") })).toBe(600);
    expect(displayedCallSec({ durationSec: null, startedAt, endedAt: new Date() })).toBeNull();
  });
});

describe("makeTitle", () => {
  it("짧은 문장은 그대로, 긴 문장은 단어 경계에서 자르고 말줄임표를 붙인다", () => {
    expect(makeTitle("Hello there")).toBe("Hello there");
    expect(makeTitle("Yesterday I go to the cafe and meet my friend from school")).toBe(
      "Yesterday I go to the cafe and meet my…",
    );
  });
  it("공백이 없으면 글자 수에서 자르고, 연속 공백은 하나로 줄인다", () => {
    expect(makeTitle("a".repeat(50))).toBe(`${"a".repeat(40)}…`);
    expect(makeTitle("  hi    there  ")).toBe("hi there");
  });
});
