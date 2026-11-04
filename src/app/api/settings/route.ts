import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, parseBody, requireRequestUser } from "@/lib/http";
import { CALL_DURATION_OPTIONS_MIN } from "@/services/call/duration";
import { errors } from "@/content/ko";
import { THEME_MODES, themeCookieHeader } from "@/lib/theme";

const schema = z.object({
  hintsDefault: z.boolean().optional(),
  ttsVoice: z.string().max(200).nullable().optional(),
  defaultCallMinutes: z
    .number()
    .int()
    .refine(
      (n) => (CALL_DURATION_OPTIONS_MIN as readonly number[]).includes(n),
      errors.settings.badMinutes,
    )
    .optional(),
  theme: z.enum(THEME_MODES).optional(),
});

export const GET = handler(async (req: NextRequest) => {
  const user = await requireRequestUser(req);
  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  return Response.json({ settings });
});

export const PATCH = handler(async (req: NextRequest) => {
  const user = await requireRequestUser(req);
  const body = await parseBody(req, schema);
  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: body,
    create: { userId: user.id, ...body },
  });
  // 테마는 쿠키에도 둬서 다음 요청의 서버 렌더가 바로 반영한다.
  const headers = body.theme ? { "Set-Cookie": themeCookieHeader(body.theme) } : undefined;
  return Response.json({ settings }, { headers });
});
