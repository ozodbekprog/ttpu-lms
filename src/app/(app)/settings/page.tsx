import { requireUser } from "@/lib/auth";
import { Card, CardBody, PageHeader } from "@/components/ui";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import SettingsManager from "@/components/settings/SettingsManager";
import { normalizeUserPreferences } from "@/components/settings/preferences";
import { getLocale, t } from "@/i18n";
import { isTelegramLinked } from "./telegram-link";

export default async function SettingsPage() {
  const user = await requireUser();
  const preferences = normalizeUserPreferences(user.preferences);
  const telegramLinked = await isTelegramLinked(user.email);
  const locale = await getLocale();

  return (
    <>
      <PageHeader
        eyebrow={t(locale, "settingsEyebrow")}
        title={t(locale, "settingsTitle")}
        subtitle={t(locale, "settingsSubtitle")}
      />
      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold tracking-tight text-brand-950">
              {t(locale, "commonLanguage")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {t(locale, "commonLanguageHint")}
            </p>
          </div>
          <LanguageSwitcher locale={locale} />
        </CardBody>
      </Card>
      <SettingsManager
        initialPreferences={preferences}
        email={user.email}
        telegramLinked={telegramLinked}
      />
    </>
  );
}
