import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { CallSetupForm } from "@/components/call/CallSetupForm";
import { callSetup, common } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { allowShortCalls, CALL_DURATION_OPTIONS_MIN, DEFAULT_CALL_MINUTES } from "@/services/call/duration";

export const metadata = { title: common.pageTitle(callSetup.pageTitle) };

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
      <h1>{callSetup.pageTitle}</h1>
      <p className="muted">{callSetup.intro}</p>
      <CallSetupForm
        themes={themes}
        portfolios={portfolios}
        defaultMinutes={settings?.defaultCallMinutes ?? DEFAULT_CALL_MINUTES}
        durationOptions={durationOptions}
      />
    </>
  );
}
