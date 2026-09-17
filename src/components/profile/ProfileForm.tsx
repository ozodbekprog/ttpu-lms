"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label, Textarea } from "@/components/ui";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { CoverUpload } from "@/components/profile/CoverUpload";

const BIO_MAX = 300;

type ApiResult = { ok?: boolean; error?: string } | null;

export function ProfileForm({
  initialName,
  initialBio,
  avatarUrl,
}: {
  initialName: string;
  initialBio: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio ?? "");
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
        body: JSON.stringify({ name, bio }),
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
      <CardHeader title="Profilni tahrirlash" subtitle="Avatar, muqova, ism va bio" />
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="flex flex-wrap items-center gap-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-4">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Avatar</span>
              <AvatarUpload name={initialName} src={avatarUrl} size={72} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-500">Muqova</span>
              <CoverUpload />
            </div>
          </div>
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
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <Label className="mb-0">Bio</Label>
              <span className="text-xs tabular-nums text-slate-400">
                {bio.length}/{BIO_MAX}
              </span>
            </div>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={BIO_MAX}
              rows={4}
              placeholder="O'zingiz haqingizda qisqacha..."
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
