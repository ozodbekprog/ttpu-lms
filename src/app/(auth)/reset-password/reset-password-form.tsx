"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { useI18n } from "@/components/i18n/LocaleProvider";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError(t("authResetErrorShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("authResetErrorMismatch"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? t("authResetError"));
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1500);
    } catch {
      setError(t("commonNetworkError"));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
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
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-brand-950">
          {t("authResetDoneTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t("authResetDoneSubtitle")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
          {t("authResetTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {t("authResetSubtitle")}
        </p>
      </div>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <Label>{t("authResetPasswordLabel")}</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("authResetPasswordPlaceholder")}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <Label>{t("authResetConfirmLabel")}</Label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t("authPasswordPlaceholder")}
            autoComplete="new-password"
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
          {loading ? t("authResetSubmitting") : t("authResetSubmit")}
        </Button>
      </form>
    </>
  );
}
