import { report } from "@/content/ko";
import { Badge } from "@/components/ui/Badge";

export function scoreBand(score: number): "high" | "mid" | "low" {
  return score >= 8 ? "high" : score >= 5 ? "mid" : "low";
}

// 점수 바 + 숫자 + 해석 배지. 색은 등급과 함께 가고, 보조 기술에는 한 문장으로 읽힌다.
// 분자·분모를 요소로 나눠 디자인이 크기를 다르게 줄 수 있다(글자는 그대로 "6/10").
export function ScoreGauge({
  label,
  score,
  comment,
  lowest = false,
}: {
  label: string;
  score: number;
  comment: string;
  // 리포트에서 가장 낮은 점수(오늘의 과제). 디자인이 크게 보여 줄 수 있다.
  lowest?: boolean;
}) {
  const band = scoreBand(score);
  const tone = band === "high" ? "positive" : band === "mid" ? "accent" : "caution";
  const bandText = report.scoreBand(score);
  return (
    <div
      className="score"
      data-testid="score"
      data-band={band}
      data-lowest={lowest ? "true" : undefined}
    >
      <div className="score-head">
        <span className="t-label">{label}</span>
        <span className="row" style={{ gap: "var(--space-2)" }}>
          <Badge tone={tone}>{bandText}</Badge>
          <span className="score-value">
            <span className="score-num">{score}</span>
            <span className="score-den">{report.scoreDenominator}</span>
          </span>
        </span>
      </div>
      <div
        className="score-bar"
        role="img"
        aria-label={`${report.scoreAria(label, score)}, ${bandText}`}
      >
        <div className="score-fill" style={{ width: `${score * 10}%` }} />
      </div>
      <p className="score-comment">{comment}</p>
    </div>
  );
}
