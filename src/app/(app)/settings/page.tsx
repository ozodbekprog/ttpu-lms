import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import SettingsManager from "@/components/settings/SettingsManager";
import { normalizeUserPreferences } from "@/components/settings/preferences";
import { isTelegramLinked } from "./telegram-link";

export default async function SettingsPage() {
  const user = await requireUser();
  const preferences = normalizeUserPreferences(user.preferences);
  const telegramLinked = await isTelegramLinked(user.email);

  return (
    <>
      <PageHeader
        eyebrow="Hisob"
        title="Sozlamalar"
        subtitle="Bildirishnomalar, ko'rinish va aloqa"
      />
      <SettingsManager
        initialPreferences={preferences}
        email={user.email}
        telegramLinked={telegramLinked}
      />
    </>
  );
}
