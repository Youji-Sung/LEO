import type { ElementType, HTMLAttributes, ReactNode } from "react";

export function Card({
  as,
  padding = "md",
  title,
  titleId,
  className,
  children,
  ...rest
}: {
  as?: ElementType;
  padding?: "sm" | "md";
  title?: string;
  titleId?: string;
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  const Tag = as ?? "div";
  return (
    <Tag
      className={`card${padding === "sm" ? " card-sm" : ""}${className ? ` ${className}` : ""}`}
      aria-labelledby={title && titleId ? titleId : undefined}
      {...rest}
    >
      {title ? (
        <h2 className="card-title" id={titleId}>
          {title}
        </h2>
      ) : null}
      {children}
    </Tag>
  );
}
