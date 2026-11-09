import "dotenv/config";
import { prisma } from "../src/lib/db";
import { withOperationsDb } from "../src/lib/sqlite-operations";
async function main() {
  const [command, id, amount] = process.argv.slice(2);
  if (command === "drain") {
    const busy = withOperationsDb((db) => db.transaction(() => {
      db.prepare('INSERT INTO "RuntimeControl" ("key", "value") VALUES (\'maintenance\', \'1\') ON CONFLICT("key") DO UPDATE SET "value" = \'1\'').run();
      const active = db.prepare('SELECT COUNT(*) AS n FROM "ApiReservation" WHERE "status" = \'active\'').get() as { n: number };
      const reports = db.prepare('SELECT COUNT(*) AS n FROM "ReportJob" WHERE "status" = \'generating\'').get() as { n: number };
      if (active.n + reports.n) db.prepare('UPDATE "RuntimeControl" SET "value" = \'0\' WHERE "key" = \'maintenance\'').run();
      return active.n + reports.n;
    }).immediate());
    if (busy) throw new Error("진행 중인 API 작업이 있습니다. 기존 서버를 유지합니다. 완료 후 다시 배포하세요.");
    console.log("새 AI 요청을 잠시 차단했습니다. 진행 중인 작업 없음.");
  } else if (command === "resume") {
    await prisma.runtimeControl.upsert({ where: { key: "maintenance" }, create: { key: "maintenance", value: "0" }, update: { value: "0" } });
  } else if (command === "budget") {
    console.table(await prisma.apiReservation.findMany({ where: { status: { in: ["active", "uncertain"] } } }));
  } else if (command === "reconcile" && id && amount !== undefined && Number.isFinite(Number(amount)) && Number(amount) >= 0) {
    await prisma.$transaction(async (tx) => {
      const held = await tx.apiReservation.findUniqueOrThrow({ where: { id } });
      if (held.status !== "uncertain") throw new Error("미확정 비용만 정산할 수 있습니다.");
      await tx.usageRecord.create({ data: { userId: held.userId, feature: held.feature, model: "billing-adjustment", inputTokens: 0, outputTokens: 0, costUsd: Number(amount), latencyMs: 0 } });
      await tx.apiReservation.update({ where: { id }, data: { status: "settled", amountMicros: 0 } });
      await tx.auditEvent.create({ data: { action: "budget.reconcile", userId: held.userId } });
    });
  } else throw new Error("사용법: npm run ops -- drain | resume | budget | reconcile <예약ID> <공급자에서 확인한 추가 비용USD>");
}
main().catch((e) => { console.error(e instanceof Error ? e.message : "운영 명령 실패"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
