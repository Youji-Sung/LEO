import { report } from "@/content/ko";
import { Badge } from "@/components/ui/Badge";

export function scoreBand(score: number): "high" | "mid" | "low" {
  return score >= 8 ? "high" : score >= 5 ? "mid" : "low";
}

// 점수 바 + 숫자 + 해석 배지. 색은 등급과 함께 가고, 보조 기술에는 한 문장으로 읽힌다.
export function ScoreGauge({
  label,
  score,
  comment,
}: {
  label: string;
  score: number;
  comment: string;
}) {
  const band = scoreBand(score);
  const tone = band === "high" ? "positive" : band === "mid" ? "accent" : "caution";
  const bandText = report.scoreBand(score);
  return (
    <div
      className="score"
      data-testid="score"
      data-band={band}
      role="img"
      aria-label={`${report.scoreAria(label, score)}, ${bandText}`}
    >
      <div className="score-head">
        <span className="t-label">{label}</span>
        <span className="row" style={{ gap: "var(--space-2)" }}>
          <Badge tone={tone}>{bandText}</Badge>
          <span className="score-value">{report.scoreOf(score)}</span>
        </span>
      </div>
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${score * 10}%` }} />
      </div>
      <p className="score-comment">{comment}</p>
    </div>
  );
}
