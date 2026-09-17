"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";
import { Logo } from "@/components/brand/logo";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Ro'yxatdan o'tishda xatolik");
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
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
            Ro&apos;yxatdan o&apos;tish
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Yangi hisob yarating va o&apos;qishni boshlang
          </p>
        </div>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <Label>To&apos;liq ism</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ism Familiya"
              autoComplete="name"
              required
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="email@ttpu.uz"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label>Parol</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Kamida 6 belgi"
              autoComplete="new-password"
              minLength={6}
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
            {loading ? "Yaratilmoqda..." : "Hisob yaratish"}
          </Button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">
          Hisobingiz bormi?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-700 transition-colors duration-150 hover:text-brand-900 hover:underline"
          >
            Kirish
          </Link>
        </p>
      </Card>
    </main>
  );
}
