import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

export type StatusTone = "info" | "success" | "warning" | "error";

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
};

// info·success 는 role=status(polite), warning·error 는 role=alert (WCAG 4.1.3).
export function StatusMessage({
  tone = "info",
  title,
  children,
  action,
  className,
  polite = false,
  "data-testid": testId,
}: {
  tone?: StatusTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  // 경고라도 즉시 끼어들 필요가 없으면(1분 남음 등) polite 로 status 를 쓴다.
  polite?: boolean;
  "data-testid"?: string;
}) {
  const Icon = ICONS[tone];
  const role = !polite && (tone === "warning" || tone === "error") ? "alert" : "status";
  return (
    <div
      className={`status status-${tone}${className ? ` ${className}` : ""}`}
      role={role}
      data-testid={testId}
    >
      <Icon size={18} aria-hidden="true" />
      <div className="status-body">
        {title ? <div className="status-title">{title}</div> : null}
        {children ? <div>{children}</div> : null}
        {action}
      </div>
    </div>
  );
}
