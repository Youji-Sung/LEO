import { ButtonLink, Card, DiffText, ScoreGauge, StatusMessage } from "@/components/ui";
import { ReportToc } from "@/components/report/ReportToc";
import { report as text } from "@/content/ko";
import type { Report } from "@/services/claude/schemas/report";
import { SaveExpression } from "@/components/learning/SaveExpression";

type SectionId = "summary" | "scores" | "interview" | "grammar" | "vocabulary" | "better" | "tasks";

const titleId = (id: SectionId) => `report-${id}-title`;

// 순서는 P2: 인정(요약) → 점수 → (면접이면 면접 피드백) → 교정 → 제안 → 다음 과제와 행동.
export function ReportView({
  report,
  isInterview,
  kind,
  limitedEvidence = false,
  conversationId,
  uncertainTranscription = false,
  savedExpressions = [],
}: {
  report: Report;
  isInterview: boolean;
  kind: "chat" | "call";
  limitedEvidence?: boolean;
  conversationId?: string;
  uncertainTranscription?: boolean;
  savedExpressions?: Array<{ original: string; phrase: string }>;
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

  // 가장 낮은 점수(같으면 앞의 것)를 "오늘의 과제"로 표시한다. 디자인이 크기를 달리 줄 수 있다.
  const scoreItems = [
    { label: text.scoreLabels.grammar, ...report.scores.grammar },
    { label: text.scoreLabels.vocabulary, ...report.scores.vocabulary },
    { label: text.scoreLabels.fluency, ...report.scores.fluency },
    { label: text.scoreLabels.task, ...report.scores.task },
    ...(report.technicalClarity
      ? [{ label: text.scoreLabels.technicalClarity, ...report.technicalClarity }]
      : []),
  ];
  const lowestIndex = scoreItems.reduce(
    (best, s, i) => (s.score < scoreItems[best]!.score ? i : best),
    0,
  );

  return (
    <div className="report">
      <ReportToc sections={sections} />

      <Card as="section" id="summary" title={text.sections.summary} titleId={titleId("summary")}>
        <p>{report.summary}</p>
      </Card>

      <Card as="section" id="scores" title={text.sections.scores} titleId={titleId("scores")}>
        {limitedEvidence && <StatusMessage tone="info">{text.limitedEvidence}</StatusMessage>}
        {uncertainTranscription && (
          <StatusMessage tone="warning">
            인식 확인이 필요한 표현이 있어 점수를 표시하지 않아요. 해당 표현은 교정과 학습 후보에서
            제외했어요. 다음 통화에서는 표시된 인식 후보를 확인해 주세요.
          </StatusMessage>
        )}
        {!uncertainTranscription && (
          <div className="scores">
            {scoreItems.map((s, i) => (
              <ScoreGauge
                key={s.label}
                label={s.label}
                score={s.score}
                comment={s.comment}
                lowest={i === lowestIndex}
              />
            ))}
          </div>
        )}
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
                  tone="suggest"
                  original={v.original}
                  corrected={v.better}
                  meaning={v.meaning}
                  example={v.example}
                />
                {conversationId && (
                  <SaveExpression
                    conversationId={conversationId}
                    kind="vocabulary"
                    index={i}
                    initiallySaved={savedExpressions.some(
                      (item) => item.original === v.original && item.phrase === v.better,
                    )}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card as="section" id="better" title={text.sections.better} titleId={titleId("better")}>
        <ul className="vocab">
          {report.betterExpressions.map((b, i) => (
            <li key={i}>
              <DiffText tone="suggest" original={b.original} corrected={b.native} />
              {conversationId && (
                <SaveExpression
                  conversationId={conversationId}
                  kind="expression"
                  index={i}
                  initiallySaved={savedExpressions.some(
                    (item) => item.original === b.original && item.phrase === b.native,
                  )}
                />
              )}
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
