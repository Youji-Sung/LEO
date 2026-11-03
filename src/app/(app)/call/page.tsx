import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { CallSetupForm } from "@/components/call/CallSetupForm";
import { THEMES } from "@/services/claude/prompts/themes";
import { allowShortCalls, CALL_DURATION_OPTIONS_MIN, DEFAULT_CALL_MINUTES } from "@/services/call/duration";

export const metadata = { title: "전화 영어 — LEO" };

export default async function CallSetupPage() {
  const user = await requireUser();
  const [settings, portfolios] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
    prisma.portfolio.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
  ]);
  const themes = Object.values(THEMES).map((t) => ({ id: t.id, label: t.label, description: t.description }));
  const durationOptions: number[] = [...CALL_DURATION_OPTIONS_MIN];
  if (allowShortCalls()) durationOptions.push(0);
  return (
    <>
      <h1>전화 영어</h1>
      <p className="muted">테마를 고르고 마이크를 확인한 뒤 통화를 시작합니다. 상대의 말은 음성으로 읽어 주고, 내 말은 음성 인식으로 받아 적습니다.</p>
      <CallSetupForm
        themes={themes}
        portfolios={portfolios}
        defaultMinutes={settings?.defaultCallMinutes ?? DEFAULT_CALL_MINUTES}
        durationOptions={durationOptions}
      />
    </>
  );
}
