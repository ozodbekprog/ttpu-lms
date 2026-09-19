"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function ReportSendButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/curator/report/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const json = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !json?.ok) {
        setError(json?.error ?? "Hisobotni yuborishda xatolik");
        return;
      }
      setSent(true);
    } catch {
      setError("Tarmoq xatosi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" onClick={send} disabled={loading}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
        {loading ? "Yuborilmoqda..." : "Hisobotni yuborish"}
      </Button>
      {sent ? <p className="text-xs text-emerald-600">Hisobot kuratorga yuborildi</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
