// 실제 Claude API 스모크: LEO_ANTHROPIC_API_KEY 가 있을 때 리포트 생성 1회만 호출해 응답과 usage 를 출력한다.
// 세션은 이 스크립트를 단 한 번만 실행한다. 테스트에서는 절대 쓰지 않는다.
import "dotenv/config";
import { AnthropicProvider, resolveModel } from "../src/services/claude/anthropic-provider";
import { estimateCostUsd } from "../src/config/pricing";

async function main() {
  if (!process.env.LEO_ANTHROPIC_API_KEY?.trim()) {
    console.log("[smoke] LEO_ANTHROPIC_API_KEY 없음 → 건너뜀 (미확인)");
    process.exit(2);
  }
  if (process.env.CLAUDE_MOCK === "1") {
    console.log("[smoke] CLAUDE_MOCK=1 이면 실행하지 않습니다.");
    process.exit(2);
  }
  const provider = new AnthropicProvider();
  console.log(`[smoke] model=${resolveModel()} 리포트 생성 1회 호출`);
  const result = await provider.generateReport({
    theme: "interview",
    mode: "call",
    transcript: [
      { role: "assistant", content: "Thanks for joining. Could you start with a short introduction?" },
      { role: "user", content: "Yes, I am backend developer for five years. I mostly make API with Node and I am agree that testing is important." },
      { role: "assistant", content: "Great. Tell me about a time you had a conflict with a teammate." },
      { role: "user", content: "Last year my coworker want to use microservice but I think it is too early. We talk a lot and finally we decide to make monolith first and split later." },
      { role: "assistant", content: "How did that decision turn out?" },
      { role: "user", content: "It was good. We ship faster and there was very much less bug." },
    ],
  });
  console.log(`[smoke] stop_reason=${result.stopReason} model=${result.model} latency=${result.latencyMs}ms`);
  console.log(`[smoke] usage=${JSON.stringify(result.usage)} cost≈$${estimateCostUsd(result.model, result.usage).toFixed(4)}`);
  if (result.report) {
    console.log(`[smoke] summary: ${result.report.summary}`);
    console.log(`[smoke] scores: ${JSON.stringify(result.report.scores)}`);
    console.log(`[smoke] corrections=${result.report.grammarCorrections.length} vocab=${result.report.vocabularySuggestions.length} tasks=${result.report.nextTasks.length} interview=${result.report.interview ? "yes" : "no"}`);
  } else {
    console.log(`[smoke] 리포트 파싱 실패: ${result.parseError}`);
    console.log(result.rawText.slice(0, 500));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[smoke] 실패:", e);
  process.exit(1);
});
