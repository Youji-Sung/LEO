import { ButtonLink, Card, DiffText, ScoreGauge } from "@/components/ui";
import { report as text } from "@/content/ko";
import type { Report } from "@/services/claude/schemas/report";

type SectionId = "summary" | "scores" | "interview" | "grammar" | "vocabulary" | "better" | "tasks";

const titleId = (id: SectionId) => `report-${id}-title`;

// 순서는 P2: 인정(요약) → 점수 → (면접이면 면접 피드백) → 교정 → 제안 → 다음 과제와 행동.
export function ReportView({
  report,
  isInterview,
  kind,
}: {
  report: Report;
  isInterview: boolean;
  kind: "chat" | "call";
}) {
  const interview = isInterview ? report.interview : null;
  const sections: { id: SectionId; title: string }[] = [
    { id: "summary", title: text.sections.summary },
    { id: "scores", title: text.sections.scores },
    ...(interview ? [{ id: "interview" as const, title: text.sections.interview }] : []),
    { id: "grammar", title: text.sections.grammar },
    { id: "vocabulary", title: text.sections.vocabulary },
    { id: "better", title: text.sections.better },
    { id: "tasks", title: text.sections.nextTasks },
  ];

  return (
    <div className="report">
      <nav className="report-toc" aria-label={text.toc}>
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.title}
          </a>
        ))}
      </nav>

      <Card as="section" id="summary" title={text.sections.summary} titleId={titleId("summary")}>
        <p>{report.summary}</p>
      </Card>

      <Card as="section" id="scores" title={text.sections.scores} titleId={titleId("scores")}>
        <div className="scores">
          <ScoreGauge label={text.scoreLabels.grammar} {...report.scores.grammar} />
          <ScoreGauge label={text.scoreLabels.vocabulary} {...report.scores.vocabulary} />
          <ScoreGauge label={text.scoreLabels.fluency} {...report.scores.fluency} />
          <ScoreGauge label={text.scoreLabels.task} {...report.scores.task} />
          {report.technicalClarity && (
            <ScoreGauge label={text.scoreLabels.technicalClarity} {...report.technicalClarity} />
          )}
        </div>
      </Card>

      {interview && (
        <Card
          as="section"
          id="interview"
          title={text.sections.interview}
          titleId={titleId("interview")}
          data-testid="interview-section"
        >
          <div className="stack">
            <p>{interview.structureFeedback}</p>
            <div className="stack-sm">
              <h3>{text.sections.followUps}</h3>
              <ol className="tasks">
                {interview.followUpQuestions.map((q, i) => (
                  <li key={i} lang="en">
                    {q}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Card>
      )}

      <Card as="section" id="grammar" title={text.sections.grammar} titleId={titleId("grammar")}>
        {report.grammarCorrections.length === 0 ? (
          <p className="muted">{text.grammarEmpty}</p>
        ) : (
          <ol className="corrections">
            {report.grammarCorrections.map((c, i) => (
              <li key={i} className="correction">
                <DiffText
                  original={c.original}
                  corrected={c.corrected}
                  explanation={c.explanation}
                />
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card
        as="section"
        id="vocabulary"
        title={text.sections.vocabulary}
        titleId={titleId("vocabulary")}
      >
        {report.vocabularySuggestions.length === 0 ? (
          <p className="muted">{text.vocabularyEmpty}</p>
        ) : (
          <ul className="vocab">
            {report.vocabularySuggestions.map((v, i) => (
              <li key={i}>
                <DiffText
                  original={v.original}
                  corrected={v.better}
                  meaning={v.meaning}
                  example={v.example}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card as="section" id="better" title={text.sections.better} titleId={titleId("better")}>
        <ul className="vocab">
          {report.betterExpressions.map((b, i) => (
            <li key={i}>
              <DiffText original={b.original} corrected={b.native} />
            </li>
          ))}
        </ul>
      </Card>

      <Card as="section" id="tasks" title={text.sections.nextTasks} titleId={titleId("tasks")}>
        <div className="stack">
          <ol className="tasks">
            {report.nextTasks.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
          <div className="row">
            {kind === "call" ? (
              <ButtonLink variant="primary" href="/call">
                {text.nextAction}
              </ButtonLink>
            ) : (
              <ButtonLink variant="primary" href="/chat">
                {text.nextActionChat}
              </ButtonLink>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
