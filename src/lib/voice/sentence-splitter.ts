// 스트리밍 텍스트를 문장 단위로 잘라 TTS 에 바로 넘기기 위한 분리기.
const ABBREVIATIONS = new Set([
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "sr",
  "jr",
  "st",
  "vs",
  "etc",
  "e.g",
  "i.e",
  "eg",
  "ie",
  "inc",
  "ltd",
]);

const TERMINATOR = /[.!?]+["'”’)\]]*/y;

export class SentenceSplitter {
  private buffer = "";

  constructor(private readonly onSentence: (sentence: string) => void) {}

  push(delta: string): void {
    this.buffer += delta;
    this.drain();
  }

  flush(): void {
    this.emit(this.buffer);
    this.buffer = "";
  }

  private drain(): void {
    let start = 0;
    const text = this.buffer;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === "\n") {
        this.emit(text.slice(start, i));
        start = i + 1;
        continue;
      }
      if (ch !== "." && ch !== "!" && ch !== "?") continue;
      TERMINATOR.lastIndex = i;
      const match = TERMINATOR.exec(text);
      if (!match) continue;
      const end = i + match[0].length;
      // 버퍼 끝에서는 다음 글자(소수점, 닫는 따옴표 등)를 알 수 없으므로 기다린다.
      if (end >= text.length) break;
      if (!/\s/.test(text[end] ?? "")) {
        i = end - 1;
        continue;
      }
      if (ch === "." && match[0].length === 1 && this.isAbbreviation(text, start, i)) continue;
      this.emit(text.slice(start, end));
      start = end;
      i = end - 1;
    }
    this.buffer = text.slice(start);
  }

  private isAbbreviation(text: string, start: number, dot: number): boolean {
    const before = text.slice(start, dot);
    const word = /(\S+)$/.exec(before)?.[1] ?? "";
    if (!word) return false;
    return ABBREVIATIONS.has(word.toLowerCase().replace(/^["'“‘(\[]+/, ""));
  }

  private emit(raw: string): void {
    const sentence = raw.trim();
    if (sentence) this.onSentence(sentence);
  }
}
