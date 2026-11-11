import { spawn } from "node:child_process";
import { assertProductionConfig } from "../src/lib/production-config";
import { recoverInterruptedReports } from "../src/services/report";
import { prisma } from "../src/lib/db";

async function main() {
  if (Number(process.versions.node.split(".")[0]) < 24) throw new Error("Node 24 이상이 필요합니다.");
  if (process.env.LEO_DEPLOYMENT_PROFILE === "render-free") process.env.APP_URL = process.env.RENDER_EXTERNAL_URL;
  assertProductionConfig();
  await prisma.$queryRaw`SELECT 1`;
  if (process.env.LEO_CANDIDATE !== "1") await recoverInterruptedReports(process.env.LEO_DEPLOYMENT_PROFILE === "render-free");
  await prisma.$disconnect();
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", process.env.PORT || "3000"], { stdio: "inherit", env: process.env });
  for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => child.kill(signal));
  child.on("error", () => { console.error("서버 시작 실패"); process.exitCode = 1; });
  child.on("exit", (code) => { process.exitCode = code ?? 1; });
}
main().catch((e) => { console.error(e instanceof Error ? e.message : "운영 설정 확인 실패"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
