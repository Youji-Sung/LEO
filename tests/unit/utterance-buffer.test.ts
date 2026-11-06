import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UtteranceBuffer, UTTERANCE_PAUSE_MS } from "@/lib/voice/utterance-buffer";

describe("utterance completion", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const setup = () => {
    const change = vi.fn();
    const commit = vi.fn();
    return { buffer: new UtteranceBuffer(change, commit), change, commit };
  };

  it("keeps short pauses within one turn and preserves grammatical mistakes", () => {
    const { buffer, commit } = setup();
    buffer.final("I go");
    vi.advanceTimersByTime(2000);
    expect(commit).not.toHaveBeenCalled();
    buffer.preview("to school yesterday");
    vi.advanceTimersByTime(4000);
    expect(commit).not.toHaveBeenCalled();
    buffer.final("to school yesterday.");
    vi.advanceTimersByTime(UTTERANCE_PAUSE_MS);
    expect(commit).toHaveBeenCalledExactlyOnceWith("I go to school yesterday.");
    expect(buffer.text()).toBe("");
  });

  it("speech onset cancels sending before the recognizer has returned any new words", () => {
    const { buffer, commit } = setup();
    buffer.final("There was");
    vi.advanceTimersByTime(2500);
    buffer.activity();
    vi.advanceTimersByTime(5000);
    expect(commit).not.toHaveBeenCalled();
    buffer.final("very much people.");
    vi.advanceTimersByTime(3000);
    expect(commit).toHaveBeenCalledExactlyOnceWith("There was very much people.");
  });

  it("does not send unconfirmed words automatically", () => {
    const { buffer, commit } = setup();
    buffer.preview("an incomplete thought");
    vi.advanceTimersByTime(30_000);
    expect(commit).not.toHaveBeenCalled();
    expect(buffer.confirmedText()).toBe("");
  });

  it("review mode waits indefinitely and sends the user's exact edited wording once", () => {
    const { buffer, commit } = setup();
    buffer.final("I went to school yesterday.");
    buffer.setAutomatic(false);
    vi.advanceTimersByTime(60_000);
    expect(commit).not.toHaveBeenCalled();
    buffer.send("I go to school yesterday.");
    buffer.send();
    expect(commit).toHaveBeenCalledExactlyOnceWith("I go to school yesterday.");
  });

  it("explicit sending can include the visible interim text", () => {
    const { buffer, commit } = setup();
    buffer.final("I am");
    buffer.preview("developer for five year");
    buffer.send();
    expect(commit).toHaveBeenCalledExactlyOnceWith("I am developer for five year");
  });

  it("clearing or leaving the call prevents a late API request", () => {
    for (const action of ["clear", "dispose"] as const) {
      const { buffer, commit } = setup();
      buffer.final("unsent");
      buffer[action]();
      vi.advanceTimersByTime(5000);
      expect(commit).not.toHaveBeenCalled();
    }
  });
});
