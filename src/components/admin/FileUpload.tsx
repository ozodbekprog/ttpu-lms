"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";

type UploadResult = { ok: true; data: { url: string } } | { ok: false; error: string };

export default function FileUpload({
  onUploaded,
  label = "Fayl yuklash",
  accept,
}: {
  onUploaded?: (url: string) => void;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Avval faylni tanlang");
      return;
    }

    setBusy(true);
    setError(null);
    setUrl(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as UploadResult | null;
      if (!res.ok || !json || !json.ok) {
        setError(json && !json.ok ? json.error : "Faylni yuklab bo'lmadi");
        return;
      }
      setUrl(json.data.url);
      onUploaded?.(json.data.url);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Tarmoqda xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-sm text-slate-600 transition-colors duration-150 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:border-brand-300 hover:file:bg-brand-100"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={upload} disabled={busy}>
          {busy ? "Yuklanmoqda..." : label}
        </Button>
        {url ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Yuklandi: {url}
          </span>
        ) : null}
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
