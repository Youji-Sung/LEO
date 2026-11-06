import { HINT_MARKER } from "@/services/claude/prompts/themes";

// 스트리밍 텍스트에서 마지막 줄의 "[HINT] ..." 를 분리한다. 마커 가능성이 있는 꼬리는 확정될 때까지 보류한다.
export class HintSplitter {
  private pending = "";
  private hintBuffer: string | null = null;
  private visible = "";

  constructor(private readonly onVisible: (text: string) => void) {}

  push(delta: string): void {
    if (this.hintBuffer !== null) {
      this.hintBuffer += delta;
      return;
    }
    this.pending += delta;
    const idx = this.pending.indexOf(HINT_MARKER);
    if (idx >= 0) {
      this.emit(this.pending.slice(0, idx));
      this.hintBuffer = this.pending.slice(idx + HINT_MARKER.length);
      this.pending = "";
      return;
    }
    // 마커의 접두사로 끝나면 그만큼은 보류한다.
    const hold = longestMarkerPrefixSuffix(this.pending);
    const safe = this.pending.slice(0, this.pending.length - hold);
    this.pending = this.pending.slice(this.pending.length - hold);
    this.emit(safe);
  }

  finish(): { text: string; hint: string | null } {
    if (this.hintBuffer === null) {
      this.emit(this.pending);
      this.pending = "";
    }
    const text = this.visible.replace(/\s+$/, "");
    const hintRaw = this.hintBuffer?.trim() ?? "";
    const hint = hintRaw === "" || /^(없음|none)\.?$/i.test(hintRaw) ? null : hintRaw;
    return { text, hint };
  }

  private emit(text: string): void {
    if (!text) return;
    this.visible += text;
    this.onVisible(text);
  }
}

function longestMarkerPrefixSuffix(s: string): number {
  const max = Math.min(HINT_MARKER.length - 1, s.length);
  for (let len = max; len > 0; len--) {
    if (s.endsWith(HINT_MARKER.slice(0, len))) return len;
  }
  return 0;
}

export function splitHint(full: string): { text: string; hint: string | null } {
  const splitter = new HintSplitter(() => undefined);
  splitter.push(full);
  return splitter.finish();
}

// 지난 턴의 교정을 재사용한 모델 출력은 저장하지 않는다. 의미를 추측하거나 새 호출을 하지 않는다.
export function hintForMessage(hint: string | null, content: string): string | null {
  if (!hint) return null;
  const arrow = hint.indexOf("→");
  if (arrow <= 0) return null;
  const normalize = (text: string) => text.normalize("NFKC").replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
  const original = normalize(hint.slice(0, arrow).trim().replace(/^["“]|["”]$/g, ""));
  if (!original || !hint.slice(arrow + 1).trim()) return null;
  const message = normalize(content);
  const wordChar = /[\p{L}\p{N}']/u;
  let at = message.indexOf(original);
  while (at >= 0) {
    const before = message[at - 1];
    const after = message[at + original.length];
    if ((!before || !wordChar.test(before) || !wordChar.test(original[0]!)) &&
        (!after || !wordChar.test(after) || !wordChar.test(original.at(-1)!))) return hint;
    at = message.indexOf(original, at + 1);
  }
  return null;
}
