import Link from "next/link";

export type SegmentItem = { id: string; label: string; href?: string };

// 필터·기간 선택. 링크형은 aria-current, 버튼형은 aria-pressed 로 현재 값을 알린다(탭 패널 전환이 아니므로 tablist 아님).
export function Segmented({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: SegmentItem[];
  value: string;
  onChange?: (id: string) => void;
}) {
  const isLinks = items.every((i) => typeof i.href === "string");
  if (isLinks) {
    return (
      <nav className="segmented" aria-label={label}>
        {items.map((i) => (
          <Link key={i.id} href={i.href!} aria-current={i.id === value ? "page" : undefined}>
            {i.label}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <div className="segmented" role="group" aria-label={label}>
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          aria-pressed={i.id === value}
          onClick={() => onChange?.(i.id)}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
