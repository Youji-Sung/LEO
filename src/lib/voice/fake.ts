import type {
  FakeVoiceControls,
  ListenHandlers,
  SpeakOptions,
  VoiceAdapter,
  VoiceInfo,
  VoiceSupport,
} from "@/lib/voice/types";

const SPEAK_DURATION_MS = 30;

export class FakeVoiceAdapter implements VoiceAdapter {
  readonly name = "fake";
  private support: VoiceSupport = { stt: true, tts: true };
  private handlers: ListenHandlers | null = null;
  private spokenTexts: string[] = [];
  private pending = new Set<{ timer: ReturnType<typeof setTimeout>; finish: () => void }>();

  constructor() {
    if (typeof window !== "undefined") {
      if (window.__LEO_FAKE_VOICE_SUPPORT) this.support = { ...window.__LEO_FAKE_VOICE_SUPPORT };
      window.__leoFakeVoice = this.controls();
    }
  }

  controls(): FakeVoiceControls {
    return {
      say: (text) => this.say(text),
      spoken: () => this.spoken(),
      listening: () => this.listening(),
      setSupport: (support) => this.setSupport(support),
    };
  }

  say(text: string): void {
    const handlers = this.handlers;
    if (!handlers) {
      console.warn("[fake-voice] say() 호출됐지만 듣는 중이 아닙니다:", text);
      return;
    }
    handlers.onInterim?.(text);
    handlers.onFinal(text);
  }

  spoken(): string[] {
    return [...this.spokenTexts];
  }

  listening(): boolean {
    return this.handlers !== null;
  }

  setSupport(support: VoiceSupport): void {
    this.support = { ...support };
  }

  isSupported(): VoiceSupport {
    return { ...this.support };
  }

  startListening(handlers: ListenHandlers): void {
    this.handlers = handlers;
  }

  stopListening(): void {
    this.handlers = null;
  }

  speak(text: string, _options?: SpeakOptions): Promise<void> {
    this.spokenTexts.push(text);
    return new Promise<void>((resolve) => {
      const entry = {
        timer: setTimeout(() => entry.finish(), SPEAK_DURATION_MS),
        finish: () => {
          if (!this.pending.has(entry)) return;
          clearTimeout(entry.timer);
          this.pending.delete(entry);
          resolve();
        },
      };
      this.pending.add(entry);
    });
  }

  cancelSpeech(): void {
    for (const entry of [...this.pending]) entry.finish();
  }

  isSpeaking(): boolean {
    return this.pending.size > 0;
  }

  listVoices(): VoiceInfo[] {
    return [{ id: "fake-en", name: "Fake English", lang: "en-US" }];
  }
}
