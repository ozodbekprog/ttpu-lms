"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, CardBody, Input, Label } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

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
      <Card className="mx-auto max-w-md">
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
            ✓
          </span>
          <p className="text-lg font-semibold text-slate-900">Davomat belgilandi</p>
          <p className="text-sm text-slate-600">{result.course.title}</p>
          <p className="text-sm text-slate-500">{fmtDate(`${result.date}T00:00:00.000Z`)}</p>
          <Button
            variant="secondary"
            className="mt-2"
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
    <Card className="mx-auto max-w-md">
      <CardBody className="space-y-5 py-8">
        <div className="text-center">
          <p className="text-sm text-slate-500">
            O&apos;qituvchi ko&apos;rsatgan 6 belgili kodni kiriting
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
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              maxLength={6}
              className="py-4 text-center font-mono text-3xl tracking-[0.4em] uppercase"
            />
          </div>
          {message ? (
            <p
              className={
                status === "error"
                  ? "rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-700"
                  : "text-center text-sm text-slate-500"
              }
            >
              {message}
            </p>
          ) : null}
          <Button
            type="submit"
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
