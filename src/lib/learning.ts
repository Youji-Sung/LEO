export type LearningCard = {
  id: string;
  sourceConversationId: string;
  phrase: string;
  original: string;
  explanation: string;
  example: string;
  stage: number;
  reviewCount: number;
  dueAt: string;
  lastAnswer: string;
  lastUsedAt: string | null;
  lastUseConversationId: string | null;
  lastUseText: string | null;
};
export const LEARNING_STAGES = [
  "의미와 쓰임",
  "도움받아 익히기",
  "내 상황으로 바꾸기",
  "스스로 떠올리기",
  "시간을 두고 복습",
];
export function learningText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
export function containsExpression(text: string, phrase: string) {
  return ` ${learningText(text)} `.includes(` ${learningText(phrase)} `);
}
export function clozeExample(example: string, phrase: string) {
  const at = example.toLowerCase().indexOf(phrase.toLowerCase());
  return at >= 0 ? example.slice(0, at) + "_____" + example.slice(at + phrase.length) : "_____";
}
export function nextLearningState(
  stage: number,
  reviews: number,
  outcome: "again" | "hint" | "ready",
  now = Date.now(),
) {
  const nextStage =
    outcome === "again"
      ? Math.max(0, stage - 1)
      : outcome === "ready"
        ? Math.min(4, stage + 1)
        : stage;
  const days = outcome === "hint" ? 1 : Math.min(14, 2 ** Math.min(4, Math.max(0, reviews - 3)));
  const delay = outcome === "again" ? 10 * 60_000 : nextStage < 4 ? 0 : days * 86400_000;
  return { stage: nextStage, dueAt: new Date(now + delay) };
}
