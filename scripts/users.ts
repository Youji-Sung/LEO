import "dotenv/config";
import { prisma } from "../src/lib/db";
import { issueAccount, setAccountStatus } from "../src/services/accounts";

async function main() {
  const [command, email, name] = process.argv.slice(2);
  if (command === "list") {
    console.table(await prisma.user.findMany({ select: { email: true, name: true, status: true, provisioned: true, role: true }, orderBy: { createdAt: "asc" } }));
  } else if ((command === "issue" || command === "reset") && email) {
    const origin = new URL(process.env.APP_URL || "http://localhost:3000").origin;
    const { token, expiresAt } = await issueAccount(email, name || email, command === "reset", process.argv.includes("--admin"));
    // Fragment is never sent in an HTTP request or a Referer header. Show once, not in audit logs.
    console.log(`24시간 내 한 번 사용할 초대 링크 (수신자에게 개인적으로 전달):\n${origin}/activate#${token}\n만료: ${expiresAt.toISOString()}`);
  } else if ((command === "suspend" || command === "resume") && email) {
    await setAccountStatus(email, command === "suspend");
    console.log("계정 상태를 변경하고 기존 세션을 모두 회수했습니다.");
  } else {
    throw new Error('사용법: npm run users -- issue email "이름" [--admin] | reset email | suspend email | resume email | list');
  }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : "계정 작업 실패"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
