export function assertProductionConfig(env: Record<string, string | undefined> = process.env): void {
  const fail = (name: string): never => { throw new Error(`정식 운영 설정이 필요합니다: ${name}`); };
  for (const key of ["LEO_PRODUCTION", "LEO_INVITE_ONLY", "LEO_REQUIRE_ACCESS"]) if (env[key] !== "1") fail(key);
  if (env.LEO_ALLOW_SIGNUP !== "0") fail("LEO_ALLOW_SIGNUP=0");
  if (env.CLAUDE_MOCK !== "0") fail("CLAUDE_MOCK=0");
  for (const key of ["AUTH_SECRET", "LEO_HEALTH_TOKEN", "LEO_ANTHROPIC_API_KEY", "CF_ACCESS_AUD"]) {
    if (!env[key] || env[key]!.length < 32 || /CHANGE_ME|example|test-secret/i.test(env[key]!)) fail(key);
  }
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.CF_ACCESS_ISSUER || "")) fail("CF_ACCESS_ISSUER");
  let url: URL;
  try { url = new URL(env.APP_URL || ""); } catch { fail("APP_URL"); }
  if (url!.protocol !== "https:" || url!.username || url!.password || url!.pathname !== "/" || url!.search || url!.hash || /localhost|trycloudflare\.com$|example\.(com|org|net)$/.test(url!.hostname)) fail("APP_URL: 구매한 HTTPS 도메인");
  if (!env.DATABASE_URL?.startsWith("file:/data/")) fail("DATABASE_URL: /data 영구 디스크");
  for (const key of ["LEO_API_MONTHLY_USD", "LEO_API_USER_DAILY_USD", "LEO_API_CONCURRENCY"]) {
    if (!Number.isFinite(Number(env[key])) || Number(env[key]) <= 0) fail(key);
  }
  if (env.LEO_BILLING_LIMIT_CONFIRMED !== "1") fail("LEO_BILLING_LIMIT_CONFIRMED: 공급자 측 비용 한도 확인");
}
