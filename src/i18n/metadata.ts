import type { Metadata } from "next";
import type { Locale } from "./config";
import { getDictionary } from "./index";
import type { Dictionary } from "./uz";

const SITE_NAME = "TTPU LMS";

const OG_LOCALES: Record<Locale, string> = {
  uz: "uz_UZ",
  ru: "ru_RU",
  en: "en_US",
};

export function buildAuthMetadata(
  locale: Locale,
  titleKey: keyof Dictionary,
  descriptionKey: keyof Dictionary,
): Metadata {
  const dictionary = getDictionary(locale);
  const title = dictionary[titleKey];
  const description = dictionary[descriptionKey];
  const fullTitle = `${title} — ${SITE_NAME}`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: fullTitle,
      description,
      siteName: SITE_NAME,
      type: "website",
      locale: OG_LOCALES[locale],
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}
