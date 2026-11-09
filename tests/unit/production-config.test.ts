import { expect, it } from "vitest";
import { assertProductionConfig } from "@/lib/production-config";
const valid = {
  LEO_PRODUCTION: "1", LEO_INVITE_ONLY: "1", LEO_ALLOW_SIGNUP: "0", CLAUDE_MOCK: "0", LEO_REQUIRE_ACCESS: "1",
  APP_URL: "https://leo.company.test", CF_ACCESS_ISSUER: "https://team.cloudflareaccess.com", CF_ACCESS_AUD: "a".repeat(64),
  AUTH_SECRET: "b".repeat(64), LEO_HEALTH_TOKEN: "c".repeat(64), LEO_ANTHROPIC_API_KEY: "d".repeat(64),
  DATABASE_URL: "file:/data/leo.db", LEO_API_MONTHLY_USD: "200", LEO_API_USER_DAILY_USD: "20", LEO_API_CONCURRENCY: "5", LEO_BILLING_LIMIT_CONFIRMED: "1",
};
it("accepts explicit closed-production settings", () => expect(() => assertProductionConfig(valid)).not.toThrow());
it.each(Object.keys(valid))("rejects a missing required value: %s", (key) => {
  const env: Record<string, string | undefined> = { ...valid }; delete env[key];
  expect(() => assertProductionConfig(env)).toThrow();
});
it.each(["http://leo.company.test", "https://random.trycloudflare.com", "https://example.com"])("rejects an unsuitable origin %s", (APP_URL) => {
  expect(() => assertProductionConfig({ ...valid, APP_URL })).toThrow();
});
