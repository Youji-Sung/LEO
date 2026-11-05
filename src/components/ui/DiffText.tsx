import { Fragment } from "react";
import { report } from "@/content/ko";
import { diffWords, type DiffToken } from "@/lib/word-diff";

// 바뀐 단어만 span 으로 감싼다. 기본·서재·무대는 모양을 바꾸지 않고(취소선 없음, P2) 콘솔이 diff 처럼 칠한다.
function Words({ tokens, changed }: { tokens: DiffToken[]; changed: "removed" | "added" }) {
  if (!tokens.some((t) => t.kind === changed)) return <>{tokens.map((t) => t.text).join(" ")}</>;
  return (
    <>
      {tokens.map((t, i) => (
        <Fragment key={i}>
          {i > 0 ? " " : ""}
          {t.kind === changed ? (
            <span className={`diff-word diff-word-${changed}`}>{t.text}</span>
          ) : (
            t.text
          )}
        </Fragment>
      ))}
    </>
  );
}

// 원문과 고친 문장을 라벨 있는 두 줄로. 취소선 없음(P2), 영어는 lang=en.
export function DiffText({
  original,
  corrected,
  explanation,
  meaning,
  example,
  tone = "fix",
  originalLabel = report.original,
  correctedLabel,
}: {
  // fix: 틀린 것을 고침(교정, 긍정색) / suggest: 더 나은 표현 제안(강조색)
  tone?: "fix" | "suggest";
  original: string;
  corrected: string;
  explanation?: string;
  meaning?: string;
  example?: string;
  originalLabel?: string;
  correctedLabel?: string;
}) {
  const label = correctedLabel ?? (tone === "suggest" ? report.suggested : report.corrected);
  const diff = diffWords(original, corrected);
  return (
    <div className="diff">
      <span className="diff-label">{originalLabel}</span>
      <span className="orig" lang="en">
        <Words tokens={diff.original} changed="removed" />
      </span>
      <span className="diff-label">{label}</span>
      <span className={`fixed${tone === "suggest" ? " fixed-suggest" : ""}`} lang="en">
        <Words tokens={diff.revised} changed="added" />
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
