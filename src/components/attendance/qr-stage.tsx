"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { apiFetch } from "@/lib/api";
import { fmtDateTime } from "@/lib/utils";
import {
  formatRemaining,
  isSessionActive,
  sessionProgress,
} from "@/components/attendance/qr-utils";

type AttendanceStatusValue = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

type SessionMark = {
  studentId: string;
  name: string;
  status: AttendanceStatusValue;
};

type SessionData = {
  id: string;
  code: string;
  date: string;
  expiresAt: string;
  createdAt: string;
  active: boolean;
  course: { id: string; slug: string; title: string };
  marked: SessionMark[];
};

const STATUS_LABELS: Record<AttendanceStatusValue, string> = {
  PRESENT: "Bor",
  ABSENT: "Yo'q",
  LATE: "Kechikkan",
  EXCUSED: "Sababli",
};

const STATUS_TONES: Record<AttendanceStatusValue, string> = {
  PRESENT: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  ABSENT: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  LATE: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  EXCUSED: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
};

export function QrStage({
  sessionId,
  initialCode,
  courseSlug,
  courseTitle,
  expiresAt,
  createdAt,
}: {
  sessionId: string;
  initialCode: string;
  courseSlug: string;
  courseTitle: string;
  expiresAt: string;
  createdAt: string;
}) {
  const [code, setCode] = useState(initialCode);
  const [session, setSession] = useState<SessionData | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/attendance/sessions/${sessionId}`);
      const json = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; data?: SessionData }
        | null;
      if (!response.ok || !json?.ok || !json.data) {
        setError(json?.error ?? "Sessiyani yuklashda xatolik");
        return;
      }
      setSession(json.data);
      setCode(json.data.code);
      setError(null);
    } catch {
      setError("Server bilan aloqa yo'q");
    }
  }, [sessionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkInUrl = `${window.location.origin}/attendance/check-in?code=${code}`;
    QRCode.toDataURL(checkInUrl, { width: 640, margin: 1 })
      .then((value) => {
        if (!cancelled) setQr(value);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const currentExpiresAt = session?.expiresAt ?? expiresAt;
  const currentCreatedAt = session?.createdAt ?? createdAt;
  const active = isSessionActive(currentExpiresAt, now);
  const remainingMs = Math.max(0, new Date(currentExpiresAt).getTime() - now);
  const progress = sessionProgress(currentCreatedAt, currentExpiresAt, now);
  const marked = session?.marked ?? [];

  async function closeSession() {
    setBusy(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/attendance/sessions/${sessionId}`, {
        method: "DELETE",
      });
      const json = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!response.ok || !json?.ok) {
        setError(json?.error ?? "Sessiyani yopishda xatolik");
        return;
      }
      await refresh();
    } catch {
      setError("Server bilan aloqa yo'q");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative -mx-4 -mt-6 min-h-[70vh] overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-slate-950 px-4 py-8 text-white md:-mx-8 md:-mt-8 md:px-8 md:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-24 size-[28rem] rounded-full bg-brand-500/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-24 size-[28rem] rounded-full bg-gold-400/10 blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-gold-300/90 uppercase">
              QR davomat
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {courseTitle}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Talabalar QR kodni skanerlaydi yoki 6 belgili kodni kiritadi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/courses/${courseSlug}/attendance`}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              Kurs sahifasi
            </Link>
            <button
              type="button"
              onClick={() => {
                void closeSession();
              }}
              disabled={busy || !active}
              className="inline-flex items-center justify-center rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-950/40 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Yopish
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12">
          <div className="mx-auto w-full max-w-2xl">
            <div className="relative rounded-[2rem] bg-white p-4 shadow-2xl shadow-brand-950/60 ring-1 ring-white/10">
              {qr ? (
                <img
                  src={qr}
                  alt="Davomat uchun QR kod"
                  className={`aspect-square w-full rounded-2xl ${active ? "" : "opacity-25 grayscale"}`}
                />
              ) : (
                <div className="aspect-square w-full animate-pulse rounded-2xl bg-slate-200" />
              )}
              {!active ? (
                <div className="absolute inset-4 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-sm">
                  <span className="text-sm font-semibold tracking-[0.24em] text-slate-200 uppercase">
                    Yopilgan
                  </span>
                  <span className="text-xs text-slate-400">QR kod endi faol emas</span>
                </div>
              ) : null}
            </div>
            <p className="mt-6 text-center text-[11px] font-semibold tracking-[0.28em] text-white/40 uppercase">
              Sessiya kodi
            </p>
            <p className="mt-2 text-center font-mono text-5xl font-semibold tracking-[0.3em] text-white sm:text-6xl">
              {code}
            </p>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                {active ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Faol
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60 ring-1 ring-white/15">
                    Yopilgan
                  </span>
                )}
                <span className="font-mono text-3xl font-semibold tabular-nums text-white">
                  {formatRemaining(active ? remainingMs : 0)}
                </span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    active ? "bg-gradient-to-r from-emerald-400 to-gold-300" : "bg-white/20"
                  }`}
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-white/40">
                {active
                  ? `Tugash vaqti: ${fmtDateTime(currentExpiresAt)}`
                  : `Yopilgan: ${fmtDateTime(currentExpiresAt)}`}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-white/60">Belgilanganlar</p>
                <span className="text-2xl font-semibold text-white">{marked.length}</span>
              </div>
              {marked.length === 0 ? (
                <p className="mt-3 text-sm text-white/40">Hozircha hech kim belgilanmagan.</p>
              ) : (
                <ul className="mt-4 flex max-h-64 flex-wrap gap-2 overflow-y-auto">
                  {marked.map((mark) => (
                    <li
                      key={mark.studentId}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${STATUS_TONES[mark.status]}`}
                    >
                      {mark.name} · {STATUS_LABELS[mark.status]}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-white/30">
                Ro&apos;yxat har 5 sekundda yangilanadi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
