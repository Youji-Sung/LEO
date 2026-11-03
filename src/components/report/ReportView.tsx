import type { Report } from "@/services/claude/schemas/report";

function ScoreBar({ label, score, comment }: { label: string; score: number; comment: string }) {
  return (
    <div className="score" data-testid="score">
      <div className="score-head">
        <span>{label}</span>
        <strong aria-label={`${label} ${score}점`}>{score}/10</strong>
      </div>
      <div className="score-bar" role="img" aria-label={`${label} ${score}점 (10점 만점)`}>
        <div className="score-fill" style={{ width: `${score * 10}%` }} />
      </div>
      <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
        {comment}
      </p>
    </div>
  );
}

export function ReportView({ report, isInterview }: { report: Report; isInterview: boolean }) {
  return (
    <div className="stack report">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>요약</h2>
        <p>{report.summary}</p>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>종합 점수</h2>
        <div className="scores">
          <ScoreBar label="문법" {...report.scores.grammar} />
          <ScoreBar label="어휘" {...report.scores.vocabulary} />
          <ScoreBar label="유창성" {...report.scores.fluency} />
          <ScoreBar label="과제 수행" {...report.scores.task} />
          {report.technicalClarity && <ScoreBar label="기술 설명의 명확성" {...report.technicalClarity} />}
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>문법 교정</h2>
        {report.grammarCorrections.length === 0 ? (
          <p className="muted">교정할 문장이 없습니다.</p>
        ) : (
          <ol className="corrections">
            {report.grammarCorrections.map((c, i) => (
              <li key={i} className="correction">
                <div className="diff">
                  <span className="orig">{c.original}</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="fixed">{c.corrected}</span>
                </div>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  {c.explanation}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>어휘 제안</h2>
        {report.vocabularySuggestions.length === 0 ? (
          <p className="muted">제안할 어휘가 없습니다.</p>
        ) : (
          <ul className="vocab">
            {report.vocabularySuggestions.map((v, i) => (
              <li key={i}>
                <div className="diff">
                  <span className="orig">{v.original}</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="fixed">{v.better}</span>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {v.meaning} · <em>{v.example}</em>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>더 나은 표현</h2>
        <ul className="vocab">
          {report.betterExpressions.map((b, i) => (
            <li key={i}>
              <div className="muted" style={{ fontSize: 13 }}>
                {b.original}
              </div>
              <div className="fixed">{b.native}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>다음 연습 과제</h2>
        <ol>
          {report.nextTasks.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
      </section>

      {isInterview && report.interview && (
        <section className="card" data-testid="interview-section">
          <h2 style={{ marginTop: 0 }}>면접 피드백</h2>
          <p>{report.interview.structureFeedback}</p>
          <h3 style={{ fontSize: 15 }}>예상 추가 질문</h3>
          <ol>
            {report.interview.followUpQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
