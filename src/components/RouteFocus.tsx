"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// 클라이언트 내비게이션 뒤 포커스를 <main> 으로 옮긴다(docs/design/STATES.md 포커스 규칙).
// 첫 로드에서는 브라우저 기본(문서 처음)을 그대로 둔다.
export function RouteFocus() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const main = document.querySelector("main");
    if (main instanceof HTMLElement) {
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
  }, [pathname]);
  return null;
}
