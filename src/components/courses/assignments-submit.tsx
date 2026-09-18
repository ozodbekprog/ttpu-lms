"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf", "zip", "docx", "pptx", "txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function uploadErrorMessage(status: number, message?: string) {
  if (status === 401) return "Avval tizimga kiring";
  if (status === 403) return "Sizda bu topshiriqqa fayl yuklash huquqi yo'q";
  if (status === 404) return "Topshiriq topilmadi";
  if (status === 413) return "Fayl juda katta (maks 10MB)";
  if (status === 400) return message ?? `Ruxsat etilgan turlar: ${ALLOWED_EXTENSIONS.join(", ")}`;
  return message ?? "Faylni yuklashda xatolik yuz berdi";
}

export function AssignmentsSubmit({
  assignmentId,
  overdue,
  existing,
}: {
  assignmentId: string;
  overdue: boolean;
  existing: { text: string | null; fileUrl: string | null } | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(existing?.text ?? "");
  const [fileUrl, setFileUrl] = useState(existing?.fileUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  function validateFile(candidate: File) {
    const extension = extensionOf(candidate.name);
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Ruxsat etilgan turlar: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      return "Fayl juda katta (maks 10MB)";
    }
    return null;
  }

  function acceptFile(candidate: File | null) {
    setDone(false);
    if (!candidate) {
      setFile(null);
      setError(null);
      return;
    }
    const message = validateFile(candidate);
    setFile(candidate);
    setError(message);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
    acceptFile(event.dataTransfer.files?.[0] ?? null);
  }

  function clearFile() {
    acceptFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setDone(false);

    let resolvedFileUrl = fileUrl;

    if (file) {
      const message = validateFile(file);
      if (message) {
        setSaving(false);
        setError(message);
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const upload = await fetch(`/api/assignments/${assignmentId}/submissions/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadJson = (await upload.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        data?: { url?: string };
      } | null;
      setUploading(false);

      if (!upload.ok || !uploadJson?.ok || !uploadJson.data?.url) {
        setSaving(false);
        setError(uploadErrorMessage(upload.status, uploadJson?.error));
        return;
      }

      resolvedFileUrl = uploadJson.data.url;
      setFileUrl(resolvedFileUrl);
    }

    const response = await fetch(`/api/assignments/${assignmentId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text || null, fileUrl: resolvedFileUrl || null }),
    });
    const json = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;

    setSaving(false);
    if (!response.ok || !json?.ok) {
      setError(json?.error ?? "Topshirishda xatolik yuz berdi");
      return;
    }

    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {overdue ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3.5 text-sm text-rose-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 8v5" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </span>
          <span>
            <span className="block font-semibold">Muddat o&apos;tgan (LATE)</span>
            <span className="mt-0.5 block text-rose-600/90">
              Yuborilgan ish kechikkan (LATE) holatida qayd etiladi va o&apos;qituvchi buni ko&apos;radi.
            </span>
          </span>
        </div>
      ) : null}

      <div>
        <Label>Javob matni</Label>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          placeholder="Javobingizni yozing..."
          className="resize-y leading-relaxed"
        />
      </div>

      <div>
        <Label>Fayl biriktirish (ixtiyoriy)</Label>
        {file ? (
          <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 ring-1 ring-brand-100">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <path d="M14 2v6h6" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">{formatSize(file.size)} · yuklashga tayyor</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              aria-label="Faylni olib tashlash"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-all duration-200",
              dragActive
                ? "border-brand-400 bg-brand-50 shadow-[0_0_0_4px_rgba(83,115,184,0.12)]"
                : "border-slate-300 bg-slate-50/60 hover:border-brand-300 hover:bg-brand-50/40",
            )}
          >
            <span
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full transition-colors",
                dragActive ? "bg-brand-100 text-brand-700" : "bg-white text-brand-600 ring-1 ring-slate-200",
              )}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
              </svg>
            </span>
            <span className="text-sm font-medium text-slate-700">
              Faylni bu yerga tashlang yoki <span className="text-brand-700 underline decoration-brand-300 underline-offset-2">tanlang</span>
            </span>
            <span className="text-xs text-slate-400">
              Maks 10MB: {ALLOWED_EXTENSIONS.join(", ")}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.zip,.docx,.pptx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div>
        <Label>Fayl havolasi (ixtiyoriy)</Label>
        <Input
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
          maxLength={500}
          placeholder="https://... yoki /uploads/fayl.pdf"
        />
      </div>

      {error ? (
        <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Topshiriq yuborildi
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} size="lg">
          {uploading
            ? "Fayl yuklanmoqda..."
            : saving
              ? "Yuborilmoqda..."
              : existing
                ? "Qayta topshirish"
                : "Topshirish"}
        </Button>
      </div>
    </form>
  );
}
