// 2~10초 대기용 회전 표시. label 은 스크린리더용이며 비어 있으면 상위 요소가 상태를 알려야 한다.
export function Spinner({
  size = "md",
  label,
  inline = false,
}: {
  size?: "sm" | "md" | "lg";
  label: string;
  inline?: boolean;
}) {
  const cls = `spinner${size === "sm" ? " spinner-sm" : size === "lg" ? " spinner-lg" : ""}`;
  if (inline) return <span className={cls} aria-hidden="true" />;
  return (
    <span className="inline-status" role="status">
      <span className={cls} aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

// 화면 로드용 자리표시자. 콘텐츠 구조를 흉내 내며 보조 기술에는 노출하지 않는다.
export function Skeleton({
  lines = 3,
  height = "1em",
  width,
}: {
  lines?: number;
  height?: string;
  width?: string;
}) {
  return (
    <div aria-hidden="true" className="stack-sm">
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className="skeleton"
          style={{ height, width: width ?? (i === lines - 1 ? "60%" : "100%") }}
        />
      ))}
    </div>
  );
}
