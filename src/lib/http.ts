import type { NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getRequestUser } from "@/lib/auth/current-user";
import type { SessionUser } from "@/lib/auth/session";
import { errors } from "@/content/ko";
import { HttpError } from "@/lib/http-error";
import { verifyAccess } from "@/lib/auth/access";
export { HttpError } from "@/lib/http-error";

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function errorResponse(status: number, message: string, code?: string): Response {
  return Response.json({ error: { message, code } }, { status });
}

export async function requireRequestUser(req: NextRequest): Promise<SessionUser> {
  const user = await getRequestUser(req);
  if (!user) throw new HttpError(401, errors.unauthorized, "unauthorized");
  return user;
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    const reader = req.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 512 * 1024) {
          await reader.cancel();
          throw new HttpError(413, "입력 내용이 너무 큽니다.", "body_too_large");
        }
        chunks.push(value);
      }
    }
    raw = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, errors.badJson, "bad_json");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new HttpError(
      400,
      first ? errors.validationField(first.path.join(".") || "입력", first.message) : errors.validation,
      "validation",
    );
  }
  return result.data;
}

// Route Handler 를 감싸 HttpError 와 예상 못 한 오류를 JSON 응답으로 바꾼다.
export function handler<Ctx>(
  fn: (req: NextRequest, ctx: Ctx) => Promise<Response>,
): (req: NextRequest, ctx: Ctx) => Promise<Response> {
  return async (req, ctx) => {
    try {
      await verifyAccess(req.headers);
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        const origin = req.headers.get("origin");
        const expected = new URL(process.env.APP_URL || req.url).origin;
        if ((origin && origin !== expected) || req.headers.get("sec-fetch-site") === "cross-site" ||
          (process.env.LEO_PRODUCTION === "1" && !origin)) {
          throw new HttpError(403, "허용되지 않은 요청 출처입니다.", "invalid_origin");
        }
      }
      const res = await fn(req, ctx);
      res.headers.set("Cache-Control", "private, no-store");
      return res;
    } catch (err) {
      if (err instanceof HttpError) return errorResponse(err.status, err.message, err.code);
      if (err instanceof ZodError) return errorResponse(400, errors.validation, "validation");
      console.error(err);
      return errorResponse(500, errors.internal, "internal");
    }
  };
}
