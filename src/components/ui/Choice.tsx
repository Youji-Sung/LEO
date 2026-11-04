import type { InputHTMLAttributes, ReactNode } from "react";

// 라디오/체크박스를 카드로. 네이티브 input 은 시각적으로만 숨겨 키보드·보조 기술 동작을 그대로 둔다.
export function ChoiceGroup({
  legend,
  hideLegend,
  stack = false,
  hint,
  children,
  className,
}: {
  legend: string;
  hideLegend?: boolean;
  stack?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={`field ${className ?? ""}`.trim()}>
      <legend className={hideLegend ? "sr-only" : undefined}>{legend}</legend>
      {hint ? <span className="field-hint">{hint}</span> : null}
      <div className={`choice-list${stack ? " choice-list-stack" : ""}`}>{children}</div>
    </fieldset>
  );
}

type ChoiceProps = {
  kind?: "radio" | "checkbox";
  title: string;
  description?: string;
  compact?: boolean;
  icon?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "title">;

export function Choice({
  kind = "radio",
  title,
  description,
  compact = false,
  icon,
  ...input
}: ChoiceProps) {
  return (
    <label className={`choice${compact ? " choice-compact" : ""}`} data-kind={kind}>
      <input type={kind} {...input} />
      <span className="choice-mark" aria-hidden="true" />
      <span className="choice-body">
        <span className="choice-title">
          {icon ? <span className="choice-icon">{icon}</span> : null}
          {title}
        </span>
        {description ? <span className="choice-desc">{description}</span> : null}
      </span>
    </label>
  );
}

// 설정·폼의 단순 체크박스 줄(44px 히트 영역).
export function CheckRow({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <div className="field">
      <label className="check-row">
        <input type="checkbox" {...input} />
        <span>{label}</span>
      </label>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
