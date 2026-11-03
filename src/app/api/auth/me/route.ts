import type { NextRequest } from "next/server";
import { handler, requireRequestUser } from "@/lib/http";

export const GET = handler(async (req: NextRequest) => {
  const user = await requireRequestUser(req);
  return Response.json({ user });
});
