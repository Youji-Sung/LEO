import { HINT_MARKER } from "@/services/claude/prompts/themes";
import { HintSplitter } from "@/services/claude/hint-splitter";
import { parseReportJson, type Report } from "@/services/claude/schemas/report";
import { THEMES } from "@/services/claude/prompts/themes";
import type {
  ChatTurnInput,
  ChatTurnResult,
  ClaudeProvider,
  ReportInput,
  ReportResult,
} from "@/services/claude/types";

export const MOCK_MODEL = "mock-claude";

// 테스트용 트리거 문구. 사용자 메시지에 포함되면 해당 상황을 흉내 낸다.
export const MOCK_TRIGGERS = {
  refusal: "MOCK_REFUSAL",
  invalidReport: "MOCK_INVALID_REPORT",
  error: "MOCK_ERROR",
} as const;

const REPLIES = [
  "That sounds interesting! I'd love to hear more about it. What got you started with that?",
  "Nice, that makes sense. How did it go in the end, and what would you do differently next time?",
  "I see what you mean. Honestly, most people find that part tricky at first. What's your plan for the coming week?",
  "Got it. By the way, how are you finding the balance between work and everything else lately?",
];

const HINTS = [
  `"I go to school yesterday" → "I went to school yesterday" (과거 시제는 went)`,
  `"very much people" → "a lot of people" (people 은 가산명사라 much 대신 many/a lot of)`,
  `"I am agree" → "I agree" (agree 는 동사라 be 동사 불필요)`,
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function buildMockReport(input: ReportInput): Report {
  const theme = THEMES[input.theme];
  const userLines = input.transcript.filter((m) => m.role === "user").map((m) => m.content);
  const first = userLines[0] ?? "I go to school yesterday.";
  const second = userLines[1] ?? "There was very much people.";
  const third = userLines[2] ?? "I am agree with you.";
  return {
    summary: `${theme.label} 테마로 ${userLines.length}번 발화했습니다. 주로 자기소개와 최근 작업에 대해 이야기했고, 상대의 질문에 짧게 답했습니다. 전반적으로 의사소통은 가능했지만 과거 시제와 관사 사용에서 반복되는 실수가 있었습니다. 어휘는 기본적인 수준이며 더 자연스러운 표현으로 바꿀 여지가 있습니다.`,
    scores: {
      grammar: { score: 6, comment: "시제 일치와 관사 오류가 반복됩니다." },
      vocabulary: { score: 5, comment: "기본 어휘 위주라 표현이 단조롭습니다." },
      fluency: { score: 7, comment: "응답이 짧지만 주저 표현은 적습니다." },
      task: { score: 6, comment: "질문에는 답했으나 구체적인 사례가 부족합니다." },
    },
    grammarCorrections: [
      { original: first, corrected: "I went to school yesterday.", explanation: "과거의 일이므로 동사를 과거형(went)으로 씁니다." },
      { original: second, corrected: "There were a lot of people.", explanation: "people 은 복수 가산명사라 were 와 a lot of/many 를 씁니다." },
      { original: third, corrected: "I agree with you.", explanation: "agree 는 동사이므로 be 동사(am)를 붙이지 않습니다." },
    ],
    vocabularySuggestions: [
      { original: "very good", better: "excellent", meaning: "아주 좋은", example: "The onboarding docs were excellent." },
      { original: "make a decision fast", better: "make a quick call", meaning: "빠르게 결정하다", example: "We had to make a quick call on the database." },
    ],
    betterExpressions: [
      { original: first, native: "I went to school yesterday and it was a long day." },
      { original: second, native: "The place was packed." },
      { original: third, native: "I'm with you on that." },
    ],
    nextTasks: [
      "어제 한 일을 과거 시제로 5문장 말해 보기",
      "자기소개를 STAR 구조로 1분 안에 말하는 연습",
      "오늘 배운 표현 3개를 다음 대화에서 한 번씩 쓰기",
    ],
    interview: theme.isInterview
      ? {
          structureFeedback: "답변이 상황 설명에 머물러 결과(R)가 빠졌습니다. 상황→과제→행동→결과 순서로 30초 안에 정리해 보세요.",
          followUpQuestions: [
            "What was the most difficult technical decision in that project?",
            "How did you measure whether the change was successful?",
            "If you had another month, what would you improve?",
          ],
        }
      : null,
    technicalClarity: input.theme === "portfolio" ? { score: 6, comment: "아키텍처 선택의 이유를 더 명확히 설명하면 좋습니다." } : null,
  };
}

export class MockClaudeProvider implements ClaudeProvider {
  readonly name = "mock";
  constructor(private readonly chunkDelayMs = 5) {}

  async chatTurn(input: ChatTurnInput, onDelta: (text: string) => void): Promise<ChatTurnResult> {
    const started = Date.now();
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (lastUser.includes(MOCK_TRIGGERS.error)) throw new Error("모의 API 오류");
    const userCount = input.messages.filter((m) => m.role === "user").length;
    const usage = { inputTokens: 120 + userCount * 20, outputTokens: 45, cacheReadTokens: userCount > 1 ? 400 : 0, cacheWriteTokens: userCount > 1 ? 0 : 400 };
    if (lastUser.includes(MOCK_TRIGGERS.refusal)) {
      return { text: "", hint: null, stopReason: "refusal", refusalCategory: "general_harms", usage, model: MOCK_MODEL, latencyMs: Date.now() - started };
    }
    const reply = REPLIES[(userCount - 1) % REPLIES.length] ?? REPLIES[0]!;
    const full = input.hints ? `${reply}\n${HINT_MARKER} ${HINTS[(userCount - 1) % HINTS.length]}` : reply;
    const splitter = new HintSplitter(onDelta);
    // 실제 스트리밍처럼 몇 글자씩 나눠 보낸다.
    for (let i = 0; i < full.length; i += 7) {
      splitter.push(full.slice(i, i + 7));
      if (this.chunkDelayMs > 0) await sleep(this.chunkDelayMs);
    }
    const { text, hint } = splitter.finish();
    return { text, hint, stopReason: "end_turn", refusalCategory: null, usage, model: MOCK_MODEL, latencyMs: Date.now() - started };
  }

  async generateReport(input: ReportInput): Promise<ReportResult> {
    const started = Date.now();
    // 트리거는 마지막 사용자 발화만 본다(재시도 시나리오: 정상 발화를 하나 더 보내면 성공).
    const joined = [...input.transcript].reverse().find((m) => m.role === "user")?.content ?? "";
    const usage = { inputTokens: 900 + input.transcript.length * 30, outputTokens: 1200, cacheReadTokens: 600, cacheWriteTokens: 0 };
    if (joined.includes(MOCK_TRIGGERS.error)) throw new Error("모의 API 오류");
    if (joined.includes(MOCK_TRIGGERS.refusal)) {
      return { report: null, rawText: "", parseError: "모델이 요청을 거부했습니다.", stopReason: "refusal", refusalCategory: "general_harms", usage, model: MOCK_MODEL, latencyMs: Date.now() - started };
    }
    const rawText = joined.includes(MOCK_TRIGGERS.invalidReport)
      ? JSON.stringify({ summary: "스키마가 깨진 리포트", scores: { grammar: { score: "high" } } })
      : JSON.stringify(buildMockReport(input));
    if (this.chunkDelayMs > 0) await sleep(this.chunkDelayMs * 4);
    const parsed = parseReportJson(rawText);
    return { report: parsed.report, rawText, parseError: parsed.error, stopReason: "end_turn", refusalCategory: null, usage, model: MOCK_MODEL, latencyMs: Date.now() - started };
  }
}
