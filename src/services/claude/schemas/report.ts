import { z } from "zod";

// API 구조화 출력용 스키마. 숫자 범위·배열 길이 제한은 프롬프트와 normalizeReport 로 보장한다(스키마 키워드 호환 문제 회피).
const scoreSchema = z.object({
  score: z.number().describe("1에서 10 사이의 정수"),
  comment: z.string().describe("한 줄 코멘트 (한국어)"),
});

export const reportSchema = z.object({
  summary: z.string().describe("무엇에 대해 이야기했는지 3~5문장 (한국어)"),
  scores: z.object({
    grammar: scoreSchema,
    vocabulary: scoreSchema,
    fluency: scoreSchema.describe("응답 길이와 주저 표현 기준"),
    task: scoreSchema.describe("테마 목표 달성도"),
  }),
  grammarCorrections: z
    .array(
      z.object({
        original: z.string().describe("사용자 발화 원문 (영어)"),
        corrected: z.string().describe("교정문 (영어)"),
        explanation: z.string().describe("왜 틀렸는지 (한국어)"),
      }),
    )
    .describe("중요도 순, 최대 10개"),
  vocabularySuggestions: z
    .array(
      z.object({
        original: z.string().describe("사용자가 쓴 단순한 표현 (영어)"),
        better: z.string().describe("더 자연스러운 표현 (영어)"),
        meaning: z.string().describe("의미 (한국어)"),
        example: z.string().describe("예문 (영어)"),
      }),
    )
    .describe("최대 10개"),
  betterExpressions: z
    .array(
      z.object({
        original: z.string().describe("사용자 발화 (영어)"),
        native: z.string().describe("원어민이라면 이렇게 (영어)"),
      }),
    )
    .describe("정확히 3개"),
  nextTasks: z.array(z.string().describe("구체적인 행동 지침 (한국어)")).describe("정확히 3개"),
  interview: z
    .object({
      structureFeedback: z.string().describe("답변 구조(STAR 등) 피드백 (한국어)"),
      followUpQuestions: z.array(z.string().describe("예상 추가 질문 (영어)")).describe("정확히 3개"),
    })
    .nullable()
    .describe("면접류 테마가 아니면 null"),
  technicalClarity: scoreSchema.nullable().describe("포트폴리오 면접 테마에서만, 기술 설명의 명확성. 아니면 null"),
});

export type Report = z.infer<typeof reportSchema>;

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(10, Math.max(1, Math.round(n)));
}

// 비교용 정규화: 대소문자·공백·구두점 차이는 같은 문장으로 본다.
export function canonical(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 사소한 교정(원문과 구두점·대소문자만 다름)과 같은 원문의 중복 항목을 뺀다(외부 피드백 6).
// 프롬프트에 같은 규칙이 있지만 모델 출력은 보장되지 않으므로 저장 전에 한 번 더 거른다.
export function dedupeCorrections<T extends { original: string }>(
  items: T[],
  replacement: (item: T) => string,
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = canonical(item.original);
    if (!key || key === canonical(replacement(item)) || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// 점수 범위와 항목 수를 SPEC 2.3 에 맞춘다.
export function normalizeReport(report: Report): Report {
  const fix = (s: { score: number; comment: string }) => ({ ...s, score: clampScore(s.score) });
  return {
    ...report,
    scores: {
      grammar: fix(report.scores.grammar),
      vocabulary: fix(report.scores.vocabulary),
      fluency: fix(report.scores.fluency),
      task: fix(report.scores.task),
    },
    grammarCorrections: dedupeCorrections(report.grammarCorrections, (c) => c.corrected).slice(0, 10),
    vocabularySuggestions: dedupeCorrections(report.vocabularySuggestions, (v) => v.better).slice(0, 10),
    betterExpressions: dedupeCorrections(report.betterExpressions, (b) => b.native).slice(0, 3),
    nextTasks: report.nextTasks.slice(0, 3),
    interview: report.interview
      ? { ...report.interview, followUpQuestions: report.interview.followUpQuestions.slice(0, 3) }
      : null,
    technicalClarity: report.technicalClarity ? fix(report.technicalClarity) : null,
  };
}

export type ParseReportResult = { report: Report; error: null } | { report: null; error: string };

export function parseReportJson(raw: string): ParseReportResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { report: null, error: `JSON 파싱 실패: ${(e as Error).message}` };
  }
  const result = reportSchema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    return { report: null, error: `스키마 검증 실패: ${first ? `${first.path.join(".")} ${first.message}` : "알 수 없음"}` };
  }
  return { report: normalizeReport(result.data), error: null };
}
