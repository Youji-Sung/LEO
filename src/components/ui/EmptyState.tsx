import type { ReactNode } from "react";

// 상황 한 문장 + 행동 하나 (WRITING.md 2.8).
export function EmptyState({
  title,
  body,
  action,
  icon,
  "data-testid": testId,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
  "data-testid"?: string;
}) {
  return (
    <div className="empty" data-testid={testId}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <h2 className="t-title">{title}</h2>
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}
