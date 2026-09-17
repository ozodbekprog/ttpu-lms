"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";
import { Logo } from "@/components/brand/logo";

const DEMO_ACCOUNTS = [
  {
    role: "Talaba",
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
    role: "O'qituvchi",
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
    role: "Admin",
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("ttpu1234");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Kirishda xatolik yuz berdi");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-surface to-surface px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--color-brand-100)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-brand-100)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent_75%)]" />
      <Card className="relative w-full max-w-md p-7 sm:p-9">
        <div className="flex justify-center">
          <Logo size={44} />
        </div>
        <div className="mt-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Tizimga kirish</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            TTPU LMS hisobingiz bilan davom eting
          </p>
        </div>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ttpu.uz"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label>Parol</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
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
            {loading ? "Kirilmoqda..." : "Kirish"}
          </Button>
        </form>
        <div className="mt-8">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Demo hisoblar
            </span>
            <span className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account.email)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-3 transition-all duration-150 hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors duration-150 group-hover:bg-brand-100">
                  {account.icon}
                </span>
                <span className="text-xs font-medium text-slate-700 group-hover:text-brand-800">
                  {account.role}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Bosilganda demo email va parol avtomatik to&apos;ldiriladi
          </p>
        </div>
        <p className="mt-7 text-center text-sm text-slate-500">
          Hisobingiz yo&apos;qmi?{" "}
          <Link
            href="/register"
            className="font-medium text-brand-700 transition-colors duration-150 hover:text-brand-900 hover:underline"
          >
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </p>
      </Card>
    </main>
  );
}
