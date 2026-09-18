"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

type EnrollResponse = { ok?: boolean; error?: string } | null;

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export function EnrollButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function enroll() {
    setState("busy");
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
      const json = (await res.json().catch(() => null)) as EnrollResponse;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Yozilishda xatolik yuz berdi");
        setState("idle");
        return;
      }
      setState("done");
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
      setState("idle");
    }
  }

  const busy = state === "busy";
  const done = state === "done";

  return (
    <span className="flex w-full flex-col gap-1.5" aria-live="polite">
      <Button size="sm" onClick={enroll} disabled={busy || done} className="w-full">
        {busy ? (
          <>
            <SpinnerIcon />
            Yozilmoqda...
          </>
        ) : done ? (
          <>
            <CheckIcon />
            Yozildingiz
          </>
        ) : (
          <>
            <PlusIcon />
            Yozilish
          </>
        )}
      </Button>
      {error ? (
        <span className="inline-flex items-start gap-1 text-xs leading-snug text-rose-600">
          <AlertIcon />
          {error}
        </span>
      ) : null}
    </span>
  );
}
