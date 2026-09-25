"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { CoverUpload } from "@/components/profile/CoverUpload";
import { apiFetch } from "@/lib/api";

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

  const bioRatio = bio.length / BIO_MAX;
  const bioPercent = Math.min(100, Math.round(bioRatio * 100));
  const bioNearLimit = bioRatio >= 0.9;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiFetch("/api/profile", {
        method: "PATCH",
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
    <Card className="overflow-hidden">
      <CardHeader
        title={
          <span className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </span>
            Profilni tahrirlash
          </span>
        }
        subtitle="Avatar, muqova, ism va bio"
      />
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Avatar
              </span>
              <AvatarUpload name={initialName} src={avatarUrl} size={92} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Muqova
              </span>
              <CoverUpload />
            </div>
          </div>

          <div>
            <Label>Ism</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </span>
              <Input
                className="pl-10!"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Ozodbek Hoshimov"
                required
                minLength={2}
                maxLength={80}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <Label className="mb-0">Bio</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  bioNearLimit ? "font-medium text-amber-600" : "text-slate-600",
                )}
              >
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
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  bioNearLimit ? "bg-amber-400" : "bg-gradient-to-r from-brand-600 to-brand-400",
                )}
                style={{ width: `${bioPercent}%` }}
              />
            </div>
          </div>

          {error ? (
            <p className="animate-fade-up flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-inset ring-rose-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="animate-fade-up flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {success}
            </p>
          ) : null}

          <div className="flex items-center gap-3 pt-0.5">
            <Button type="submit" disabled={busy}>
              {busy ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.2-8.6" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                  <path d="M17 21v-8H7v8M7 3v5h8" />
                </svg>
              )}
              {busy ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
