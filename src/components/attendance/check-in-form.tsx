"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, CardBody } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { requestBrowserLocation } from "./live-qr";
import { QrScanner } from "./qr-scanner";

type CheckInResult = {
  course: { id: string; title: string; slug: string };
  date: string;
  status?: string;
  reasons?: string[];
};

const REASON_LABELS: Record<string, string> = {
  GEO_FAR: "Joylashuv o'qituvchi joyidan uzoq",
  GEO_MISSING: "Qurilma joylashuvi aniqlanmadi",
  GEO_ACCURACY_LOW: "Joylashuv aniqligi past",
  IP_CHANGED: "IP manzil o'zgardi",
  IP_SHARED: "Bir xil qurilmadan bir nechta belgilash aniqlandi",
  VPN_SUSPECTED: "VPN yoki proxy aniqlandi",
  IP_GEO_MISMATCH: "Tarmoq joylashuvi qurilma joylashuviga mos emas",
};

export function CheckInForm({ initialToken }: { initialToken?: string }) {
  const [status, setStatus] = useState<"idle" | "scanning" | "loading" | "success" | "suspicious" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [pop, setPop] = useState(false);
  const tokenSubmitted = useRef(false);

  async function submitToken(token: string) {
    const value = token.trim();
    if (!value) {
      setStatus("error");
      setMessage("QR kod o'qilmadi. Qayta urinib ko'ring.");
      return;
    }

    setStatus("loading");
    setMessage("Joylashuv aniqlanmoqda...");

    const location = await requestBrowserLocation();

    setMessage("Tekshirilmoqda...");

    const response = await apiFetch("/api/attendance/check-in", {
      method: "POST",
      body: JSON.stringify(
        location
          ? { token: value, lat: location.lat, lng: location.lng, accuracy: location.accuracy }
          : { token: value },
      ),
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
    if (json.data.status === "SUSPICIOUS") {
      setReasons(Array.isArray(json.data.reasons) ? json.data.reasons : []);
      setStatus("suspicious");
    } else {
      setReasons([]);
      setStatus("success");
    }
    window.requestAnimationFrame(() => setPop(true));
  }

  useEffect(() => {
    if (tokenSubmitted.current) return;
    const token = (initialToken ?? "").trim();
    if (!token) return;
    tokenSubmitted.current = true;
    void submitToken(token);
  }, [initialToken]);

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
            }}
          >
            Yana skanerlash
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (status === "suspicious" && result) {
    return (
      <Card className="animate-fade-up relative mx-auto max-w-lg overflow-hidden border-amber-200">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-gold-400" />
        <span className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-amber-300/20 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 -left-12 size-48 rounded-full bg-gold-300/15 blur-3xl" />
        <CardBody className="relative flex flex-col items-center gap-2.5 py-12 text-center">
          <span className="relative flex size-24 items-center justify-center">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-amber-400/25" />
            <span
              className={cn(
                "relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/40 ring-8 ring-amber-50 transition-all duration-500 ease-out",
                pop ? "scale-100 opacity-100" : "scale-50 opacity-0",
              )}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  "transition-transform duration-500 delay-150 ease-out",
                  pop ? "scale-100" : "scale-0",
                )}
              >
                <path d="M12 3 2 20h20L12 3Z" />
                <path d="M12 10v4" />
                <path d="M12 17.5h.01" />
              </svg>
            </span>
          </span>
          <p className="mt-2 text-xl font-semibold text-amber-800">
            Belgilandingiz, lekin tekshiruv shubhali
          </p>
          <p className="text-sm font-medium text-slate-700">{result.course.title}</p>
          <p className="text-sm text-slate-500">{fmtDate(`${result.date}T00:00:00.000Z`)}</p>
          {reasons.length > 0 ? (
            <ul className="mt-2 w-full space-y-1.5 rounded-2xl bg-amber-50 px-4 py-3 text-left">
              {reasons.map((reason) => (
                <li key={reason} className="text-sm text-amber-800">
                  · {REASON_LABELS[reason] ?? reason}
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            variant="secondary"
            className="mt-4 px-6"
            onClick={() => {
              setStatus("idle");
              setResult(null);
              setReasons([]);
              setMessage(null);
            }}
          >
            Yana skanerlash
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (status === "scanning" || status === "loading") {
    return (
      <Card className="animate-fade-up relative mx-auto max-w-lg overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
        <CardBody className="space-y-5 px-6 py-8 sm:px-8">
          {status === "scanning" ? (
            <QrScanner
              onDetected={(token) => {
                void submitToken(token);
              }}
              onCancel={() => setStatus("idle")}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="size-10 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
              <p className="text-sm font-medium text-slate-600">
                {message ?? "Tekshirilmoqda..."}
              </p>
              <p className="text-xs text-slate-400">
                Joylashuv so&apos;ralsa — ruxsat bering
              </p>
            </div>
          )}
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
          <p className="text-base font-semibold text-slate-900">QR davomat</p>
          <p className="max-w-sm text-sm text-slate-500">
            O&apos;qituvchi ekranidagi QR kodni telefon kamerasi bilan skanerlang — davomat
            avtomatik belgilanadi.
          </p>
        </div>

        {message ? (
          <p
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
              status === "error" ? "bg-rose-50 text-rose-700" : "text-slate-500",
            )}
          >
            {message}
          </p>
        ) : null}

        <Button
          size="lg"
          className="w-full py-3 text-base"
          onClick={() => {
            setMessage(null);
            setStatus("scanning");
          }}
        >
          QR skanerlash
        </Button>
      </CardBody>
    </Card>
  );
}
