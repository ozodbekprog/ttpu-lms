"use client";

import { LOCALES, LOCALE_COOKIE, LOCALE_MAX_AGE, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

function applyLocale(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_MAX_AGE}; samesite=lax`;
  location.reload();
}

export default function LanguageSwitcher({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  return (
    <div
      className={cn("inline-flex items-center gap-0.5 rounded-full bg-slate-100 p-1", className)}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => {
              if (code === locale) return;
              applyLocale(code);
            }}
            aria-pressed={active}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors duration-150",
              active
                ? "bg-white text-brand-800 shadow-sm"
                : "text-slate-500 hover:text-brand-700",
            )}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
