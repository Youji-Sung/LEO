import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const expected = process.env.LEO_HEALTH_TOKEN || "";
  const supplied = req.headers.get("x-leo-health") || "";
  if (!expected || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return new Response(null, { status: 404 });
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return new Response(null, { status: 503 }); }
}
