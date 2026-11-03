import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeVoiceAdapter } from "@/lib/voice/fake";
import { SentenceSplitter } from "@/lib/voice/sentence-splitter";
import type { FakeVoiceControls } from "@/lib/voice/types";

const g = globalThis as { window?: { __leoFakeVoice?: FakeVoiceControls } };

describe("FakeVoiceAdapter", () => {
  afterEach(() => {
    delete g.window;
    vi.restoreAllMocks();
  });

  it("say() delivers interim then final to the active listener", () => {
    const adapter = new FakeVoiceAdapter();
    const calls: string[] = [];
    adapter.startListening({
      onInterim: (t) => calls.push(`interim:${t}`),
      onFinal: (t) => calls.push(`final:${t}`),
    });
    expect(adapter.listening()).toBe(true);
    adapter.say("hello there");
    expect(calls).toEqual(["interim:hello there", "final:hello there"]);
    adapter.stopListening();
    expect(adapter.listening()).toBe(false);
  });

  it("say() while not listening warns and drops the text", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const adapter = new FakeVoiceAdapter();
    adapter.say("lost");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("startListening while listening replaces handlers", () => {
    const adapter = new FakeVoiceAdapter();
    const first: string[] = [];
    const second: string[] = [];
    adapter.startListening({ onFinal: (t) => first.push(t) });
    adapter.startListening({ onFinal: (t) => second.push(t) });
    adapter.say("x");
    expect(first).toEqual([]);
    expect(second).toEqual(["x"]);
  });

  it("speak() records text, reports speaking, and resolves", async () => {
    const adapter = new FakeVoiceAdapter();
    const p = adapter.speak("Hi.");
    expect(adapter.isSpeaking()).toBe(true);
    await p;
    expect(adapter.isSpeaking()).toBe(false);
    expect(adapter.spoken()).toEqual(["Hi."]);
    adapter.spoken().push("mutated");
    expect(adapter.spoken()).toEqual(["Hi."]);
  });

  it("cancelSpeech() resolves pending speak immediately", async () => {
    vi.useFakeTimers();
    try {
      const adapter = new FakeVoiceAdapter();
      let done = false;
      const p = adapter.speak("Long sentence.").then(() => {
        done = true;
      });
      adapter.cancelSpeech();
      await p;
      expect(done).toBe(true);
      expect(adapter.isSpeaking()).toBe(false);
      vi.runAllTimers();
      expect(adapter.spoken()).toEqual(["Long sentence."]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("setSupport overrides isSupported", () => {
    const adapter = new FakeVoiceAdapter();
    expect(adapter.isSupported()).toEqual({ stt: true, tts: true });
    adapter.setSupport({ stt: false, tts: true });
    expect(adapter.isSupported()).toEqual({ stt: false, tts: true });
  });

  it("listVoices returns the fake English voice", () => {
    expect(new FakeVoiceAdapter().listVoices()).toEqual([
      { id: "fake-en", name: "Fake English", lang: "en-US" },
    ]);
  });

  it("installs window.__leoFakeVoice controls when window exists", () => {
    g.window = {};
    const adapter = new FakeVoiceAdapter();
    const controls = g.window.__leoFakeVoice;
    expect(controls).toBeDefined();
    if (!controls) throw new Error("controls missing");
    const finals: string[] = [];
    adapter.startListening({ onFinal: (t) => finals.push(t) });
    expect(controls.listening()).toBe(true);
    controls.say("via controls");
    expect(finals).toEqual(["via controls"]);
    controls.setSupport({ stt: false, tts: false });
    expect(adapter.isSupported()).toEqual({ stt: false, tts: false });
    void adapter.speak("spoken");
    expect(controls.spoken()).toEqual(["spoken"]);
    adapter.cancelSpeech();
  });
});

describe("SentenceSplitter", () => {
  function make(): { out: string[]; s: SentenceSplitter } {
    const out: string[] = [];
    return { out, s: new SentenceSplitter((x) => out.push(x)) };
  }

  it("emits a sentence once its terminator is followed by whitespace", () => {
    const { out, s } = make();
    s.push("Hello world. How are");
    expect(out).toEqual(["Hello world."]);
    s.push(" you? Fine");
    expect(out).toEqual(["Hello world.", "How are you?"]);
  });

  it("holds a trailing terminator until more text or flush arrives", () => {
    const { out, s } = make();
    s.push("Wait.");
    expect(out).toEqual([]);
    s.push(" Go");
    expect(out).toEqual(["Wait."]);
    s.flush();
    expect(out).toEqual(["Wait.", "Go"]);
  });

  it("handles deltas that split mid-sentence and mid-word", () => {
    const { out, s } = make();
    for (const d of ["I lo", "ve cod", "ing", ". It", " is fun", "! Rea", "lly.", " Yes"])
      s.push(d);
    expect(out).toEqual(["I love coding.", "It is fun!", "Really."]);
  });

  it("does not split on decimals", () => {
    const { out, s } = make();
    s.push("Version 3.5 is out. Version 3.");
    s.push("6 is next. ");
    expect(out).toEqual(["Version 3.5 is out.", "Version 3.6 is next."]);
  });

  it("does not split on abbreviations", () => {
    const { out, s } = make();
    s.push("Mr. Smith and Dr. Lee use e.g. React vs. Vue, etc. Then they stop. ");
    expect(out).toEqual(["Mr. Smith and Dr. Lee use e.g. React vs. Vue, etc. Then they stop."]);
  });

  it("splits on newlines", () => {
    const { out, s } = make();
    s.push("First line\nSecond line.\n\nThird");
    expect(out).toEqual(["First line", "Second line.", "Third"].slice(0, 2));
    s.push("\n");
    expect(out).toEqual(["First line", "Second line.", "Third"]);
  });

  it("flush emits the remainder and skips empties", () => {
    const { out, s } = make();
    s.push("   ");
    s.flush();
    expect(out).toEqual([]);
    s.push("Tail without period");
    s.flush();
    s.flush();
    expect(out).toEqual(["Tail without period"]);
  });

  it("keeps closing quotes and parens attached to the sentence", () => {
    const { out, s } = make();
    s.push('She said "Go home." (It was late.) Then she left. ');
    expect(out).toEqual(['She said "Go home."', "(It was late.)", "Then she left."]);
  });

  it("treats repeated punctuation as one terminator", () => {
    const { out, s } = make();
    s.push("What?! No way... Sure. ");
    expect(out).toEqual(["What?!", "No way...", "Sure."]);
  });

  it("trims whitespace around sentences", () => {
    const { out, s } = make();
    s.push("  Hi.   Bye.  \n");
    expect(out).toEqual(["Hi.", "Bye."]);
  });
});
