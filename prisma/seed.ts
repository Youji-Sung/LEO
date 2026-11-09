import "dotenv/config";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

const USERS = [
  { email: "dev1@leo.local", name: "개발자 1" },
  { email: "dev2@leo.local", name: "개발자 2" },
];

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.LEO_PRODUCTION === "1" || process.env.LEO_INVITE_ONLY === "1") {
    throw new Error("운영 환경에서 개발 계정을 만들 수 없습니다. npm run users를 사용하세요.");
  }
  const password = process.env.SEED_USER_PASSWORD || "leo-pass-1234";
  const passwordHash = await hashPassword(password);
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash },
      create: { ...u, passwordHash, settings: { create: {} } },
    });
  }
  console.log(`[seed] 사용자 ${USERS.length}명 준비 (${USERS.map((u) => u.email).join(", ")})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
