export type SpeechSubmission = { rawText: string; reviewed: boolean; alternatives?: string[] };
export type SpeechSuggestion = { from: string; to: string };
const terms: Array<[RegExp, string]> = [
  [/\bfront\s+and\s+(engineer|developer|development)\b/gi, "frontend $1"],
  [/\bback\s+and\s+(engineer|developer|development)\b/gi, "backend $1"],
  [/\breact\s+(?:jay|j)\s*(?:ess|s)\b/gi, "React JS"],
  [/\bnode\s+(?:jay|j)\s*(?:ess|s)\b/gi, "Node.js"],
];
export const DEFAULT_SPEECH_TERMS = [
  "frontend engineer",
  "backend engineer",
  "React",
  "TypeScript",
  "PostgreSQL",
  "Node.js",
  "API",
  "Kubernetes",
];
export function splitSpeechTerms(value = ""): string[] {
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}
export function speechSuggestions(
  text: string,
  alternatives: string[] = [],
  customTerms: string[] = [],
): SpeechSuggestion[] {
  const found: SpeechSuggestion[] = [];
  for (const [pattern, replacement] of terms) {
    for (const match of text.matchAll(pattern))
      found.push({ from: match[0], to: match[0].replace(pattern, replacement) });
  }
  // Only suggest an alternative's changed span when it is a registered term.
  // Never adopt a recognizer's entire rewritten sentence or correct grammar.
  const registered = [...DEFAULT_SPEECH_TERMS, ...customTerms].map((s) => s.toLowerCase());
  for (const alternative of alternatives.slice(0, 3)) {
    const a = text.trim().split(/\s+/),
      b = alternative.trim().split(/\s+/);
    let start = 0,
      end = 0;
    while (
      start < Math.min(a.length, b.length) &&
      a[start]?.toLowerCase() === b[start]?.toLowerCase()
    )
      start++;
    while (
      end < Math.min(a.length, b.length) - start &&
      a[a.length - 1 - end]?.toLowerCase() === b[b.length - 1 - end]?.toLowerCase()
    )
      end++;
    const from = a.slice(start, a.length - end).join(" ");
    const to = b.slice(start, b.length - end).join(" ");
    if (from && to && from !== to && registered.includes(to.toLowerCase()) && from.length < 100)
      found.push({ from, to });
  }
  return found
    .filter((s, i) => found.findIndex((v) => v.from === s.from && v.to === s.to) === i)
    .slice(0, 5);
}
export function readSpeech(value?: string | null): SpeechSubmission | undefined {
  if (!value) return;
  try {
    const v = JSON.parse(value);
    if (typeof v.rawText === "string" && typeof v.reviewed === "boolean") return v;
  } catch {}
}
export function uncertainSpeech(text: string, speech?: SpeechSubmission): SpeechSuggestion[] {
  return speech?.reviewed ? [] : speechSuggestions(text, speech?.alternatives);
}
export function speechAnnotation(text: string, speech?: SpeechSubmission): string {
  const uncertain = uncertainSpeech(text, speech);
  return uncertain.length
    ? `Speech recognition is uncertain ONLY at these spans: ${JSON.stringify(uncertain)}. Do not treat these spans as evidence of a language error or pronunciation problem. Preserve and evaluate other grammar as submitted. Ask for clarification if needed.`
    : "";
}
