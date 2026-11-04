import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { common, settings as text } from "@/content/ko";
import { isThemeMode } from "@/lib/theme";
import { CALL_DURATION_OPTIONS_MIN } from "@/services/call/duration";
import { cookies } from "next/headers";
import { DIRECTION_COOKIE, resolveDirection } from "@/lib/direction";

export const metadata = { title: common.pageTitle(text.pageTitle) };

export default async function SettingsPage() {
  const user = await requireUser();
  const direction = resolveDirection((await cookies()).get(DIRECTION_COOKIE)?.value) ?? "basic";
  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  return (
    <div className="container-narrow" style={{ margin: 0 }}>
      <div className="page-head">
        <h1>{text.pageTitle}</h1>
      </div>
      <SettingsForm
        initial={{
          hintsDefault: settings.hintsDefault,
          ttsVoice: settings.ttsVoice,
          defaultCallMinutes: settings.defaultCallMinutes,
          theme: isThemeMode(settings.theme) ? settings.theme : "system",
        }}
        durationOptions={[...CALL_DURATION_OPTIONS_MIN]}
        direction={direction}
      />
    </div>
  );
}
