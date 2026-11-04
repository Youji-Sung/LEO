import { report } from "@/content/ko";

// 원문과 고친 문장을 라벨 있는 두 줄로. 취소선 없음(P2), 영어는 lang=en.
export function DiffText({
  original,
  corrected,
  explanation,
  meaning,
  example,
  originalLabel = report.original,
  correctedLabel = report.corrected,
}: {
  original: string;
  corrected: string;
  explanation?: string;
  meaning?: string;
  example?: string;
  originalLabel?: string;
  correctedLabel?: string;
}) {
  return (
    <div className="diff">
      <span className="diff-label">{originalLabel}</span>
      <span className="orig" lang="en">
        {original}
      </span>
      <span className="diff-label">{correctedLabel}</span>
      <span className="fixed" lang="en">
        {corrected}
      </span>
      {explanation ? <p className="diff-explain">{explanation}</p> : null}
      {meaning ? (
        <p className="diff-explain">
          {report.meaning}: {meaning}
        </p>
      ) : null}
      {example ? (
        <p className="diff-example">
          {report.example}: <span lang="en">{example}</span>
        </p>
      ) : null}
    </div>
  );
}
