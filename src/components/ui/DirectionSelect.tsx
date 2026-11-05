"use client";

import { useState } from "react";
import { settings as text } from "@/content/ko";
import { Choice, ChoiceGroup } from "@/components/ui/Choice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { apiJson } from "@/lib/client-fetch";
import { DIRECTION_CHOICES, type DirectionChoice } from "@/lib/direction";

export type { DirectionChoice };

// 고르면 바로 저장한다(테마와 달리 저장 버튼을 거치지 않는다). 루트 레이아웃의 data-direction 과
// 폰트 링크가 바뀌어야 하므로 저장 뒤 전체 새로고침한다.
export function DirectionSelect({ value }: { value: DirectionChoice }) {
  const [current, setCurrent] = useState<DirectionChoice>(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function pick(next: DirectionChoice) {
    setCurrent(next);
    setBusy(true);
    setError(null);
    try {
      await apiJson("/api/settings", { method: "PATCH", body: JSON.stringify({ direction: next }) });
      window.location.reload();
    } catch (err) {
      setCurrent(value);
      setError((err as Error).message);
      setBusy(false);
    }
  }
  return (
    <ChoiceGroup legend={text.direction} hint={text.directionHint} stack>
      {DIRECTION_CHOICES.map((d) => (
        <Choice
          key={d}
          kind="radio"
          name="direction"
          value={d}
          checked={current === d}
          disabled={busy}
          onChange={() => pick(d)}
          title={text.directionOptions[d].title}
          description={text.directionOptions[d].description}
        />
      ))}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
    </ChoiceGroup>
  );
}
