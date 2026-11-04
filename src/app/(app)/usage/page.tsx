import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { common, usage as text } from "@/content/ko";
import { formatDateTime, formatTokens, formatUsd } from "@/lib/format";
import { getUsageSummary, USAGE_PERIODS, type UsagePeriod } from "@/services/usage";
import type { UsageFeature } from "@/services/claude/usage";

export const metadata = { title: common.pageTitle(text.pageTitle) };

function isPeriod(v: string | undefined): v is UsagePeriod {
  return v !== undefined && (USAGE_PERIODS as readonly string[]).includes(v);
}

function featureLabel(feature: string): string {
  return text.features[feature as UsageFeature] ?? feature;
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
      <h1>{text.pageTitle}</h1>

      <nav className="row" aria-label={text.periodLabel}>
        {USAGE_PERIODS.map((p) => (
          <Link
            key={p}
            href={href(p, selectedUserId)}
            className={p === period ? "btn btn-primary" : "btn"}
            aria-current={p === period ? "page" : undefined}
          >
            {text.periods[p]}
          </Link>
        ))}
      </nav>

      <nav className="row" aria-label={text.userLabel}>
        <Link href={href(period)} className={selectedUserId ? "btn" : "btn btn-primary"} aria-current={selectedUserId ? undefined : "page"}>
          {text.allUsers}
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
          {text.totalsTitle} · {text.periods[period]}
          {selectedUser ? ` · ${selectedUser.name}` : ""}
        </h2>
        {summary.since ? <p className="muted">{text.since(formatDateTime(summary.since))}</p> : null}
        <dl className="usage-totals">
          <div>
            <dt>{text.calls}</dt>
            <dd>{formatTokens(summary.totals.calls)}</dd>
          </div>
          <div>
            <dt>{text.inputTokens}</dt>
            <dd>{formatTokens(summary.totals.inputTokens)}</dd>
          </div>
          <div>
            <dt>{text.outputTokens}</dt>
            <dd>{formatTokens(summary.totals.outputTokens)}</dd>
          </div>
          <div>
            <dt>{text.cacheRead}</dt>
            <dd>{formatTokens(summary.totals.cacheReadTokens)}</dd>
          </div>
          <div>
            <dt>{text.cacheWrite}</dt>
            <dd>{formatTokens(summary.totals.cacheWriteTokens)}</dd>
          </div>
          <div>
            <dt>{text.cost}</dt>
            <dd>{formatUsd(summary.totals.costUsd)}</dd>
          </div>
        </dl>
      </section>

      <div className="table-wrap">
        <table className="usage-table">
          <caption>{text.byUser}</caption>
          <thead>
            <tr>
              <th scope="col">{text.columns.user}</th>
              <th scope="col">{text.columns.calls}</th>
              <th scope="col">{text.columns.input}</th>
              <th scope="col">{text.columns.output}</th>
              <th scope="col">{text.columns.cacheRead}</th>
              <th scope="col">{text.columns.cacheWrite}</th>
              <th scope="col">{text.columns.cost}</th>
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
          <caption>{text.byFeature}</caption>
          <thead>
            <tr>
              <th scope="col">{text.columns.feature}</th>
              <th scope="col">{text.columns.calls}</th>
              <th scope="col">{text.columns.input}</th>
              <th scope="col">{text.columns.output}</th>
              <th scope="col">{text.columns.cost}</th>
            </tr>
          </thead>
          <tbody>
            {summary.byFeature.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  {text.empty}
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
          <caption>{text.recent}</caption>
          <thead>
            <tr>
              <th scope="col">{text.columns.time}</th>
              <th scope="col">{text.columns.user}</th>
              <th scope="col">{text.columns.feature}</th>
              <th scope="col">{text.columns.model}</th>
              <th scope="col">{text.columns.input}</th>
              <th scope="col">{text.columns.output}</th>
              <th scope="col">{text.columns.cacheRead}</th>
              <th scope="col">{text.columns.cacheWrite}</th>
              <th scope="col">{text.columns.cost}</th>
              <th scope="col">{text.columns.latency}</th>
            </tr>
          </thead>
          <tbody>
            {summary.recent.length === 0 ? (
              <tr>
                <td colSpan={10} className="muted">
                  {text.empty}
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
