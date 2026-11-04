import { report as text } from "@/content/ko";
import type { Report } from "@/services/claude/schemas/report";

function ScoreBar({ label, score, comment }: { label: string; score: number; comment: string }) {
  return (
    <div className="score" data-testid="score">
      <div className="score-head">
        <span>{label}</span>
        <strong aria-label={text.scoreAria(label, score)}>{text.scoreOf(score)}</strong>
        <span className="score-band">{text.scoreBand(score)}</span>
      </div>
      <div className="score-bar" role="img" aria-label={text.scoreAria(label, score)}>
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
        <h2 style={{ marginTop: 0 }}>{text.sections.summary}</h2>
        <p>{report.summary}</p>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>{text.sections.scores}</h2>
        <div className="scores">
          <ScoreBar label={text.scoreLabels.grammar} {...report.scores.grammar} />
          <ScoreBar label={text.scoreLabels.vocabulary} {...report.scores.vocabulary} />
          <ScoreBar label={text.scoreLabels.fluency} {...report.scores.fluency} />
          <ScoreBar label={text.scoreLabels.task} {...report.scores.task} />
          {report.technicalClarity && <ScoreBar label={text.scoreLabels.technicalClarity} {...report.technicalClarity} />}
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>{text.sections.grammar}</h2>
        {report.grammarCorrections.length === 0 ? (
          <p className="muted">{text.grammarEmpty}</p>
        ) : (
          <ol className="corrections">
            {report.grammarCorrections.map((c, i) => (
              <li key={i} className="correction">
                <div className="diff">
                  <span className="sr-only">{text.original}: </span>
                  <span className="orig">{c.original}</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="sr-only">{text.corrected}: </span>
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
        <h2 style={{ marginTop: 0 }}>{text.sections.vocabulary}</h2>
        {report.vocabularySuggestions.length === 0 ? (
          <p className="muted">{text.vocabularyEmpty}</p>
        ) : (
          <ul className="vocab">
            {report.vocabularySuggestions.map((v, i) => (
              <li key={i}>
                <div className="diff">
                  <span className="sr-only">{text.original}: </span>
                  <span className="orig">{v.original}</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="sr-only">{text.corrected}: </span>
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
        <h2 style={{ marginTop: 0 }}>{text.sections.better}</h2>
        <ul className="vocab">
          {report.betterExpressions.map((b, i) => (
            <li key={i}>
              <div className="muted" style={{ fontSize: 13 }}>
                <span className="sr-only">{text.original}: </span>
                {b.original}
              </div>
              <div className="fixed">
                <span className="sr-only">{text.corrected}: </span>
                {b.native}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>{text.sections.nextTasks}</h2>
        <ol>
          {report.nextTasks.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
      </section>

      {isInterview && report.interview && (
        <section className="card" data-testid="interview-section">
          <h2 style={{ marginTop: 0 }}>{text.sections.interview}</h2>
          <p>{report.interview.structureFeedback}</p>
          <h3 style={{ fontSize: 15 }}>{text.sections.followUps}</h3>
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
