"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp";
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

type ApiResult = { ok?: boolean; error?: string } | null;

export function CoverUpload() {
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
      setError("Rasm hajmi 5MB dan oshmasligi kerak");
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
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m21 16-4.5-4.5L7 21" />
        </svg>
        {busy ? "Yuklanmoqda..." : "Muqova yuklash"}
      </Button>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onFileChange} />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
