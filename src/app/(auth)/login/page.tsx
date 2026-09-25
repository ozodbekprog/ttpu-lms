"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";
import { Logo } from "@/components/brand/logo";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { apiFetch } from "@/lib/api";

const DEMO_ACCOUNTS = [
  {
    roleKey: "authRoleStudent" as const,
    email: "ozodbek@ttpu.uz",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      </svg>
    ),
  },
  {
    roleKey: "authRoleTeacher" as const,
    email: "n.mahamatov@ttpu.uz",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="M2 3h20" />
        <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
        <path d="m7 21 5-5 5 5" />
      </svg>
    ),
  },
  {
    roleKey: "authRoleAdmin" as const,
    email: "admin@ttpu.uz",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

const PANEL_FEATURES = [
  "authLoginFeature1",
  "authLoginFeature2",
  "authLoginFeature3",
] as const;

const PANEL_STATS = [
  { value: "12k+", labelKey: "authLoginStatStudents" as const },
  { value: "450+", labelKey: "authLoginStatCourses" as const },
  { value: "98%", labelKey: "authLoginStatSatisfaction" as const },
];

function resolveSafeNext(value: string | null): string {
  if (!value || !value.startsWith("/")) return "/dashboard";
  try {
    const url = new URL(value, "https://internal.invalid");
    if (url.origin !== "https://internal.invalid") return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = resolveSafeNext(searchParams.get("next"));
  const { locale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(loginEmail: string, loginPassword: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? t("authLoginError"));
        return;
      }
      router.push(safeNext);
      router.refresh();
    } catch {
      setError(t("commonNetworkError"));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void login(email, password);
  }

  function demoLogin(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("ttpu1234");
    void login(demoEmail, "ttpu1234");
  }

  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand-950 lg:flex lg:flex-col lg:justify-between lg:gap-12 lg:p-12 xl:p-16">
        <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_90%_70%_at_20%_0%,black,transparent_80%)]" />
        <div className="pointer-events-none absolute -left-24 top-24 size-80 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-8 size-72 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="relative">
          <span className="inline-flex rounded-2xl bg-white p-2.5 shadow-lift">
            <Logo size={40} />
          </span>
          <h2 className="mt-10 max-w-md text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            {t("authLoginPanelTitle")}
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-brand-200">
            {t("authLoginPanelSubtitle")}
          </p>
          <ul className="mt-8 space-y-3.5">
            {PANEL_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-brand-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 size-4 shrink-0 text-gold-400"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {t(feature)}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
          {PANEL_STATS.map((stat) => (
            <div key={stat.labelKey}>
              <p className="text-2xl font-semibold tracking-tight text-white">{stat.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-brand-300">
                {t(stat.labelKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <Logo size={44} />
            </div>
            <LanguageSwitcher locale={locale} className="ml-auto" />
          </div>
          <Card className="mt-6 p-7 sm:p-9">
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
                {t("authLoginTitle")}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                {t("authLoginSubtitle")}
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
              <div>
                <Label>{t("authPassword")}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("authPasswordPlaceholder")}
                  autoComplete="current-password"
                  required
                />
                <div className="mt-2 flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-brand-700 transition-colors duration-150 hover:text-brand-900 hover:underline"
                  >
                    {t("authLoginForgot")}
                  </Link>
                </div>
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
                {loading ? t("authLoginSubmitting") : t("authLoginSubmit")}
              </Button>
            </form>
            <div className="mt-8">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  {t("authDemoTitle")}
                </span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => demoLogin(account.email)}
                    disabled={loading}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-3 transition-all duration-150 hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60"
                  >
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors duration-150 group-hover:bg-brand-100">
                      {account.icon}
                    </span>
                    <span className="text-xs font-medium text-slate-700 group-hover:text-brand-800">
                      {t(account.roleKey)}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                {t("authDemoHint")}
              </p>
            </div>
            <p className="mt-7 text-center text-sm text-slate-500">
              {t("authLoginNoAccount")}{" "}
              <Link
                href="/register"
                className="font-medium text-brand-700 transition-colors duration-150 hover:text-brand-900 hover:underline"
              >
                {t("authLoginRegister")}
              </Link>
            </p>
          </Card>
          <p className="mt-6 text-center text-xs text-slate-400">
            {t("authLoginTerms")}
          </p>
        </div>
      </section>
    </main>
  );
}
