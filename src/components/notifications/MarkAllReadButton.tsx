"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Xatolik yuz berdi");
        return;
      }
      router.refresh();
    } catch {
      setError("Tarmoq xatosi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" onClick={markAll} disabled={loading}>
        {loading ? (
          "Belgilanmoqda..."
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Hammasini o&apos;qildi
          </>
        )}
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
