export function assertProductionConfig(env: Record<string, string | undefined> = process.env): void {
  const fail = (name: string): never => { throw new Error(`정식 운영 설정이 필요합니다: ${name}`); };
  const free = env.LEO_DEPLOYMENT_PROFILE === "render-free";
  if (env.LEO_DEPLOYMENT_PROFILE && !["render-free", "private-tunnel"].includes(env.LEO_DEPLOYMENT_PROFILE)) fail("LEO_DEPLOYMENT_PROFILE");
  for (const key of ["LEO_PRODUCTION", "LEO_INVITE_ONLY"]) if (env[key] !== "1") fail(key);
  if (env.LEO_REQUIRE_ACCESS !== (free ? "0" : "1")) fail("LEO_REQUIRE_ACCESS");
  if (env.LEO_ALLOW_SIGNUP !== "0") fail("LEO_ALLOW_SIGNUP=0");
  if (env.CLAUDE_MOCK !== "0") fail("CLAUDE_MOCK=0");
  for (const key of ["AUTH_SECRET", "LEO_HEALTH_TOKEN", "LEO_ANTHROPIC_API_KEY", ...(free ? ["TURSO_AUTH_TOKEN"] : ["CF_ACCESS_AUD"])]) {
    if (!env[key] || env[key]!.length < 32 || /CHANGE_ME|example|test-secret/i.test(env[key]!)) fail(key);
  }
  if (!free && !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.CF_ACCESS_ISSUER || "")) fail("CF_ACCESS_ISSUER");
  let url: URL;
  try { url = new URL(env.APP_URL || ""); } catch { fail("APP_URL"); }
  if (url!.protocol !== "https:" || url!.username || url!.password || url!.pathname !== "/" || url!.search || url!.hash || /localhost|trycloudflare\.com$|example\.(com|org|net)$/.test(url!.hostname)) fail("APP_URL: 구매한 HTTPS 도메인");
  if (free) {
    if (env.RENDER !== "true" || env.RENDER_EXTERNAL_URL !== url!.origin || !/^[a-z0-9-]+\.onrender\.com$/.test(url!.hostname)) fail("RENDER_EXTERNAL_URL: Render의 고정 HTTPS 주소");
    if (!/^libsql:\/\/(?:[a-z0-9-]+\.)+turso\.io\/?$/.test(env.DATABASE_URL || "")) fail("DATABASE_URL: Turso 영구 DB");
  } else if (!env.DATABASE_URL?.startsWith("file:/data/")) fail("DATABASE_URL: /data 영구 디스크");
  for (const key of ["LEO_API_MONTHLY_USD", "LEO_API_USER_DAILY_USD", "LEO_API_CONCURRENCY"]) {
    if (!Number.isFinite(Number(env[key])) || Number(env[key]) <= 0) fail(key);
  }
  if (env.LEO_BILLING_LIMIT_CONFIRMED !== "1") fail("LEO_BILLING_LIMIT_CONFIRMED: 공급자 측 비용 한도 확인");
}
