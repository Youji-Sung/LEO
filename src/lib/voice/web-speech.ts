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
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort?(): void;
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
  return /^en(?:[-_]|$)/i.test(lang);
}

export class WebSpeechVoiceAdapter implements VoiceAdapter {
  readonly name = "web-speech";
  private recognition: SpeechRecognitionLike | null = null;
  private handlers: ListenHandlers | null = null;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private speaking = 0;
  // Chrome 은 참조가 끊긴 utterance 를 GC 해서 end 가 안 오므로 끝날 때까지 붙잡는다.
  private pendingUtterances = new Map<SpeechSynthesisUtterance, () => void>();

  isSupported(): VoiceSupport {
    if (typeof window === "undefined") return { stt: false, tts: false };
    const nav = window.navigator;
    const ios = /iPhone|iPad|iPod/.test(nav?.userAgent ?? "") || (nav?.platform === "MacIntel" && nav.maxTouchPoints > 1);
    return { stt: getRecognitionCtor() !== undefined, tts: getSynthesis() !== undefined, duplex: !ios };
  }

  activateAudio(): void {
    const synth = getSynthesis();
    if (!synth) return;
    // 재개한 통화는 첫 인사를 반복하지 않는다. 탭 안의 무음 요청으로 iOS 재생 제한만 해제한다.
    const silent = new SpeechSynthesisUtterance("");
    silent.volume = 0;
    synth.speak(silent);
    synth.cancel();
  }

  startListening(handlers: ListenHandlers): void {
    if (this.recognition) this.stopListening();
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      handlers.onError?.(errors.voice.unsupported, true);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    this.recognition = recognition;
    this.handlers = handlers;
    const delivered = new Set<number>();
    recognition.onstart = () => {
      if (this.recognition !== recognition) return;
      this.clearStartTimer();
      handlers.onStart?.();
    };
    recognition.onspeechstart = () => {
      if (this.recognition === recognition) handlers.onSpeechStart?.();
    };

    recognition.onresult = (event) => {
      if (this.recognition !== recognition) return;
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          if (delivered.has(i)) continue;
          delivered.add(i);
          const text = transcript.trim();
          if (text) this.handlers?.onFinal(text);
        } else {
          interim += ` ${transcript}`;
        }
      }
      const interimText = interim.trim();
      this.handlers?.onInterim?.(interimText);
    };
    recognition.onerror = (event) => {
      if (this.recognition !== recognition) return;
      const mapped = errorMessage(event.error);
      if (mapped) {
        this.stopListening();
        handlers.onError?.(mapped.message, mapped.fatal);
        if (!mapped.fatal) handlers.onEnd?.();
      }
    };
    recognition.onend = () => {
      if (this.recognition !== recognition) return;
      const current = this.handlers;
      this.clearStartTimer();
      this.recognition = null;
      this.handlers = null;
      current?.onEnd?.();
    };

    try {
      this.startTimer = setTimeout(() => {
        if (this.recognition !== recognition) return;
        this.stopListening();
        handlers.onError?.(errors.voice.startTimeout);
        handlers.onEnd?.();
      }, 8000);
      recognition.start();
    } catch (e) {
      this.stopListening();
      console.warn("[voice] recognition.start failed", e);
      handlers.onError?.(errors.voice.generic);
      handlers.onEnd?.();
    }
  }

  stopListening(): void {
    this.clearStartTimer();
    const recognition = this.recognition;
    this.recognition = null;
    this.handlers = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onstart = null;
    recognition.onspeechstart = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      if (recognition.abort) recognition.abort();
      else recognition.stop();
    } catch {
      // 이미 멈춘 경우는 무시한다.
    }
  }

  private clearStartTimer(): void {
    if (this.startTimer) clearTimeout(this.startTimer);
    this.startTimer = null;
  }

  speak(text: string, options: SpeakOptions = {}): Promise<void> {
    const synth = getSynthesis();
    if (!synth) return Promise.reject(new Error(errors.voice.playback));
    // iOS는 사용자 탭 안에서 speak를 호출해야 한다. 음성 목록 로드를 await하지 않는다.
    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = options.rate ?? 1;
      const voice = this.pickVoice(synth, options.voiceId);
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }

      let settled = false;
      let timer: ReturnType<typeof setTimeout>;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
        this.pendingUtterances.delete(utterance);
        this.speaking = Math.max(0, this.speaking - 1);
        if (error) reject(error);
        else resolve();
      };
      const timedOut = () => { finish(new Error(errors.voice.playback)); synth.cancel(); };
      utterance.onstart = () => {
        clearTimeout(timer);
        timer = setTimeout(timedOut, Math.max(60_000, text.length * 150));
      };
      utterance.onend = () => finish();
      utterance.onerror = (event) => finish(
        event.error === "canceled" || event.error === "interrupted" ? undefined : new Error(errors.voice.playback),
      );

      this.pendingUtterances.set(utterance, finish);
      this.speaking += 1;
      timer = setTimeout(timedOut, 8000);
      try {
        if (synth.paused) synth.resume();
        synth.speak(utterance);
      } catch { finish(new Error(errors.voice.playback)); }
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
    const english = voices.filter((v) => isEnglish(v.lang));
    // 설치된 고품질 음성이 브라우저에 공개된 경우 우선한다. 저장된 선택은 위에서 그대로 존중한다.
    const natural = english.find((v) => /premium|enhanced|natural|neural|siri/i.test(`${v.name} ${v.voiceURI}`));
    return natural ?? english.find((v) => v.lang === "en-US" && v.default) ?? english.find((v) => v.lang === "en-US") ?? english[0];
  }
}
