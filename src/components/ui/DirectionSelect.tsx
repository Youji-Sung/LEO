"use client";

import { useState } from "react";
import { settings as text } from "@/content/ko";
import { Choice, ChoiceGroup } from "@/components/ui/Choice";
import { DIRECTION_QUERY, DIRECTIONS, type Direction } from "@/lib/direction";

export type DirectionChoice = Direction | "basic";
const OPTIONS: readonly DirectionChoice[] = ["basic", ...DIRECTIONS];

// 고르면 ?direction= 쿼리로 이동한다. proxy 가 쿠키로 옮기고 되돌려 보내므로 저장 버튼이 필요 없다.
export function DirectionSelect({ value }: { value: DirectionChoice }) {
  const [current, setCurrent] = useState<DirectionChoice>(value);
  function pick(next: DirectionChoice) {
    setCurrent(next);
    const param = next === "basic" ? "off" : next;
    // 루트 레이아웃의 data-direction 과 폰트 링크가 바뀌어야 하므로 전체 새로고침으로 이동한다.
    const url = new URL("/settings", window.location.origin);
    url.searchParams.set(DIRECTION_QUERY, param);
    window.location.assign(url.toString());
  }
  return (
    <ChoiceGroup legend={text.direction} hint={text.directionHint} stack>
      {OPTIONS.map((d) => (
        <Choice
          key={d}
          kind="radio"
          name="direction"
          value={d}
          checked={current === d}
          onChange={() => pick(d)}
          title={text.directionOptions[d].title}
          description={text.directionOptions[d].description}
        />
      ))}
    </ChoiceGroup>
  );
}
