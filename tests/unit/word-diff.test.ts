import { describe, expect, it } from "vitest";
import { diffWords } from "@/lib/word-diff";

const kinds = (tokens: { text: string; kind: string }[]) =>
  tokens.map((t) => `${t.kind}:${t.text}`);

describe("diffWords", () => {
  it("marks only the changed words, ignoring case and punctuation when matching", () => {
    const d = diffWords("I go to school yesterday.", "I went to school yesterday.");
    expect(kinds(d.original)).toEqual([
      "same:I",
      "removed:go",
      "same:to",
      "same:school",
      "same:yesterday.",
    ]);
    expect(kinds(d.revised)).toEqual([
      "same:I",
      "added:went",
      "same:to",
      "same:school",
      "same:yesterday.",
    ]);
  });

  it("handles insertions, deletions and identical sentences", () => {
    const ins = diffWords("There was very much people.", "There were a lot of people.");
    expect(ins.original.filter((t) => t.kind === "removed").map((t) => t.text)).toEqual([
      "was",
      "very",
      "much",
    ]);
    expect(ins.revised.filter((t) => t.kind === "added").map((t) => t.text)).toEqual([
      "were",
      "a",
      "lot",
      "of",
    ]);
    const same = diffWords("I agree.", "i agree");
    expect(same.original.every((t) => t.kind === "same")).toBe(true);
    expect(same.revised.every((t) => t.kind === "same")).toBe(true);
    expect(diffWords("", "Hello")).toEqual({
      original: [],
      revised: [{ text: "Hello", kind: "added" }],
    });
  });
});
