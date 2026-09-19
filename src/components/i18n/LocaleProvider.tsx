"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/uz";

type I18nValue = {
  locale: Locale;
  t: (key: keyof Dictionary) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function LocaleProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({ locale, t: (key) => dictionary[key] }),
    [locale, dictionary],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within LocaleProvider");
  return context;
}
