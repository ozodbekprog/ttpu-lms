"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, CardBody, Input, Label } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";

type CheckInResult = {
  course: { id: string; title: string; slug: string };
  date: string;
};

function sanitize(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function CheckInForm({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(() => sanitize(initialCode ?? ""));
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const autoSubmitted = useRef(false);

  async function submit(value: string) {
    const normalized = sanitize(value);
    if (normalized.length !== 6) {
      setStatus("error");
      setMessage("Kod 6 belgidan iborat bo'lishi kerak");
      return;
    }

    setStatus("loading");
    setMessage(null);

    const response = await fetch("/api/attendance/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: normalized }),
    });
    const json = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string; data?: CheckInResult }
      | null;

    if (!response.ok || !json?.ok || !json.data) {
      setStatus("error");
      setMessage(json?.error ?? "Belgilashda xatolik yuz berdi");
      return;
    }

    setResult(json.data);
    setStatus("success");
  }

  useEffect(() => {
    if (autoSubmitted.current) return;
    const initial = sanitize(initialCode ?? "");
    if (initial.length !== 6) return;
    autoSubmitted.current = true;
    void submit(initial);
  }, [initialCode]);

  if (status === "success" && result) {
    return (
      <Card className="mx-auto max-w-lg border-emerald-100">
        <CardBody className="flex flex-col items-center gap-2.5 py-12 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          </span>
          <p className="mt-1 text-lg font-semibold text-emerald-800">Davomat belgilandi</p>
          <p className="text-sm font-medium text-slate-700">{result.course.title}</p>
          <p className="text-sm text-slate-500">{fmtDate(`${result.date}T00:00:00.000Z`)}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setStatus("idle");
              setResult(null);
              setCode("");
            }}
          >
            Yana kod kiritish
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardBody className="space-y-6 px-6 py-9 sm:px-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <path d="M14 14h3v3h-3zM21 14v.01M14 21v.01M21 21v.01M17.5 21v.01M21 17.5v.01" />
            </svg>
          </span>
          <p className="text-base font-semibold text-slate-900">Kodni kiriting</p>
          <p className="max-w-sm text-sm text-slate-500">
            O&apos;qituvchi ko&apos;rsatgan 6 belgili kodni kiriting yoki QR kodni skanerlang.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(code);
          }}
        >
          <div>
            <Label className="text-center">Kod</Label>
            <Input
              value={code}
              onChange={(event) => {
                setCode(sanitize(event.target.value));
                if (status === "error") {
                  setStatus("idle");
                  setMessage(null);
                }
              }}
              placeholder="A1B2C3"
              aria-label="Davomat kodi"
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              maxLength={6}
              className="rounded-2xl py-5 text-center font-mono text-4xl tracking-[0.45em] uppercase placeholder:text-slate-300"
            />
          </div>

          {message ? (
            <p
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
                status === "error" ? "bg-rose-50 text-rose-700" : "text-slate-500",
              )}
            >
              {status === "error" ? (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              ) : null}
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full py-3 text-base"
            disabled={status === "loading" || code.length !== 6}
          >
            {status === "loading" ? "Tekshirilmoqda..." : "Belgilash"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
