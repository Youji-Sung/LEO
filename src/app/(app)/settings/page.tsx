import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { CALL_DURATION_OPTIONS_MIN } from "@/services/call/duration";

export const metadata = { title: "설정 — LEO" };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await prisma.userSettings.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  return (
    <>
      <h1>설정</h1>
      <SettingsForm
        initial={{ hintsDefault: settings.hintsDefault, ttsVoice: settings.ttsVoice, defaultCallMinutes: settings.defaultCallMinutes }}
        durationOptions={[...CALL_DURATION_OPTIONS_MIN]}
      />
    </>
  );
}
