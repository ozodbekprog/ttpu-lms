import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { uz, type Dictionary } from "./uz";
import { ru } from "./ru";
import { en } from "./en";

const dictionaries: Record<Locale, Dictionary> = { uz, ru, en };

export { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, LOCALE_MAX_AGE, isLocale } from "./config";
export type { Locale } from "./config";
export type { Dictionary } from "./uz";

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function t(locale: Locale, key: keyof Dictionary): string {
  return dictionaries[locale][key];
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
