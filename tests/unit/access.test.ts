import { afterEach, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyAccess } from "@/lib/auth/access";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("validates the signature, expiry, audience and email, not a forged email header", async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  const issuer = "https://leo-verification.cloudflareaccess.com";
  vi.stubEnv("LEO_REQUIRE_ACCESS", "1"); vi.stubEnv("CF_ACCESS_ISSUER", issuer); vi.stubEnv("CF_ACCESS_AUD", "leo-test-audience");
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ keys: [{ ...jwk, kid: "test", alg: "RS256" }] })));
  const sign = (audience: string, expiry: string | number = "1h") => new SignJWT({ email: "owner@test.local" }).setProtectedHeader({ alg: "RS256", kid: "test" }).setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime(expiry).sign(privateKey);
  const token = await sign("leo-test-audience");
  expect(await verifyAccess(new Headers({ "cf-access-jwt-assertion": token }), "owner@test.local")).toBe("owner@test.local");
  await expect(verifyAccess(new Headers({ "cf-access-authenticated-user-email": "owner@test.local" }))).rejects.toMatchObject({ status: 403 });
  await expect(verifyAccess(new Headers({ "cf-access-jwt-assertion": token }), "other@test.local")).rejects.toMatchObject({ status: 403 });
  for (const invalid of [await sign("wrong-audience"), await sign("leo-test-audience", 1), `${token.slice(0, -20)}tampered-signature`]) {
    await expect(verifyAccess(new Headers({ "cf-access-jwt-assertion": invalid }))).rejects.toMatchObject({ status: 403 });
  }
});
