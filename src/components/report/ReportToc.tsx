"use client";

import { useEffect, useState } from "react";
import { report as text } from "@/content/ko";

// 리포트 목차. 스크롤 위치에 따라 현재 절 링크에 aria-current 를 둔다(IntersectionObserver, 없으면 표시 없음).
export function ReportToc({ sections }: { sections: { id: string; title: string }[] }) {
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        // 보이는 절 중 화면 위쪽에 가장 가까운 것
        let best: string | null = null;
        let bestTop = Infinity;
        for (const [id, top] of visible) {
          if (top < bestTop) {
            best = id;
            bestTop = top;
          }
        }
        if (best) setCurrent(best);
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);
  return (
    <nav className="report-toc" aria-label={text.toc}>
      {sections.map((s) => (
        <a key={s.id} href={`#${s.id}`} aria-current={current === s.id ? "true" : undefined}>
          {s.title}
        </a>
      ))}
    </nav>
  );
}
