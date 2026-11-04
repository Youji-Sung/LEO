import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "@/lib/auth/rate-limit";

describe("createRateLimiter", () => {
  it("max 번 실패하기 전까지 허용하고, 그 뒤 창이 끝날 때까지 막는다", () => {
    const rl = createRateLimiter(3, 1000);
    const t0 = 10_000;
    expect(rl.check("k", t0).allowed).toBe(true);
    rl.fail("k", t0);
    rl.fail("k", t0 + 10);
    expect(rl.check("k", t0 + 20).allowed).toBe(true);
    rl.fail("k", t0 + 30);
    const blocked = rl.check("k", t0 + 40);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(960);
    expect(rl.check("k", t0 + 1000).allowed).toBe(true);
  });

  it("성공하면 초기화되고, 키가 다르면 서로 영향이 없다", () => {
    const rl = createRateLimiter(1, 1000);
    rl.fail("a", 0);
    expect(rl.check("a", 1).allowed).toBe(false);
    expect(rl.check("b", 1).allowed).toBe(true);
    rl.reset("a");
    expect(rl.check("a", 2).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("cf-connecting-ip, x-forwarded-for 첫 값, 없으면 local 순으로 고른다", () => {
    expect(clientIp(new Headers({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-forwarded-for": "3.3.3.3, 10.0.0.1" }))).toBe("3.3.3.3");
    expect(clientIp(new Headers())).toBe("local");
  });
});
