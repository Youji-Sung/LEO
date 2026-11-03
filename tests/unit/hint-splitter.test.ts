import { describe, expect, it } from "vitest";
import { HintSplitter, splitHint } from "@/services/claude/hint-splitter";

function run(chunks: string[]) {
  const seen: string[] = [];
  const s = new HintSplitter((t) => seen.push(t));
  for (const c of chunks) s.push(c);
  return { ...s.finish(), streamed: seen.join("") };
}

describe("HintSplitter", () => {
  it("separates the hint line from streamed text", () => {
    const r = run(["Hello the", "re! How ", "are you?\n[HI", "NT] \"I go\" → \"I went\" (과거)"]);
    expect(r.text).toBe("Hello there! How are you?");
    expect(r.streamed).toBe("Hello there! How are you?\n");
    expect(r.hint).toBe('"I go" → "I went" (과거)');
  });

  it("treats 없음 as no hint", () => {
    expect(splitHint("Nice.\n[HINT] 없음").hint).toBeNull();
    expect(splitHint("Nice.\n[HINT] none").hint).toBeNull();
  });

  it("passes text through when there is no marker, including brackets", () => {
    const r = run(["Use [brackets] like [H", "ello] fine"]);
    expect(r.text).toBe("Use [brackets] like [Hello] fine");
    expect(r.streamed).toBe("Use [brackets] like [Hello] fine");
    expect(r.hint).toBeNull();
  });

  it("flushes a held partial marker at the end", () => {
    const r = run(["I like [HIN"]);
    expect(r.text).toBe("I like [HIN");
    expect(r.hint).toBeNull();
  });
});
