"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";
import { Logo } from "@/components/brand/logo";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const { locale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? t("authForgotError"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("commonNetworkError"));
    } finally {
      setLoading(false);
    }
  }

  const sentParts = t("authForgotSentBody").split("{email}");

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="relative flex items-center justify-center">
          <Logo size={44} />
          <LanguageSwitcher locale={locale} className="absolute right-0" />
        </div>
        <Card className="mt-6 p-7 sm:p-9">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6"
                >
                  <path d="M4 5h16v14H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </span>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-brand-950">
                {t("authForgotSentTitle")}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {sentParts[0]}
                <span className="font-medium text-slate-700">{email}</span>
                {sentParts[1]}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm font-medium text-brand-700 transition-colors duration-150 hover:text-brand-900 hover:underline"
              >
                {t("authForgotBack")}
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
                  {t("authForgotTitle")}
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  {t("authForgotSubtitle")}
                </p>
              </div>
              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <div>
                  <Label>{t("authEmail")}</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("authEmailPlaceholder")}
                    autoComplete="email"
                    required
                  />
                </div>
                {error ? (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 size-4 shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </svg>
                    <p>{error}</p>
                  </div>
                ) : null}
                <Button type="submit" disabled={loading} size="lg" className="w-full">
                  {loading ? t("authForgotSubmitting") : t("authForgotSubmit")}
                </Button>
              </form>
              <p className="mt-7 text-center text-sm text-slate-500">
                {t("authForgotRemember")}{" "}
                <Link
                  href="/login"
                  className="font-medium text-brand-700 transition-colors duration-150 hover:text-brand-900 hover:underline"
                >
                  {t("authLoginLink")}
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
