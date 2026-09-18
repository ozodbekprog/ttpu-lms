"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const MAX_SIZE = 30 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp";
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

type ApiResult = { ok?: boolean; error?: string } | null;

export function CoverUpload({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Faqat png, jpg yoki webp rasm tanlang");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Rasm hajmi 30MB dan oshmasligi kerak");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/profile/cover", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as ApiResult;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Yuklashda xatolik yuz berdi");
        return;
      }
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-left transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/70 text-brand-700 ring-1 ring-inset ring-brand-100 transition-transform duration-200 group-hover:scale-105">
          {busy ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.2-8.6" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="m21 16-4.5-4.5L7 21" />
            </svg>
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-slate-700 transition-colors duration-150 group-hover:text-brand-800">
            {busy ? "Yuklanmoqda..." : "Muqovani almashtirish"}
          </span>
          <span className="mt-0.5 block text-xs text-slate-400">PNG, JPG yoki WebP · 30 MB gacha (avtomatik siqiladi)</span>
        </span>
      </button>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onFileChange} />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
