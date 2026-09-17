"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label } from "@/components/ui";

type ApiResult = { ok?: boolean; error?: string } | null;

export function ProfileForm({
  initialName,
  initialAvatarUrl,
}: {
  initialName: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const json = (await res.json().catch(() => null)) as ApiResult;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Saqlashda xatolik yuz berdi");
        return;
      }
      setSuccess("Profil saqlandi");
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Profil ma'lumotlari" subtitle="Ism va avatar havolasini o'zgartiring" />
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Ism</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Ozodbek Hoshimov"
              required
              minLength={2}
              maxLength={80}
            />
          </div>
          <div>
            <Label>Avatar havolasi</Label>
            <Input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
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
            {busy ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
