"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";
import { Logo } from "@/components/brand/logo";

const PANEL_FEATURES = [
  "Shaxsiy kabinet va dars jadvali darhol ochiladi",
  "GPA, baholar va transkript avtomatik hisoblanadi",
  "Telegram bot orqali barcha eslatmalar yetib boradi",
];

const PANEL_STEPS = [
  { number: "01", title: "Hisob", description: "30 soniyada yaratiladi" },
  { number: "02", title: "Profil", description: "Guruh va fakultet tanlanadi" },
  { number: "03", title: "O'qish", description: "Kurslar avtomatik biriktiriladi" },
];

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
            Bir daqiqada hisob yarating va o&apos;qishni boshlang
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-brand-200">
            Ro&apos;yxatdan o&apos;tish bepul va bir necha maydondan iborat. Qolganini
            platforma o&apos;zi bajaradi.
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
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative space-y-4 border-t border-white/10 pt-8">
          {PANEL_STEPS.map((step) => (
            <div key={step.number} className="flex items-center gap-4">
              <span className="text-xs font-semibold tracking-[0.14em] text-gold-400">
                {step.number}
              </span>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 border-b border-white/10 pb-4">
                <p className="text-sm font-medium text-white">{step.title}</p>
                <p className="text-xs text-brand-300">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center lg:hidden">
            <Logo size={44} />
          </div>
          <Card className="mt-6 p-7 sm:p-9 lg:mt-0">
            <div className="text-center">
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
          <p className="mt-6 text-center text-xs text-slate-400">
            Hisob yaratish orqali siz foydalanish shartlari va maxfiylik siyosatiga
            rozilik bildirasiz.
          </p>
        </div>
      </section>
    </main>
  );
}
