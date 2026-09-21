"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, CardBody, Input, Label } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

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
  const [pop, setPop] = useState(false);
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

    const response = await apiFetch("/api/attendance/check-in", {
      method: "POST",
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
    setPop(false);
    setStatus("success");
    window.requestAnimationFrame(() => setPop(true));
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
      <Card className="animate-fade-up relative mx-auto max-w-lg overflow-hidden border-emerald-100">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-gold-400" />
        <span className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-emerald-300/20 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 -left-12 size-48 rounded-full bg-gold-300/15 blur-3xl" />
        <CardBody className="relative flex flex-col items-center gap-2.5 py-12 text-center">
          <span className="relative flex size-24 items-center justify-center">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400/25" />
            <span
              className={cn(
                "relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 ring-8 ring-emerald-50 transition-all duration-500 ease-out",
                pop ? "scale-100 opacity-100" : "scale-50 opacity-0",
              )}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  "transition-transform duration-500 delay-150 ease-out",
                  pop ? "scale-100" : "scale-0",
                )}
              >
                <path d="m5 13 4 4L19 7" />
              </svg>
            </span>
          </span>
          <p className="mt-2 text-xl font-semibold text-emerald-800">Davomat belgilandi</p>
          <p className="text-sm font-medium text-slate-700">{result.course.title}</p>
          <p className="text-sm text-slate-500">{fmtDate(`${result.date}T00:00:00.000Z`)}</p>
          <Button
            variant="secondary"
            className="mt-4 px-6"
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
    <Card className="animate-fade-up relative mx-auto max-w-lg overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
      <CardBody className="space-y-6 px-6 py-9 sm:px-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 shadow-sm ring-1 ring-brand-100">
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
