import { createRemoteJWKSet, jwtVerify } from "jose";
import { HttpError } from "@/lib/http-error";

let keys: ReturnType<typeof createRemoteJWKSet> | undefined;
let keyIssuer: string | undefined;

// Never trust the email header alone. Verify signature, expiry, issuer and audience.
export async function verifyAccess(headers: Headers, email?: string): Promise<string | null> {
  if (process.env.LEO_REQUIRE_ACCESS !== "1") return null;
  const issuer = process.env.CF_ACCESS_ISSUER;
  const audience = process.env.CF_ACCESS_AUD;
  const token = headers.get("cf-access-jwt-assertion");
  if (!issuer || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !audience || !token) {
    throw new HttpError(403, "초대된 이메일로 접속해 주세요.", "access_denied");
  }
  try {
    if (!keys || keyIssuer !== issuer) {
      keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
      keyIssuer = issuer;
    }
    const { payload } = await jwtVerify(token, keys, {
      issuer, audience, algorithms: ["RS256"], requiredClaims: ["exp", "iat", "email"],
    });
    if (typeof payload.email !== "string" || (email && payload.email.toLowerCase() !== email.toLowerCase())) throw new Error("identity mismatch");
    return payload.email.toLowerCase();
  } catch {
    throw new HttpError(403, "초대된 이메일로 다시 인증해 주세요.", "access_denied");
  }
}
