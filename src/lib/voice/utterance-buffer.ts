// 인식기의 final은 문장 조각의 확정이지 사용자가 말을 끝냈다는 뜻이 아니다.
export const UTTERANCE_PAUSE_MS = 3000;

export class UtteranceBuffer {
  private finals: string[] = [];
  private interim = "";
  private automatic = true;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly change: (text: string) => void, private readonly commit: (text: string) => void) {}

  text(): string { return [...this.finals, this.interim].filter(Boolean).join(" "); }
  confirmedText(): string { return this.finals.join(" "); }

  activity(): void { this.cancelTimer(); }

  preview(text: string): void {
    this.interim = text.trim();
    this.changed();
  }

  final(text: string): void {
    if (text.trim()) this.finals.push(text.trim());
    this.interim = "";
    this.changed();
  }

  setAutomatic(automatic: boolean): void {
    this.automatic = automatic;
    this.changed();
  }

  // 직접 전송할 때는 미확정 상태인 표시 내용도 사용자가 확인하고 보낼 수 있다.
  send(text = this.text()): void {
    this.clear();
    if (text.trim()) this.commit(text.trim());
  }

  clear(): void {
    this.cancelTimer();
    this.finals = [];
    this.interim = "";
    this.change("");
  }

  dispose(): void { this.cancelTimer(); }

  private cancelTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private changed(): void {
    this.cancelTimer();
    this.change(this.text());
    // 미확정 단어가 남아 있으면 조용해져도 확정 부분만 잘라 보내지 않는다.
    if (this.automatic && this.finals.length && !this.interim) {
      this.timer = setTimeout(() => this.send(), UTTERANCE_PAUSE_MS);
    }
  }
}
