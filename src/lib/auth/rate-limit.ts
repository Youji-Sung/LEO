// 로그인 실패 횟수 제한(프로세스 메모리). 같은 IP·이메일 조합이 창(window) 안에 max 번 실패하면 창이 끝날 때까지 막는다.
// 단일 프로세스 전제(DECISIONS "단일 프로세스")와 같은 제약이다.

export type RateLimiter = {
  check: (key: string, now?: number) => { allowed: boolean; retryAfterMs: number };
  fail: (key: string, now?: number) => void;
  reset: (key: string) => void;
};

export function createRateLimiter(max: number, windowMs: number): RateLimiter {
  const hits = new Map<string, { count: number; first: number }>();
  const entry = (key: string, now: number) => {
    const e = hits.get(key);
    if (!e || now - e.first >= windowMs) return undefined;
    return e;
  };
  return {
    check(key, now = Date.now()) {
      const e = entry(key, now);
      if (!e || e.count < max) return { allowed: true, retryAfterMs: 0 };
      return { allowed: false, retryAfterMs: e.first + windowMs - now };
    },
    fail(key, now = Date.now()) {
      const e = entry(key, now);
      if (e) e.count += 1;
      else hits.set(key, { count: 1, first: now });
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (now - v.first >= windowMs) hits.delete(k);
      }
    },
    reset(key) {
      hits.delete(key);
    },
  };
}

export const loginLimiter = createRateLimiter(10, 15 * 60 * 1000);

// Cloudflare 터널 뒤에서는 cf-connecting-ip, 그 외 프록시는 x-forwarded-for 의 첫 값이 실제 클라이언트다.
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local"
  );
}
