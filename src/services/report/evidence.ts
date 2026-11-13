import { readSpeech, uncertainSpeech } from "@/lib/transcription";
import type { Report } from "@/services/claude/schemas/report";
export function reportEvidence(
  report: Report,
  kind: string,
  messages: Array<{ role: string; content: string; speech?: string | null }>,
) {
  const uncertain =
    kind === "call"
      ? messages
          .filter((m) => m.role === "user")
          .flatMap((m) => uncertainSpeech(m.content, readSpeech(m.speech)))
      : [];
  const safe = (item: { original: string }) =>
    !uncertain.some((s) => item.original.toLowerCase().includes(s.from.toLowerCase()));
  return {
    report: {
      ...report,
      grammarCorrections: report.grammarCorrections.filter(safe),
      vocabularySuggestions: report.vocabularySuggestions.filter(safe),
      betterExpressions: report.betterExpressions.filter(safe),
    },
    uncertain: uncertain.length > 0,
  };
}
