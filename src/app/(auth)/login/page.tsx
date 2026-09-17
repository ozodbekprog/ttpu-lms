"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            TTPU LMS
          </p>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">Tizimga kirish</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
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
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Kirilmoqda..." : "Kirish"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Hisobingiz yo'qmi?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Ro'yxatdan o'tish
          </Link>
        </p>
      </Card>
    </main>
  );
}
