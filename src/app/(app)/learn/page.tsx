import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { listLearning } from "@/services/learning";
import { LearningSpace } from "@/components/learning/LearningSpace";
export const metadata = { title: "표현 익히기 — LEO" };
export default async function LearningPage() {
  const user = await requireUser();
  const [items, settings] = await Promise.all([
    listLearning(user.id),
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
  ]);
  return (
    <LearningSpace
      initialItems={items}
      now={new Date().toISOString()}
      voice={settings?.ttsVoice ?? null}
    />
  );
}
