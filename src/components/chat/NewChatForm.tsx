"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { chat, themes as themeText } from "@/content/ko";
import { apiJson } from "@/lib/client-fetch";
import { Button, Card, CheckRow, Choice, ChoiceGroup, StatusMessage } from "@/components/ui";

type Theme = { id: string; label: string; description: string };

export function NewChatForm({
  themes,
  hintsDefault,
  learningItemIds = [],
  learningPhrases = [],
}: {
  themes: Theme[];
  hintsDefault: boolean;
  learningItemIds?: string[];
  learningPhrases?: string[];
}) {
  const router = useRouter();
  const [theme, setTheme] = useState("free");
  const [hints, setHints] = useState(hintsDefault);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { conversation } = await apiJson<{ conversation: { id: string } }>(
        "/api/conversations",
        {
          method: "POST",
          body: JSON.stringify({ kind: "chat", theme, hintsEnabled: hints, learningItemIds }),
        },
      );
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} aria-label={chat.newChatForm}>
      {learningPhrases.length > 0 && (
        <StatusMessage tone="info">
          이어 연습할 표현: {learningPhrases.join(" · ")}. 대화 중 자연스럽게 써 보세요.
        </StatusMessage>
      )}
      <Card as="section" className="stack">
        <ChoiceGroup legend={themeText.legend} stack>
          {themes.map((t) => (
            <Choice
              key={t.id}
              kind="radio"
              name="theme"
              value={t.id}
              checked={theme === t.id}
              onChange={() => setTheme(t.id)}
              title={t.label}
              description={t.description}
            />
          ))}
        </ChoiceGroup>
        <CheckRow
          label={chat.hintsToggle}
          hint={chat.hintsToggleDesc}
          checked={hints}
          onChange={(e) => setHints(e.target.checked)}
        />
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={busy}
            loadingLabel={chat.starting}
          >
            {chat.start}
          </Button>
        </div>
      </Card>
    </form>
  );
}
