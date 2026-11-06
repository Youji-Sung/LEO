import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebSpeechVoiceAdapter } from "@/lib/voice/web-speech";

type ResultEvent = { resultIndex: number; results: { isFinal: boolean; length: number; 0: { transcript: string } }[] };
class Recognition {
  static instances: Recognition[] = [];
  static throwOnStart = false;
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  onstart: (() => void) | null = null;
  onspeechstart: (() => void) | null = null;
  onresult: ((event: ResultEvent) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  constructor() { Recognition.instances.push(this); }
  start() { if (Recognition.throwOnStart) throw new Error("recognizer still stopping"); }
  stop = vi.fn();
  abort = vi.fn();
}
class Utterance {
  lang = "";
  rate = 1;
  volume = 1;
  voice: { voiceURI: string } | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  constructor(readonly text: string) {}
}
const voice = (name: string) => ({ name, voiceURI: name, lang: "en-US", default: false, localService: true });
const synth = {
  paused: false,
  speak: vi.fn<(utterance: Utterance) => void>(),
  cancel: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => [voice("Compact"), voice("Samantha Enhanced")]),
};

describe("native Web Speech integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    Recognition.instances = [];
    Recognition.throwOnStart = false;
    synth.getVoices.mockReturnValue([voice("Compact"), voice("Samantha Enhanced")]);
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
    vi.stubGlobal("window", {
      navigator: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) CriOS/130", platform: "iPhone" },
      webkitSpeechRecognition: Recognition,
      speechSynthesis: synth,
    });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("waits for actual recognition start, reports speech onset and keeps each final only once", () => {
    const adapter = new WebSpeechVoiceAdapter();
    const onStart = vi.fn(), onSpeechStart = vi.fn(), onFinal = vi.fn(), onInterim = vi.fn();
    adapter.startListening({ onStart, onSpeechStart, onFinal, onInterim });
    expect(onStart).not.toHaveBeenCalled();
    const rec = Recognition.instances[0]!;
    rec.onstart!(); rec.onspeechstart!();
    expect(onStart).toHaveBeenCalledOnce(); expect(onSpeechStart).toHaveBeenCalledOnce();
    const final = { isFinal: true, length: 1, 0: { transcript: "I go yesterday." } };
    rec.onresult!({ resultIndex: 0, results: [final] });
    rec.onresult!({ resultIndex: 0, results: [final] });
    expect(onFinal).toHaveBeenCalledExactlyOnceWith("I go yesterday.");
    expect(onInterim).toHaveBeenLastCalledWith("");
    adapter.stopListening();
    expect(rec.abort).toHaveBeenCalledOnce();
  });

  it("reads all interim fragments even when resultIndex points into the middle", () => {
    const adapter = new WebSpeechVoiceAdapter(); const onInterim = vi.fn();
    adapter.startListening({ onFinal: vi.fn(), onInterim });
    Recognition.instances[0]!.onresult!({ resultIndex: 1, results: [
      { isFinal: false, length: 1, 0: { transcript: "I am" } },
      { isFinal: false, length: 1, 0: { transcript: "developer" } },
    ] });
    expect(onInterim).toHaveBeenLastCalledWith("I am developer");
    adapter.stopListening();
  });

  it("makes a synchronous startup failure recoverable without navigating away", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const adapter = new WebSpeechVoiceAdapter(); const onEnd = vi.fn(); const onError = vi.fn();
    Recognition.throwOnStart = true;
    adapter.startListening({ onFinal: vi.fn(), onEnd, onError });
    expect(onError).toHaveBeenCalledOnce(); expect(onEnd).toHaveBeenCalledOnce();
    Recognition.throwOnStart = false;
    const onStart = vi.fn();
    adapter.startListening({ onFinal: vi.fn(), onStart });
    Recognition.instances[1]!.onstart!();
    expect(onStart).toHaveBeenCalledOnce();
    adapter.stopListening();
  });

  it("does not remain silently stuck when the recognizer never starts", () => {
    const adapter = new WebSpeechVoiceAdapter(); const onError = vi.fn(), onEnd = vi.fn();
    adapter.startListening({ onFinal: vi.fn(), onError, onEnd });
    vi.advanceTimersByTime(8000);
    expect(onError).toHaveBeenCalledOnce(); expect(onEnd).toHaveBeenCalledOnce();
    expect(Recognition.instances[0]!.abort).toHaveBeenCalledOnce();
  });

  it("ignores late results from a stopped recognizer and treats permission denial as fatal", () => {
    const adapter = new WebSpeechVoiceAdapter(); const onFinal = vi.fn(), onError = vi.fn(), onEnd = vi.fn();
    adapter.startListening({ onFinal, onError, onEnd });
    const rec = Recognition.instances[0]!; const late = rec.onresult!;
    rec.onerror!({ error: "not-allowed" });
    late({ resultIndex: 0, results: [{ isFinal: true, length: 1, 0: { transcript: "late" } }] });
    expect(onError).toHaveBeenCalledWith(expect.any(String), true);
    expect(onFinal).not.toHaveBeenCalled(); expect(onEnd).not.toHaveBeenCalled();
  });

  it("calls synthesis synchronously in the tap even when voices have not loaded", async () => {
    synth.getVoices.mockReturnValue([]);
    const adapter = new WebSpeechVoiceAdapter();
    const done = adapter.speak("Hello.");
    expect(synth.speak).toHaveBeenCalledOnce(); // No await/timer before native speak.
    synth.speak.mock.calls[0]![0].onend!();
    await done;
  });

  it("prefers installed enhanced English voices, but respects a saved voice selection", async () => {
    const adapter = new WebSpeechVoiceAdapter();
    const first = adapter.speak("Hello.");
    expect(synth.speak.mock.calls[0]![0].voice?.voiceURI).toBe("Samantha Enhanced");
    adapter.cancelSpeech(); await first;
    const second = adapter.speak("Again.", { voiceId: "Compact" });
    expect(synth.speak.mock.calls[1]![0].voice?.voiceURI).toBe("Compact");
    adapter.cancelSpeech(); await second;
  });

  it("reports blocked audio rather than pretending playback completed", async () => {
    const adapter = new WebSpeechVoiceAdapter();
    const check = expect(adapter.speak("Hello.")).rejects.toThrow("재생");
    synth.speak.mock.calls[0]![0].onerror!({ error: "not-allowed" });
    await check;
    expect(adapter.isSpeaking()).toBe(false);
  });

  it("detects iOS-style silent refusal with no start, end or error event", async () => {
    const adapter = new WebSpeechVoiceAdapter();
    const check = expect(adapter.speak("Hello.")).rejects.toThrow("재생");
    vi.advanceTimersByTime(8000);
    await check;
    expect(adapter.isSpeaking()).toBe(false);
    expect(synth.cancel).toHaveBeenCalled();
    expect(adapter.isSupported().duplex).toBe(false);
  });

  it("intentional cancellation resolves and removes watchdogs", async () => {
    const adapter = new WebSpeechVoiceAdapter();
    const done = adapter.speak("Hello.");
    adapter.cancelSpeech();
    await done;
    expect(vi.getTimerCount()).toBe(0);
    expect(adapter.isSpeaking()).toBe(false);
  });
});
