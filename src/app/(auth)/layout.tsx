import { getDictionary, getLocale } from "@/i18n";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <LocaleProvider locale={locale} dictionary={getDictionary(locale)}>
      {children}
    </LocaleProvider>
  );
}
