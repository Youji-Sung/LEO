import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { formatDateTime, formatTokens, formatUsd } from "@/lib/format";
import {
  getUsageSummary,
  USAGE_FEATURE_LABELS,
  USAGE_PERIOD_LABELS,
  USAGE_PERIODS,
  type UsagePeriod,
} from "@/services/usage";
import type { UsageFeature } from "@/services/claude/usage";

export const metadata = { title: "사용량 — LEO" };

function isPeriod(v: string | undefined): v is UsagePeriod {
  return v !== undefined && (USAGE_PERIODS as readonly string[]).includes(v);
}

function featureLabel(feature: string): string {
  return USAGE_FEATURE_LABELS[feature as UsageFeature] ?? feature;
}

function href(period: UsagePeriod, userId?: string): string {
  const q = new URLSearchParams({ period });
  if (userId) q.set("userId", userId);
  return `/usage?${q.toString()}`;
}

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; userId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const period: UsagePeriod = isPeriod(params.period) ? params.period : "7d";
  const summary = await getUsageSummary({ viewerUserId: user.id, period, userId: params.userId || undefined });
  const selectedUserId = summary.byUser.some((u) => u.userId === params.userId) ? params.userId : undefined;
  const selectedUser = summary.byUser.find((u) => u.userId === selectedUserId);

  return (
    <div className="stack">
      <h1>사용량</h1>

      <nav className="row" aria-label="기간">
        {USAGE_PERIODS.map((p) => (
          <Link
            key={p}
            href={href(p, selectedUserId)}
            className={p === period ? "btn btn-primary" : "btn"}
            aria-current={p === period ? "page" : undefined}
          >
            {USAGE_PERIOD_LABELS[p]}
          </Link>
        ))}
      </nav>

      <nav className="row" aria-label="사용자">
        <Link href={href(period)} className={selectedUserId ? "btn" : "btn btn-primary"} aria-current={selectedUserId ? undefined : "page"}>
          전체
        </Link>
        {summary.byUser.map((u) => (
          <Link
            key={u.userId}
            href={href(period, u.userId)}
            className={u.userId === selectedUserId ? "btn btn-primary" : "btn"}
            aria-current={u.userId === selectedUserId ? "page" : undefined}
          >
            {u.name}
          </Link>
        ))}
      </nav>

      <section className="card">
        <h2>
          합계 · {USAGE_PERIOD_LABELS[period]}
          {selectedUser ? ` · ${selectedUser.name}` : ""}
        </h2>
        {summary.since ? <p className="muted">{formatDateTime(summary.since)} 이후</p> : null}
        <dl className="usage-totals">
          <div>
            <dt>호출 수</dt>
            <dd>{formatTokens(summary.totals.calls)}</dd>
          </div>
          <div>
            <dt>입력 토큰</dt>
            <dd>{formatTokens(summary.totals.inputTokens)}</dd>
          </div>
          <div>
            <dt>출력 토큰</dt>
            <dd>{formatTokens(summary.totals.outputTokens)}</dd>
          </div>
          <div>
            <dt>캐시 읽기 토큰</dt>
            <dd>{formatTokens(summary.totals.cacheReadTokens)}</dd>
          </div>
          <div>
            <dt>캐시 쓰기 토큰</dt>
            <dd>{formatTokens(summary.totals.cacheWriteTokens)}</dd>
          </div>
          <div>
            <dt>추정 비용</dt>
            <dd>{formatUsd(summary.totals.costUsd)}</dd>
          </div>
        </dl>
      </section>

      <div className="table-wrap">
        <table className="usage-table">
          <caption>사용자별</caption>
          <thead>
            <tr>
              <th scope="col">사용자</th>
              <th scope="col">호출</th>
              <th scope="col">입력</th>
              <th scope="col">출력</th>
              <th scope="col">캐시 읽기</th>
              <th scope="col">캐시 쓰기</th>
              <th scope="col">비용</th>
            </tr>
          </thead>
          <tbody>
            {summary.byUser.map((u) => (
              <tr key={u.userId}>
                <th scope="row">
                  {u.name} <span className="muted">({u.email})</span>
                </th>
                <td>{formatTokens(u.calls)}</td>
                <td>{formatTokens(u.inputTokens)}</td>
                <td>{formatTokens(u.outputTokens)}</td>
                <td>{formatTokens(u.cacheReadTokens)}</td>
                <td>{formatTokens(u.cacheWriteTokens)}</td>
                <td>{formatUsd(u.costUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-wrap">
        <table className="usage-table">
          <caption>기능별</caption>
          <thead>
            <tr>
              <th scope="col">기능</th>
              <th scope="col">호출</th>
              <th scope="col">입력</th>
              <th scope="col">출력</th>
              <th scope="col">비용</th>
            </tr>
          </thead>
          <tbody>
            {summary.byFeature.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  기록이 없습니다.
                </td>
              </tr>
            ) : (
              summary.byFeature.map((f) => (
                <tr key={f.feature}>
                  <th scope="row">{featureLabel(f.feature)}</th>
                  <td>{formatTokens(f.calls)}</td>
                  <td>{formatTokens(f.inputTokens)}</td>
                  <td>{formatTokens(f.outputTokens)}</td>
                  <td>{formatUsd(f.costUsd)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-wrap">
        <table className="usage-table">
          <caption>최근 호출 50건</caption>
          <thead>
            <tr>
              <th scope="col">시각</th>
              <th scope="col">사용자</th>
              <th scope="col">기능</th>
              <th scope="col">모델</th>
              <th scope="col">입력</th>
              <th scope="col">출력</th>
              <th scope="col">캐시 읽기</th>
              <th scope="col">캐시 쓰기</th>
              <th scope="col">비용</th>
              <th scope="col">지연 ms</th>
            </tr>
          </thead>
          <tbody>
            {summary.recent.length === 0 ? (
              <tr>
                <td colSpan={10} className="muted">
                  기록이 없습니다.
                </td>
              </tr>
            ) : (
              summary.recent.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateTime(r.createdAt)}</td>
                  <td>{r.userName}</td>
                  <td>{featureLabel(r.feature)}</td>
                  <td>{r.model}</td>
                  <td>{formatTokens(r.inputTokens)}</td>
                  <td>{formatTokens(r.outputTokens)}</td>
                  <td>{formatTokens(r.cacheReadTokens)}</td>
                  <td>{formatTokens(r.cacheWriteTokens)}</td>
                  <td>{formatUsd(r.costUsd)}</td>
                  <td>{formatTokens(r.latencyMs)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
