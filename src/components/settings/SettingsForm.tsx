"use client";

import { useEffect, useState, type FormEvent } from "react";
import { common, settings as text } from "@/content/ko";
import { apiJson } from "@/lib/client-fetch";
import { getVoiceAdapter } from "@/lib/voice";
import type { VoiceInfo } from "@/lib/voice/types";

type Settings = { hintsDefault: boolean; ttsVoice: string | null; defaultCallMinutes: number };

export function SettingsForm({ initial, durationOptions }: { initial: Settings; durationOptions: number[] }) {
  const [form, setForm] = useState<Settings>(initial);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const adapter = getVoiceAdapter();
    const load = () => setVoices(adapter.listVoices());
    load();
    // 일부 브라우저는 음성 목록을 비동기로 채운다.
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    synth?.addEventListener?.("voiceschanged", load);
    return () => synth?.removeEventListener?.("voiceschanged", load);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError(null);
    try {
      await apiJson("/api/settings", { method: "PATCH", body: JSON.stringify(form) });
      setStatus(text.saved);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function preview() {
    const adapter = getVoiceAdapter();
    adapter.cancelSpeech();
    void adapter.speak("Hi! This is how I sound. Let's practice some English together.", { voiceId: form.ttsVoice });
  }

  return (
    <form onSubmit={onSubmit} className="card stack" aria-label={text.formLabel}>
      <h2>{text.chatTitle}</h2>
      <label className="row" style={{ gap: 6 }}>
        <input type="checkbox" checked={form.hintsDefault} onChange={(e) => setForm({ ...form, hintsDefault: e.target.checked })} />
        {text.hintsDefault}
      </label>
      <h2>{text.callTitle}</h2>
      <div className="field">
        <label htmlFor="tts-voice">{text.voice}</label>
        <div className="row">
          <select id="tts-voice" value={form.ttsVoice ?? ""} onChange={(e) => setForm({ ...form, ttsVoice: e.target.value || null })}>
            <option value="">{text.voiceDefault}</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={preview}>
            {text.voicePreview}
          </button>
        </div>
        {voices.length === 0 && <span className="muted">{text.voiceEmpty}</span>}
      </div>
      <div className="field">
        <label htmlFor="default-minutes">{text.defaultMinutes}</label>
        <select id="default-minutes" value={form.defaultCallMinutes} onChange={(e) => setForm({ ...form, defaultCallMinutes: Number(e.target.value) })}>
          {durationOptions.map((m) => (
            <option key={m} value={m}>
              {common.minutes(m)}
            </option>
          ))}
        </select>
      </div>
      {status && <p role="status">{status}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div>
        <button type="submit" className="btn btn-primary">
          {text.save}
        </button>
      </div>
    </form>
  );
}
