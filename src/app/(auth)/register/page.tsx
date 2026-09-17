"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            TTPU LMS
          </p>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">Ro'yxatdan o'tish</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>To'liq ism</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ism Familiya"
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
              minLength={6}
              required
            />
          </div>
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Yaratilmoqda..." : "Hisob yaratish"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Kirish
          </Link>
        </p>
      </Card>
    </main>
  );
}
