"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { settings as text } from "@/content/ko";
import { Choice, ChoiceGroup } from "@/components/ui/Choice";
import { applyThemeToDocument, THEME_MODES, type ThemeMode } from "@/lib/theme";

const ICONS = { system: Monitor, light: Sun, dark: Moon };

// 고르는 즉시 <html data-theme> 에 반영하고(미리보기), 저장은 상위 폼이 한다.
export function ThemeSelect({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}) {
  const [current, setCurrent] = useState<ThemeMode>(value);
  function pick(mode: ThemeMode) {
    setCurrent(mode);
    applyThemeToDocument(mode);
    onChange(mode);
  }
  return (
    <ChoiceGroup legend={text.theme} hint={text.themeHint}>
      {THEME_MODES.map((mode) => {
        const Icon = ICONS[mode];
        return (
          <Choice
            key={mode}
            kind="radio"
            name="theme"
            value={mode}
            compact
            checked={current === mode}
            onChange={() => pick(mode)}
            title={text.themeOptions[mode]}
            icon={<Icon size={16} aria-hidden="true" />}
          />
        );
      })}
    </ChoiceGroup>
  );
}
