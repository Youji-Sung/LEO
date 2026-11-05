"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { common, settings as text } from "@/content/ko";
import { apiJson } from "@/lib/client-fetch";
import { getVoiceAdapter } from "@/lib/voice";
import type { VoiceInfo } from "@/lib/voice/types";
import { applyThemeToDocument, type ThemeMode } from "@/lib/theme";
import {
  Button,
  Card,
  CheckRow,
  DirectionSelect,
  Select,
  StatusMessage,
  ThemeSelect,
  useToast,
  type DirectionChoice,
} from "@/components/ui";

type Settings = {
  hintsDefault: boolean;
  ttsVoice: string | null;
  defaultCallMinutes: number;
  theme: ThemeMode;
};

export function SettingsForm({
  initial,
  durationOptions,
  direction,
}: {
  initial: Settings;
  durationOptions: number[];
  direction: DirectionChoice;
}) {
  const [form, setForm] = useState<Settings>(initial);
  // null = 아직 안 불러옴(힌트 숨김), [] = 불러왔는데 없음
  const [voices, setVoices] = useState<VoiceInfo[] | null>(null);
  // 저장된 테마. 저장하지 않고 떠나거나 저장이 실패하면 이 값으로 되돌린다.
  const savedThemeRef = useRef<ThemeMode>(initial.theme);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const adapter = getVoiceAdapter();
    const load = () => setVoices(adapter.listVoices());
    load();
    // 일부 브라우저는 음성 목록을 비동기로 채운다.
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    synth?.addEventListener?.("voiceschanged", load);
    return () => synth?.removeEventListener?.("voiceschanged", load);
  }, []);

  useEffect(() => {
    return () => applyThemeToDocument(savedThemeRef.current);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiJson("/api/settings", { method: "PATCH", body: JSON.stringify(form) });
      savedThemeRef.current = form.theme;
      toast.show(text.saved, "success");
    } catch (err) {
      applyThemeToDocument(savedThemeRef.current);
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function preview() {
    const adapter = getVoiceAdapter();
    adapter.cancelSpeech();
    void adapter.speak("Hi! This is how I sound. Let's practice some English together.", {
      voiceId: form.ttsVoice,
    });
  }

  return (
    <form onSubmit={onSubmit} className="stack-lg" aria-label={text.formLabel}>
      <Card as="section" title={text.appearanceTitle} titleId="settings-appearance" className="stack">
        <ThemeSelect value={form.theme} onChange={(theme) => setForm((f) => ({ ...f, theme }))} />
        <DirectionSelect value={direction} />
      </Card>

      <Card as="section" title={text.chatTitle} titleId="settings-chat">
        <CheckRow
          label={text.hintsDefault}
          hint={text.hintsDefaultHint}
          checked={form.hintsDefault}
          onChange={(e) => setForm({ ...form, hintsDefault: e.target.checked })}
        />
      </Card>

      <Card as="section" title={text.callTitle} titleId="settings-call" className="stack">
        <div className="row" style={{ alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 14rem" }}>
            <Select
              id="tts-voice"
              label={text.voice}
              value={form.ttsVoice ?? ""}
              onChange={(e) => setForm({ ...form, ttsVoice: e.target.value || null })}
              hint={voices !== null && voices.length === 0 ? text.voiceEmpty : undefined}
            >
              <option value="">{text.voiceDefault}</option>
              {(voices ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </Select>
          </div>
          <Button variant="secondary" icon={<Volume2 size={18} />} onClick={preview}>
            {text.voicePreview}
          </Button>
        </div>
        <Select
          id="default-minutes"
          label={text.defaultMinutes}
          value={form.defaultCallMinutes}
          onChange={(e) => setForm({ ...form, defaultCallMinutes: Number(e.target.value) })}
        >
          {durationOptions.map((m) => (
            <option key={m} value={m}>
              {common.minutes(m)}
            </option>
          ))}
        </Select>
      </Card>

      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      <div>
        <Button type="submit" variant="primary" loading={busy} loadingLabel={text.saving}>
          {text.save}
        </Button>
      </div>
    </form>
  );
}
