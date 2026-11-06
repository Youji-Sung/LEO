import { describe, expect, it } from "vitest";
import { HintSplitter, splitHint, hintForMessage } from "@/services/claude/hint-splitter";

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

describe("hint evidence", () => {
  const hint = "I go there yesterday → I went there yesterday · 지난 일은 과거형으로 써요";
  it("rejects an old correction on a new, correct message", () => {
    expect(hintForMessage(hint, "A flat white, please.")).toBeNull();
    expect(hintForMessage(hint, "Does the cake contain nuts?")).toBeNull();
    expect(hintForMessage(hint, "I go there yesterday.")).toBe(hint);
  });
  it("accepts excerpts with whitespace and typographic apostrophe differences", () => {
    const correction = "He don't → He doesn't · 주어에 맞춰요";
    expect(hintForMessage(correction, "He  don’t understand my question.")).toBe(correction);
    expect(hintForMessage('"I go" → "I went" · 과거형', "I go there yesterday.")).not.toBeNull();
  });
  it("rejects partial word matches and missing original phrases", () => {
    expect(hintForMessage("go → went · 과거형", "The algorithm worked.")).toBeNull();
    expect(hintForMessage("He don't → He doesn't", "She don't understand.")).toBeNull();
    expect(hintForMessage("없음", "Hi.")).toBeNull();
    expect(hintForMessage(" → went", "I go.")).toBeNull();
    expect(hintForMessage("I go → ", "I go.")).toBeNull();
  });
});
