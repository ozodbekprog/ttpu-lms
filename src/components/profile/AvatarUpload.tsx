"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const MAX_SIZE = 30 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp";
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

type ApiResult = { ok?: boolean; error?: string } | null;

export function AvatarUpload({
  name,
  src,
  size = 112,
  className,
}: {
  name: string;
  src: string | null;
  size?: number;
  className?: string;
}) {
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
      const res = await apiFetch("/api/profile/avatar", { method: "POST", body });
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
    <div className="flex flex-col items-center gap-1.5">
      <div className="group/avatar relative">
        <Avatar
          name={name}
          src={src}
          size={size}
          className={cn("ring-4 ring-white shadow-lg", className)}
        />
        {busy ? (
          <span className="absolute inset-0 rounded-full bg-brand-950/45 backdrop-blur-[1px]" />
        ) : null}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label="Avatar yuklash"
          title="Avatar yuklash"
          className="absolute -bottom-0.5 -right-0.5 inline-flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-950 text-white shadow-lg ring-2 ring-white transition-all duration-200 hover:scale-105 hover:from-brand-600 hover:to-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.2-8.6" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          )}
        </button>
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onFileChange} />
      </div>
      {error ? <p className="max-w-[220px] text-center text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
