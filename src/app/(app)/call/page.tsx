import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { CallSetupForm } from "@/components/call/CallSetupForm";
import { callSetup, common } from "@/content/ko";
import { THEMES } from "@/services/claude/prompts/themes";
import { learningSnapshot } from "@/services/learning";
import {
  allowShortCalls,
  CALL_DURATION_OPTIONS_MIN,
  DEFAULT_CALL_MINUTES,
} from "@/services/call/duration";

export const metadata = { title: common.pageTitle(callSetup.pageTitle) };

export default async function CallSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ learn?: string }>;
}) {
  const user = await requireUser();
  const learn = (await searchParams).learn;
  const targets =
    typeof learn === "string"
      ? await learningSnapshot(user.id, learn.split(",").slice(0, 3)).catch(() => [])
      : [];
  const [settings, portfolios] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
    prisma.portfolio.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);
  const themes = Object.values(THEMES).map((t) => ({
    id: t.id,
    label: t.label,
    description: t.description,
  }));
  const durationOptions: number[] = [...CALL_DURATION_OPTIONS_MIN];
  if (allowShortCalls()) durationOptions.push(0);
  return (
    <div className="container-narrow" style={{ margin: 0 }}>
      <div className="page-head">
        <div>
          <h1>{callSetup.pageTitle}</h1>
          <p>{callSetup.intro}</p>
        </div>
      </div>
      <CallSetupForm
        learningItemIds={targets.map((target) => target.id)}
        learningPhrases={targets.map((target) => target.phrase)}
        themes={themes}
        portfolios={portfolios}
        defaultMinutes={settings?.defaultCallMinutes ?? DEFAULT_CALL_MINUTES}
        durationOptions={durationOptions}
      />
    </div>
  );
}
