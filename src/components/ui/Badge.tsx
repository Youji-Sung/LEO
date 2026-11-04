import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "accent" | "positive" | "caution" | "negative";

// 뜻은 항상 텍스트로 전달하고 색은 보조 신호다(SYSTEM.md 7절).
export function Badge({
  tone = "neutral",
  icon,
  children,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className={`badge${tone === "neutral" ? "" : ` badge-${tone}`}`}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}
