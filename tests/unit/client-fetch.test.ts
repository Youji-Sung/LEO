import { describe, expect, it } from "vitest";
import { ApiError, toApiError } from "@/lib/client-fetch";
import { errors } from "@/content/ko";

describe("toApiError", () => {
  it("carries the server error code and status", async () => {
    const res = new Response(JSON.stringify({ error: { message: "상한", code: "turn_cap" } }), { status: 429 });
    const err = await toApiError(res);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("turn_cap");
    expect(err.status).toBe(429);
    expect(err.message).toBe("상한");
  });

  it("falls back to a generic message for non-JSON bodies", async () => {
    const err = await toApiError(new Response("<html>", { status: 502 }));
    expect(err.code).toBeNull();
    expect(err.message).toBe(errors.requestFailed);
    expect(err.status).toBe(502);
  });
});
