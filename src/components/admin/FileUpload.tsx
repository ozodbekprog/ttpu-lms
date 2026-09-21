"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

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
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file || !inputRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    inputRef.current.files = transfer.files;
    setFileName(file.name);
    setError(null);
  }

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
      const res = await apiFetch("/api/upload", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as UploadResult | null;
      if (!res.ok || !json || !json.ok) {
        setError(json && !json.ok ? json.error : "Faylni yuklab bo'lmadi");
        return;
      }
      setUrl(json.data.url);
      onUploaded?.(json.data.url);
      setFileName(null);
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
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors duration-150",
          dragging
            ? "border-brand-400 bg-brand-50/70"
            : "border-slate-300 bg-slate-50/60 hover:border-brand-300 hover:bg-brand-50/40",
        )}
      >
        <span
          className={cn(
            "mb-1 inline-flex size-11 items-center justify-center rounded-full transition-colors duration-150",
            dragging ? "bg-brand-100 text-brand-700" : "bg-white text-slate-400 shadow-sm",
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4" />
            <path d="m6 10 6-6 6 6" />
            <path d="M4 20h16" />
          </svg>
        </span>
        <span className="max-w-full truncate text-sm font-medium text-slate-700">
          {fileName ?? "Faylni bu yerga tashlang"}
        </span>
        <span className="text-xs text-slate-400">
          {fileName ? "Yuklash uchun tugmani bosing" : "yoki bosib fayl tanlang"}
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={upload} disabled={busy}>
          {busy ? "Yuklanmoqda..." : label}
        </Button>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors duration-150 hover:bg-emerald-100"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Yuklandi: {url}
          </a>
        ) : null}
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
