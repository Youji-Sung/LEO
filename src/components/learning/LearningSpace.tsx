"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiJson } from "@/lib/client-fetch";
import {
  clozeExample,
  containsExpression,
  LEARNING_STAGES,
  learningText,
  type LearningCard,
} from "@/lib/learning";
import { getVoiceAdapter } from "@/lib/voice";
import { Button, ButtonLink, Card, EmptyState, StatusMessage, TextArea } from "@/components/ui";

export function LearningSpace({
  initialItems,
  now,
  voice,
}: {
  initialItems: LearningCard[];
  now: string;
  voice: string | null;
}) {
  const [items, setItems] = useState(initialItems),
    [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(now);
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toISOString()), 60_000);
    return () => clearInterval(timer);
  }, []);
  async function refresh() {
    const data = await apiJson<{ items: LearningCard[] }>("/api/learning");
    setItems(data.items);
    setClock(new Date().toISOString());
  }
  const active = items.find((item) => item.id === selected);
  const due = items.filter((item) => item.dueAt <= clock).length;
  return (
    <div className="stack-lg learning-space">
      <div className="page-head">
        <div>
          <h1>표현 익히기</h1>
          <p>내 대화에서 고른 표현을 차근차근 익히고, 다음 대화에서 써 봐요.</p>
        </div>
        <div className="row">
          <ButtonLink href="/call">통화하기</ButtonLink>
          <ButtonLink href="/chat">채팅하기</ButtonLink>
        </div>
      </div>
      {error && <StatusMessage tone="error">{error}</StatusMessage>}
      {!items.length ? (
        <EmptyState
          title="리포트에서 익힐 표현을 골라 주세요."
          body="어휘와 표현 제안의 ‘학습할 표현에 담기’를 누르면 여기서 이어 배울 수 있어요."
          action={<ButtonLink href="/history">대화 기록 보기</ButtonLink>}
        />
      ) : (
        <>
          <p className="muted">
            {items.length}개 표현 · 지금 다시 볼 표현 {due}개. 복습 일정은 조정 가능한 연습
            간격이며, 시험을 통과해야 대화할 수 있는 것은 아니에요.
          </p>
          {active ? (
            <Practice
              key={`${active.id}-${active.reviewCount}`}
              item={active}
              voice={voice}
              onBack={() => setSelected(null)}
              onRefresh={refresh}
              onError={setError}
            />
          ) : (
            <ul className="list">
              {items.map((item) => (
                <li className="list-item" key={item.id}>
                  <div className="list-main">
                    <strong lang="en">{item.phrase}</strong>
                    <p>{item.explanation}</p>
                    <p className="muted">
                      {LEARNING_STAGES[item.stage]} ·{" "}
                      {item.dueAt <= clock
                        ? "지금 연습할 수 있어요"
                        : `다음 복습 ${new Date(item.dueAt).toLocaleDateString("ko-KR")}`}
                    </p>
                    {item.lastUsedAt && (
                      <p>
                        대화에서 이 표현이 다시 등장했어요.{" "}
                        <Link href={`/history/${item.lastUseConversationId}`}>문맥 확인하기</Link>
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setError("");
                      setSelected(item.id);
                    }}
                  >
                    이어 익히기
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Practice({
  item,
  voice,
  onBack,
  onRefresh,
  onError,
}: {
  item: LearningCard;
  voice: string | null;
  onBack: () => void;
  onRefresh: () => Promise<void>;
  onError: (error: string) => void;
}) {
  const [answer, setAnswer] = useState(""),
    [hint, setHint] = useState(0),
    [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [remove, setRemove] = useState(false);
  const lock = useRef(false);
  const hidden = item.stage >= 3 && !checked;
  const exact = learningText(answer) === learningText(item.phrase);
  const included = containsExpression(answer, item.phrase);
  useEffect(() => {
    const heading = document.getElementById(`practice-${item.id}`);
    if (heading) {
      heading.tabIndex = -1;
      heading.focus();
    }
    return () => getVoiceAdapter().cancelSpeech();
  }, [item.id]);
  async function save(outcome: "again" | "hint" | "ready") {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    onError("");
    try {
      await apiJson(`/api/learning/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ outcome, answer, version: item.reviewCount }),
      });
      await onRefresh();
      if (item.stage >= 3) onBack();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function deleteItem() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await apiJson(`/api/learning/${item.id}`, { method: "DELETE" });
      await onRefresh();
      onBack();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function listen() {
    const adapter = getVoiceAdapter();
    adapter.cancelSpeech();
    void adapter
      .speak(item.example || item.phrase, { voiceId: voice })
      .catch(() => setNotice("재생하지 못했어요. 예문을 읽으며 이어갈 수 있어요."));
  }
  return (
    <Card
      as="section"
      className="stack"
      title={LEARNING_STAGES[item.stage]}
      titleId={`practice-${item.id}`}
    >
      <div className="row learning-actions">
        <Button onClick={onBack}>표현 목록</Button>
        <Link href={`/history/${item.sourceConversationId}/report`}>원래 리포트</Link>
      </div>
      {!hidden && <h2 lang="en">{item.phrase}</h2>}
      <p>{item.explanation}</p>
      {item.stage === 0 && (
        <>
          <div className="stack-sm">
            <h3>내 대화에서는</h3>
            <p lang="en">{item.original}</p>
            <h3>이렇게 표현해 볼 수 있어요</h3>
            <p lang="en">{item.example || item.phrase}</p>
          </div>
          <p className="muted">
            예문은 쓰임을 익히기 위한 예시예요. 내 상황과 다른 부분은 바꿔 써 보세요. 소리 내어 읽어
            봐도 좋아요.
          </p>
          <Button onClick={listen}>예문 듣기</Button>
          <Button variant="primary" onClick={() => save("ready")} loading={busy}>
            뜻과 쓰임을 확인했어요
          </Button>
        </>
      )}
      {item.stage === 1 && (
        <>
          <p>문장 속 빈칸에 들어갈 표현을 완성해 보세요. 위 표현을 보면서 익혀도 좋아요.</p>
          <p lang="en">{clozeExample(item.example, item.phrase)}</p>
        </>
      )}
      {item.stage === 2 && (
        <>
          <p>예문의 사람·상황을 바꿔 내 경험에 맞는 문장을 만들어 보세요.</p>
          <p lang="en">{item.example || item.phrase}</p>
          <Button onClick={() => setAnswer(item.example || item.phrase)}>
            예문을 가져와 바꾸기
          </Button>
        </>
      )}
      {item.stage >= 3 && (
        <p>
          원래 대화와 비슷한 상황에서 이 뜻을 전한다고 생각해 보세요. 익힌 표현이나 그 표현을 쓴
          문장을 스스로 떠올려 적어 보세요.
        </p>
      )}
      {item.stage > 0 && (
        <>
          <TextArea
            id={`learning-answer-${item.id}`}
            label={item.stage === 1 ? "빈칸에 들어갈 표현" : "내가 떠올린 표현 또는 문장"}
            value={answer}
            maxLength={2000}
            rows={3}
            lang="en"
            autoCorrect="off"
            spellCheck={false}
            autoCapitalize="off"
            onChange={(e) => {
              setAnswer(e.target.value);
              setChecked(false);
            }}
          />
          <div className="row learning-actions">
            <Button onClick={() => setHint((n) => Math.min(3, n + 1))} disabled={hint === 3}>
              {hint === 3 ? "힌트를 모두 봤어요" : "힌트 보기"}
            </Button>
            <Button onClick={() => setChecked(true)} disabled={!answer.trim()}>
              답과 비교하기
            </Button>
          </div>
          {hint > 0 && (
            <StatusMessage tone="info">
              <span lang="en">
                {hint === 1
                  ? `${item.phrase.trim().includes(" ") ? item.phrase.split(/\s+/)[0] : item.phrase.slice(0, 1)} …`
                  : hint === 2
                    ? item.phrase
                    : item.example || item.phrase}
              </span>
            </StatusMessage>
          )}
          {checked && (
            <div className="stack-sm" role="status">
              <p lang="en">{item.phrase}</p>
              <p lang="en">{item.example || item.phrase}</p>
              <p>
                {item.stage === 1
                  ? exact
                    ? "표현이 맞아요. 문장 전체를 한 번 읽어 보세요."
                    : "위 표현과 비교해 보세요. 같은 뜻의 다른 표현도 가능하지만, 이번에는 고른 표현을 익혀 봐요."
                  : included
                    ? "고른 표현을 사용했어요. 뜻과 상황에 맞는지는 예문과 비교해 주세요."
                    : "예문과 비교해 보세요. 다른 자연스러운 표현을 썼다면 틀린 답으로 볼 필요는 없어요."}
              </p>
              <p className="muted">
                문장 전체의 문법을 자동 채점한 결과는 아니에요. 다음 대화의 리포트에서 피드백을 받을
                수 있어요.
              </p>
              <div className="row learning-actions">
                <Button onClick={() => save("again")} loading={busy}>
                  설명부터 다시 익히기
                </Button>
                <Button onClick={() => save("hint")} disabled={busy}>
                  도움받아 떠올렸어요
                </Button>
                <Button
                  variant="primary"
                  onClick={() => save(hint ? "hint" : "ready")}
                  disabled={busy || (item.stage === 1 && !exact)}
                >
                  {hint ? "힌트를 보고 익혔어요" : "스스로 떠올렸어요"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      {notice && <StatusMessage tone="info">{notice}</StatusMessage>}
      {item.lastAnswer && (
        <details>
          <summary>지난번 내가 쓴 답</summary>
          <p lang="en">{item.lastAnswer}</p>
        </details>
      )}
      <div className="stack-sm">
        <h3>대화에서 이어 써 보기</h3>
        <p>
          연습을 마치지 않아도 시작할 수 있어요. 상대가 표현을 쓸 기회를 자연스럽게 만들어 줘요.
        </p>
        <div className="row learning-actions">
          <ButtonLink href={`/call?learn=${encodeURIComponent(item.id)}`}>
            통화로 이어가기
          </ButtonLink>
          <ButtonLink href={`/chat?learn=${encodeURIComponent(item.id)}`}>
            채팅으로 이어가기
          </ButtonLink>
        </div>
      </div>
      {remove ? (
        <StatusMessage tone="warning">
          학습 기록에서 이 표현을 뺄까요? 원래 대화와 리포트는 남아요.
          <div className="row">
            <Button variant="danger" onClick={deleteItem} disabled={busy}>
              학습 목록에서 빼기
            </Button>
            <Button onClick={() => setRemove(false)}>취소</Button>
          </div>
        </StatusMessage>
      ) : (
        <Button variant="ghost" onClick={() => setRemove(true)}>
          이 표현 그만 익히기
        </Button>
      )}
    </Card>
  );
}
