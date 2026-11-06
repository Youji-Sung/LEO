import { HINT_MARKER } from "@/services/claude/prompts/themes";
import { HintSplitter, hintForMessage } from "@/services/claude/hint-splitter";
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
  slowReport: "MOCK_SLOW_REPORT",
} as const;

const REPLIES = [
  "That sounds interesting! I'd love to hear more about it. What got you started with that?",
  "Nice, that makes sense. How did it go in the end, and what would you do differently next time?",
  "I see what you mean. Honestly, most people find that part tricky at first. What's your plan for the coming week?",
  "Got it. By the way, how are you finding the balance between work and everything else lately?",
];

const HINTS = [
  `I go to school yesterday → I went to school yesterday · 지난 일은 과거형 went로 써요`,
  `very much people → a lot of people · people은 셀 수 있는 명사라 much 대신 a lot of를 써요`,
  `I am agree → I agree · agree는 동사라 am을 붙이지 않아요`,
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
    summary: `${theme.label} 테마로 ${userLines.length}번 말했어요. 자기소개와 최근에 한 일을 이야기했고 상대 질문에 끊기지 않고 답했어요. 다음에는 지난 일을 과거형으로 말하는 것과 관사를 붙이는 것에 집중하면 돼요. 어휘는 기본 단어 위주라 더 자연스러운 표현으로 바꿔 보면 좋아요.`,
    scores: {
      grammar: {
        score: 6,
        comment: "지난 일을 과거형으로, 셀 수 있는 명사에는 관사를 붙여 보세요.",
      },
      vocabulary: {
        score: 5,
        comment: "기본 단어 위주예요. 아래 제안 표현을 다음 대화에서 써 보세요.",
      },
      fluency: { score: 7, comment: "답이 짧은 편이지만 머뭇거리는 말은 적어요." },
      task: { score: 6, comment: "질문에 답했어요. 구체적인 사례를 하나씩 붙이면 더 좋아요." },
    },
    grammarCorrections: [
      {
        original: first,
        corrected: "I went to school yesterday.",
        explanation: "지난 일은 과거형(went)으로 써요.",
      },
      {
        original: second,
        corrected: "There were a lot of people.",
        explanation: "people은 복수라 were와 a lot of를 써요.",
      },
      {
        original: third,
        corrected: "I agree with you.",
        explanation: "agree는 동사라 am을 붙이지 않아요.",
      },
    ],
    vocabularySuggestions: [
      {
        original: "very good",
        better: "excellent",
        meaning: "아주 좋은",
        example: "The onboarding docs were excellent.",
      },
      {
        original: "make a decision fast",
        better: "make a quick call",
        meaning: "빠르게 결정하다",
        example: "We had to make a quick call on the database.",
      },
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
          structureFeedback:
            "답변이 상황 설명에서 끝나 결과가 빠졌어요. 상황, 과제, 행동, 결과 순서로 30초 안에 정리해 보세요.",
          followUpQuestions: [
            "What was the most difficult technical decision in that project?",
            "How did you measure whether the change was successful?",
            "If you had another month, what would you improve?",
          ],
        }
      : null,
    technicalClarity:
      input.theme === "portfolio"
        ? { score: 6, comment: "아키텍처를 고른 이유를 한 문장으로 덧붙이면 더 분명해져요." }
        : null,
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
    const usage = {
      inputTokens: 120 + userCount * 20,
      outputTokens: 45,
      cacheReadTokens: userCount > 1 ? 400 : 0,
      cacheWriteTokens: userCount > 1 ? 0 : 400,
    };
    if (lastUser.includes(MOCK_TRIGGERS.refusal)) {
      return {
        text: "",
        hint: null,
        stopReason: "refusal",
        refusalCategory: "general_harms",
        usage,
        model: MOCK_MODEL,
        latencyMs: Date.now() - started,
      };
    }
    const reply = REPLIES[(userCount - 1) % REPLIES.length] ?? REPLIES[0]!;
    const hintText = HINTS.find((hint) => hintForMessage(hint, lastUser)) ?? "없음";
    const full = input.hints
      ? `${reply}\n${HINT_MARKER} ${hintText}`
      : reply;
    const splitter = new HintSplitter(onDelta);
    // 실제 스트리밍처럼 몇 글자씩 나눠 보낸다.
    for (let i = 0; i < full.length; i += 7) {
      splitter.push(full.slice(i, i + 7));
      if (this.chunkDelayMs > 0) await sleep(this.chunkDelayMs);
    }
    const { text, hint } = splitter.finish();
    return {
      text,
      hint,
      stopReason: "end_turn",
      refusalCategory: null,
      usage,
      model: MOCK_MODEL,
      latencyMs: Date.now() - started,
    };
  }

  async generateReport(input: ReportInput): Promise<ReportResult> {
    const started = Date.now();
    // 트리거는 마지막 사용자 발화만 본다(재시도 시나리오: 정상 발화를 하나 더 보내면 성공).
    const joined = [...input.transcript].reverse().find((m) => m.role === "user")?.content ?? "";
    if (joined.includes(MOCK_TRIGGERS.slowReport)) await sleep(8000);
    const usage = {
      inputTokens: 900 + input.transcript.length * 30,
      outputTokens: 1200,
      cacheReadTokens: 600,
      cacheWriteTokens: 0,
    };
    if (joined.includes(MOCK_TRIGGERS.error)) throw new Error("모의 API 오류");
    if (joined.includes(MOCK_TRIGGERS.refusal)) {
      return {
        report: null,
        rawText: "",
        parseError: "모델이 요청을 거부했습니다.",
        stopReason: "refusal",
        refusalCategory: "general_harms",
        usage,
        model: MOCK_MODEL,
        latencyMs: Date.now() - started,
      };
    }
    const rawText = joined.includes(MOCK_TRIGGERS.invalidReport)
      ? JSON.stringify({ summary: "스키마가 깨진 리포트", scores: { grammar: { score: "high" } } })
      : JSON.stringify(buildMockReport(input));
    if (this.chunkDelayMs > 0) await sleep(this.chunkDelayMs * 4);
    const parsed = parseReportJson(rawText);
    return {
      report: parsed.report,
      rawText,
      parseError: parsed.error,
      stopReason: "end_turn",
      refusalCategory: null,
      usage,
      model: MOCK_MODEL,
      latencyMs: Date.now() - started,
    };
  }
}
