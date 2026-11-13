// 음성 입출력 추상화. Web Speech 구현과 테스트용 가짜 구현이 있고, 외부 제공자로 교체할 수 있다.
export type VoiceSupport = { stt: boolean; tts: boolean; duplex?: boolean };

export type VoiceInfo = { id: string; name: string; lang: string };

export type ListenHandlers = {
  onStart?: () => void;
  onSpeechStart?: () => void;
  onInterim?: (text: string) => void;
  onFinal: (text: string, alternatives?: string[]) => void;
  phrases?: string[];
  // fatal 이면 다시 시작해도 소용없는 오류(권한 거부, 마이크 없음)
  onError?: (message: string, fatal?: boolean) => void;
  // 브라우저가 인식을 스스로 멈췄을 때(무음 등). 호출자가 다시 startListening 할 수 있다.
  onEnd?: () => void;
};

export type SpeakOptions = { voiceId?: string | null; rate?: number };

export interface VoiceAdapter {
  readonly name: string;
  isSupported(): VoiceSupport;
  // 새 문서를 연 뒤 사용자의 탭에서 오디오 재생 권한을 활성화한다.
  activateAudio?(): void;
  startListening(handlers: ListenHandlers): void;
  stopListening(): void;
  // 끝나거나 의도적으로 취소하면 resolve. 실제 재생 오류는 reject 한다.
  speak(text: string, options?: SpeakOptions): Promise<void>;
  cancelSpeech(): void;
  isSpeaking(): boolean;
  listVoices(): VoiceInfo[];
}

declare global {
  interface Window {
    // E2E 가 addInitScript 로 true 를 넣으면 가짜 어댑터를 쓴다.
    __LEO_FAKE_VOICE?: boolean;
    // 가짜 어댑터의 초기 지원 여부 (미지원 브라우저 E2E 용)
    __LEO_FAKE_VOICE_SUPPORT?: VoiceSupport;
    __leoFakeVoice?: FakeVoiceControls;
  }
}

// 가짜 어댑터를 바깥(E2E)에서 조종하는 손잡이
export type FakeVoiceControls = {
  // 사용자가 이렇게 말했다고 가정 (interim 한 번 → final 한 번)
  say(text: string): void;
  // 지금까지 TTS 로 읽은 문장들
  spoken(): string[];
  listening(): boolean;
  // 지원 여부를 바꿔 미지원 브라우저를 흉내 낸다 (다음 isSupported 호출부터 반영)
  setSupport(support: VoiceSupport): void;
  // 인식 오류가 났다고 가정 (권한 거부·마이크 없음은 fatal)
  fail(message: string, fatal?: boolean): void;
  interim(text: string): void;
  end(): void;
  failPlayback(): void;
};
