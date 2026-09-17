"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

type ApiResult = { ok?: boolean; error?: string } | null;

export function CertificateDeleteButton({
  certificateId,
  studentName,
}: {
  certificateId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!window.confirm(`${studentName} nomiga berilgan sertifikat bekor qilinadi. Davom etilsinmi?`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/certificates/${certificateId}`, { method: "DELETE" });
      const json = (await response.json().catch(() => null)) as ApiResult;
      if (!response.ok || !json?.ok) {
        setError(json?.error ?? "Bekor qilishda xatolik yuz berdi");
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
    <div className="flex flex-col items-end gap-1">
      <Button variant="danger" size="sm" onClick={onDelete} disabled={busy}>
        {busy ? "Bekor qilinmoqda..." : "Bekor qilish"}
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
