import { FakeVoiceAdapter } from "@/lib/voice/fake";
import type { VoiceAdapter } from "@/lib/voice/types";
import { WebSpeechVoiceAdapter } from "@/lib/voice/web-speech";

let instance: VoiceAdapter | null = null;

// 브라우저에서만 호출한다. E2E 는 window.__LEO_FAKE_VOICE 로 가짜 어댑터를 주입한다.
export function getVoiceAdapter(): VoiceAdapter {
  if (instance) return instance;
  instance =
    typeof window !== "undefined" && window.__LEO_FAKE_VOICE
      ? new FakeVoiceAdapter()
      : new WebSpeechVoiceAdapter();
  return instance;
}

export type { VoiceAdapter } from "@/lib/voice/types";
