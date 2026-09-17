"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea } from "@/components/ui";

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf", "zip", "docx", "pptx", "txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
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
  const [text, setText] = useState(existing?.text ?? "");
  const [fileUrl, setFileUrl] = useState(existing?.fileUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  function validateFile(candidate: File) {
    const extension = candidate.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Ruxsat etilgan turlar: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      return "Fayl juda katta (maks 10MB)";
    }
    return null;
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const candidate = event.target.files?.[0] ?? null;
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
    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {overdue ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Muddat o&apos;tgan. Topshirilgan ish &quot;Kechikkan&quot; (LATE) holatida qayd etiladi.
        </p>
      ) : null}
      <div>
        <Label>Javob matni</Label>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          placeholder="Javobingizni yozing..."
        />
      </div>
      <div>
        <Label>Fayl biriktirish (ixtiyoriy)</Label>
        <Input
          type="file"
          accept=".png,.jpg,.jpeg,.pdf,.zip,.docx,.pptx,.txt"
          onChange={handleFileChange}
        />
        {file ? (
          <p className="mt-1 text-xs text-slate-500">
            {file.name} · {formatSize(file.size)}
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">
            Maks 10MB: {ALLOWED_EXTENSIONS.join(", ")}
          </p>
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
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {done ? <p className="text-sm text-emerald-600">Topshiriq yuborildi</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
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
