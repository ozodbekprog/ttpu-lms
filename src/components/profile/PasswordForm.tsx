"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Label } from "@/components/ui";

type ApiResult = { ok?: boolean; error?: string } | null;

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Yangi parollar mos emas");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = (await res.json().catch(() => null)) as ApiResult;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Parolni saqlashda xatolik yuz berdi");
        return;
      }
      setSuccess("Parol yangilandi");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Parolni o'zgartirish" subtitle="Kamida 6 ta belgidan iborat yangi parol" />
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Joriy parol</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Yangi parol</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                maxLength={100}
              />
            </div>
            <div>
              <Label>Yangi parol (tasdiqlash)</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                maxLength={100}
              />
            </div>
          </div>
          {error ? (
            <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {success}
            </p>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Saqlanmoqda..." : "Parolni yangilash"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
