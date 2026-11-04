import { requireUser } from "@/lib/auth/current-user";
import { common, usage as text } from "@/content/ko";
import { formatDateTime, formatTokens, formatUsd } from "@/lib/format";
import { getUsageSummary, USAGE_PERIODS, type UsagePeriod } from "@/services/usage";
import type { UsageFeature } from "@/services/claude/usage";
import { Card, Segmented } from "@/components/ui";

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
  const summary = await getUsageSummary({
    viewerUserId: user.id,
    period,
    userId: params.userId || undefined,
  });
  const selectedUserId = summary.byUser.some((u) => u.userId === params.userId)
    ? params.userId
    : undefined;
  const selectedUser = summary.byUser.find((u) => u.userId === selectedUserId);
  const totalsTitle = `${text.totalsTitle} · ${text.periods[period]}${
    selectedUser ? ` · ${selectedUser.name}` : ""
  }`;

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1>{text.pageTitle}</h1>
          <p>{text.intro}</p>
        </div>
      </div>

      <div className="row">
        <Segmented
          label={text.periodLabel}
          value={period}
          items={USAGE_PERIODS.map((p) => ({
            id: p,
            label: text.periods[p],
            href: href(p, selectedUserId),
          }))}
        />
        <Segmented
          label={text.userLabel}
          value={selectedUserId ?? "all"}
          items={[
            { id: "all", label: text.allUsers, href: href(period) },
            ...summary.byUser.map((u) => ({
              id: u.userId,
              label: u.name,
              href: href(period, u.userId),
            })),
          ]}
        />
      </div>

      <Card as="section" title={totalsTitle} titleId="usage-totals-title" className="stack-sm">
        {summary.since ? (
          <p className="muted">{text.since(formatDateTime(summary.since))}</p>
        ) : null}
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
      </Card>

      {/* 가로 스크롤 영역은 키보드로도 닿아야 한다(AUDIT U2, WCAG 2.1.1). */}
      <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="usage-by-user">
        <table className="table">
          <caption id="usage-by-user">{text.byUser}</caption>
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
            {summary.byUser.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  {text.empty}
                </td>
              </tr>
            ) : (
              summary.byUser.map((u) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="usage-by-feature">
        <table className="table">
          <caption id="usage-by-feature">{text.byFeature}</caption>
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

      <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="usage-recent">
        <table className="table">
          <caption id="usage-recent">{text.recent(summary.recent.length)}</caption>
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
                  <td>{formatTokens(r.latencyMs)}ms</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
