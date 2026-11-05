import type { ElementType, HTMLAttributes, ReactNode } from "react";

// 제목은 `.card-head` 로 감싼다. 콘솔 디자인이 제목을 패널 띠로 만들 때 카드 패딩과 독립적으로 다룰 수 있다.
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
        <div className="card-head">
          <h2 className="card-title" id={titleId}>
            {title}
          </h2>
        </div>
      ) : null}
      {children}
    </Tag>
  );
}
