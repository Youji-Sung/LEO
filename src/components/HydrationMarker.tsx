"use client";

import { useEffect } from "react";

// 하이드레이션 완료를 <html data-hydrated="1"> 로 표시한다. E2E 가 이 표시를 기다린다.
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "1";
  }, []);
  return null;
}
