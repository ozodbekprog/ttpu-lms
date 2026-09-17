"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

type EnrollResponse = { ok?: boolean; error?: string } | null;

export function EnrollButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enroll() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
      const json = (await res.json().catch(() => null)) as EnrollResponse;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Yozilishda xatolik yuz berdi");
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
    <span className="flex flex-col gap-1">
      <Button size="sm" onClick={enroll} disabled={busy}>
        {busy ? "Yozilmoqda..." : "Yozilish"}
      </Button>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </span>
  );
}
