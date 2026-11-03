import type { NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getRequestUser } from "@/lib/auth/current-user";
import type { SessionUser } from "@/lib/auth/session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function errorResponse(status: number, message: string, code?: string): Response {
  return Response.json({ error: { message, code } }, { status });
}

export async function requireRequestUser(req: NextRequest): Promise<SessionUser> {
  const user = await getRequestUser(req);
  if (!user) throw new HttpError(401, "로그인이 필요합니다.", "unauthorized");
  return user;
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "요청 본문이 JSON 이 아닙니다.", "bad_json");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new HttpError(400, first ? `${first.path.join(".") || "입력"}: ${first.message}` : "입력이 올바르지 않습니다.", "validation");
  }
  return result.data;
}

// Route Handler 를 감싸 HttpError 와 예상 못 한 오류를 JSON 응답으로 바꾼다.
export function handler<Ctx>(
  fn: (req: NextRequest, ctx: Ctx) => Promise<Response>,
): (req: NextRequest, ctx: Ctx) => Promise<Response> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return errorResponse(err.status, err.message, err.code);
      if (err instanceof ZodError) return errorResponse(400, "입력이 올바르지 않습니다.", "validation");
      console.error(err);
      return errorResponse(500, "서버 오류가 발생했습니다.", "internal");
    }
  };
}
