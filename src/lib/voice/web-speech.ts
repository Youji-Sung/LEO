import type {
  ListenHandlers,
  SpeakOptions,
  VoiceAdapter,
  VoiceInfo,
  VoiceSupport,
} from "@/lib/voice/types";
import { errors } from "@/content/ko";

// DOM lib 에 SpeechRecognition 생성자 타입이 없어 필요한 부분만 정의한다.
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike | undefined;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike | undefined };
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

function getSynthesis(): SpeechSynthesis | undefined {
  if (typeof window === "undefined") return undefined;
  return window.speechSynthesis ?? undefined;
}

function errorMessage(error: string): { message: string; fatal: boolean } | null {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return { message: errors.voice.permissionDenied, fatal: true };
    case "no-speech":
      return null;
    case "network":
      return { message: errors.voice.network, fatal: false };
    case "audio-capture":
      return { message: errors.voice.noMic, fatal: true };
    default:
      console.warn("[voice] recognition error", error);
      return { message: errors.voice.generic, fatal: false };
  }
}

function isEnglish(lang: string): boolean {
  return lang === "en-US" || lang.startsWith("en-") || lang.startsWith("en_");
}

export class WebSpeechVoiceAdapter implements VoiceAdapter {
  readonly name = "web-speech";
  private recognition: SpeechRecognitionLike | null = null;
  private handlers: ListenHandlers | null = null;
  private speaking = 0;
  // Chrome 은 참조가 끊긴 utterance 를 GC 해서 end 가 안 오므로 끝날 때까지 붙잡는다.
  private pendingUtterances = new Map<SpeechSynthesisUtterance, () => void>();

  isSupported(): VoiceSupport {
    if (typeof window === "undefined") return { stt: false, tts: false };
    return { stt: getRecognitionCtor() !== undefined, tts: getSynthesis() !== undefined };
  }

  startListening(handlers: ListenHandlers): void {
    if (this.recognition) this.stopListening();
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      handlers.onError?.(errors.voice.unsupported);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    this.recognition = recognition;
    this.handlers = handlers;

    recognition.onresult = (event) => {
      if (this.recognition !== recognition) return;
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          const text = transcript.trim();
          if (text) this.handlers?.onFinal(text);
        } else {
          interim += transcript;
        }
      }
      const interimText = interim.trim();
      if (interimText) this.handlers?.onInterim?.(interimText);
    };
    recognition.onerror = (event) => {
      if (this.recognition !== recognition) return;
      const mapped = errorMessage(event.error);
      if (mapped) this.handlers?.onError?.(mapped.message, mapped.fatal);
    };
    recognition.onend = () => {
      if (this.recognition !== recognition) return;
      const current = this.handlers;
      this.recognition = null;
      this.handlers = null;
      current?.onEnd?.();
    };

    try {
      recognition.start();
    } catch (e) {
      this.recognition = null;
      this.handlers = null;
      console.warn("[voice] recognition.start failed", e);
      handlers.onError?.(errors.voice.generic);
    }
  }

  stopListening(): void {
    const recognition = this.recognition;
    this.recognition = null;
    this.handlers = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.stop();
    } catch {
      // 이미 멈춘 경우는 무시한다.
    }
  }

  // Chrome 은 voiceschanged 전에 getVoices() 가 빈 배열이라 첫 발화가 기본 음성으로 나간다. 잠깐 기다린다.
  private voicesReady(synth: SpeechSynthesis): Promise<void> {
    if (synth.getVoices().length > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = () => {
        synth.removeEventListener?.("voiceschanged", done);
        resolve();
      };
      synth.addEventListener?.("voiceschanged", done);
      setTimeout(done, 500);
    });
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    const synth = getSynthesis();
    if (!synth) return;
    await this.voicesReady(synth);
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = options.rate ?? 1;
      const voice = this.pickVoice(synth, options.voiceId);
      if (voice) utterance.voice = voice;

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.pendingUtterances.delete(utterance);
        this.speaking = Math.max(0, this.speaking - 1);
        resolve();
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      this.pendingUtterances.set(utterance, finish);
      this.speaking += 1;
      if (synth.paused) synth.resume();
      synth.speak(utterance);
    });
  }

  cancelSpeech(): void {
    const synth = getSynthesis();
    this.speaking = 0;
    if (!synth) return;
    synth.cancel();
    // cancel 뒤 error/end 이벤트가 오지 않는 브라우저가 있어 직접 resolve 한다.
    for (const finish of [...this.pendingUtterances.values()]) finish();
    this.pendingUtterances.clear();
  }

  isSpeaking(): boolean {
    return this.speaking > 0;
  }

  listVoices(): VoiceInfo[] {
    const synth = getSynthesis();
    if (!synth) return [];
    const voices = synth.getVoices().map((v) => ({ id: v.voiceURI, name: v.name, lang: v.lang }));
    return [
      ...voices.filter((v) => isEnglish(v.lang)),
      ...voices.filter((v) => !isEnglish(v.lang)),
    ];
  }

  private pickVoice(
    synth: SpeechSynthesis,
    voiceId: string | null | undefined,
  ): SpeechSynthesisVoice | undefined {
    const voices = synth.getVoices();
    if (voiceId) {
      const match = voices.find((v) => v.voiceURI === voiceId || v.name === voiceId);
      if (match) return match;
    }
    return voices.find((v) => v.lang === "en-US") ?? voices.find((v) => isEnglish(v.lang));
  }
}
