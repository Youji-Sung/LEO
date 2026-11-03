import "dotenv/config";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

const USERS = [
  { email: "dev1@leo.local", name: "개발자 1" },
  { email: "dev2@leo.local", name: "개발자 2" },
];

async function main() {
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
