import Link from "next/link";
import { Card } from "@/components/ui";
import { Logo } from "@/components/brand/logo";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { getLocale, t } from "@/i18n";
import ResetPasswordForm from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const locale = await getLocale();

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="relative flex items-center justify-center">
          <Logo size={44} />
          <LanguageSwitcher locale={locale} className="absolute right-0" />
        </div>
        <Card className="mt-6 p-7 sm:p-9">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
                {t(locale, "authResetInvalidTitle")}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {t(locale, "authResetInvalidBody")}
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-block text-sm font-medium text-brand-700 transition-colors duration-150 hover:text-brand-900 hover:underline"
              >
                {t(locale, "authResetNewLink")}
              </Link>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
