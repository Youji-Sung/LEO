import { describe, expect, it } from "vitest";
import { speechSuggestions, uncertainSpeech, speechAnnotation } from "@/lib/transcription";
import { chooseOpening } from "@/services/call/openings";
import { THEME_IDS } from "@/services/claude/types";
import { containsExpression, clozeExample, nextLearningState } from "@/lib/learning";

describe("speech recognition evidence", () => {
  it("suggests only the mistaken technical phrase and preserves actual grammar", () => {
    const original = "He don't understand my question. I am a front and engineer.";
    expect(speechSuggestions(original)).toEqual([
      { from: "front and engineer", to: "frontend engineer" },
    ]);
    expect(original.replace("front and engineer", "frontend engineer")).toContain("He don't");
    expect(speechSuggestions("He don't understand my question.")).toEqual([]);
    expect(speechSuggestions("I work at the front and engineers work at the back.")).toEqual([]);
  });
  it("does not silently choose an alternative that corrected grammar", () => {
    expect(speechSuggestions("He don't use react", ["He doesn't use React"], ["React"])).toEqual(
      [],
    );
    expect(speechSuggestions("I use postgress", ["I use PostgreSQL"], ["PostgreSQL"])).toEqual([
      { from: "postgress", to: "PostgreSQL" },
    ]);
  });
  it("separates user verification from recognizer confidence", () => {
    const rawText = "I am a front and engineer";
    expect(uncertainSpeech(rawText, { rawText, reviewed: false })).toHaveLength(1);
    expect(uncertainSpeech(rawText, { rawText, reviewed: true })).toHaveLength(0);
    expect(speechAnnotation(rawText)).toContain("Do not treat these spans as evidence");
  });
});
describe("learning and opening design", () => {
  it.each(THEME_IDS)("varies %s openings without repeating the last three", (theme) => {
    const seen: string[] = [];
    for (let i = 0; i < 12; i++) {
      const line = chooseOpening(theme, seen.slice(-3).reverse());
      expect(seen.slice(-3)).not.toContain(line);
      seen.push(line);
    }
  });
  it("matches complete expressions, not substrings, and builds a grounded cloze", () => {
    expect(containsExpression("The docs were excellent!", "excellent")).toBe(true);
    expect(containsExpression("excellentness", "excellent")).toBe(false);
    expect(clozeExample("We ran into an issue today.", "ran into an issue")).toBe(
      "We _____ today.",
    );
    expect(clozeExample("No matching example", "run into an issue")).toBe("_____");
  });
  it("supports a return to explanation and schedules recall without declaring mastery", () => {
    expect(nextLearningState(2, 2, "again", 0)).toEqual({ stage: 1, dueAt: new Date(600_000) });
    expect(nextLearningState(1, 1, "ready", 0).stage).toBe(2);
    expect(nextLearningState(4, 10, "ready", 0)).toEqual({
      stage: 4,
      dueAt: new Date(14 * 86400_000),
    });
    expect(nextLearningState(3, 5, "hint", 0).stage).toBe(3);
  });
});
