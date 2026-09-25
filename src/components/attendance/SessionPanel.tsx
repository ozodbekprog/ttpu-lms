"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Badge, Button, Card, CardBody, CardHeader, Label, Select, Table } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  formatSecondsLeft,
  requestBrowserLocation,
  type BrowserLocation,
} from "./live-qr";

type AttendanceStatusValue = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "SUSPICIOUS";

type SessionMark = {
  studentId: string;
  name: string;
  status: AttendanceStatusValue;
};

type SessionRow = {
  id: string;
  code: string;
  date: string;
  expiresAt: string;
  createdAt: string;
  active: boolean;
  marked: SessionMark[];
};

const STATUS_LABELS: Record<AttendanceStatusValue, string> = {
  PRESENT: "Bor",
  ABSENT: "Yo'q",
  LATE: "Kechikkan",
  EXCUSED: "Sababli",
  SUSPICIOUS: "Shubhali",
};

const STATUS_TONES: Record<AttendanceStatusValue, "green" | "rose" | "amber" | "blue"> = {
  PRESENT: "green",
  ABSENT: "rose",
  LATE: "amber",
  EXCUSED: "blue",
  SUSPICIOUS: "amber",
};

const MINUTE_OPTIONS = [5, 10, 15, 30, 60];

const TIMER_RADIUS = 23;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SessionPanel({
  courseId,
  studentCount,
}: {
  courseId: string;
  studentCount: number;
}) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [minutes, setMinutes] = useState(15);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [qr, setQr] = useState<{ code: string; url: string } | null>(null);
  const [teacherLocation, setTeacherLocation] = useState<BrowserLocation | null>(null);
  const [dynamicQr, setDynamicQr] = useState<{
    token: string;
    url: string;
    expiresIn: number;
    fetchedAt: number;
  } | null>(null);
  const [dynamicImg, setDynamicImg] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await apiFetch(
      `/api/attendance/sessions?courseId=${encodeURIComponent(courseId)}`,
    );
    const json = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string; data?: { sessions: SessionRow[] } }
      | null;
    if (!response.ok || !json?.ok || !json.data) {
      setError(json?.error ?? "Sessiyalarni yuklashda xatolik");
      return;
    }
    setSessions(json.data.sessions);
    setError(null);
  }, [courseId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const latest = sessions[0] ?? null;
  const hasActive = sessions.some((session) => session.active);

  useEffect(() => {
    if (!hasActive) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [hasActive, refresh]);

  const latestCode = latest?.code ?? null;
  useEffect(() => {
    if (!latestCode) return;
    let cancelled = false;
    const checkInUrl = `${window.location.origin}/attendance/check-in?code=${latestCode}`;
    QRCode.toDataURL(checkInUrl, { width: 512, margin: 1 })
      .then((url) => {
        if (!cancelled) setQr({ code: latestCode, url });
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [latestCode]);

  useEffect(() => {
    let cancelled = false;
    void requestBrowserLocation().then((location) => {
      if (!cancelled && location) setTeacherLocation(location);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const latestId = latest?.id ?? null;

  const remainingMs = useMemo(() => {
    if (!latest) return 0;
    return new Date(latest.expiresAt).getTime() - now;
  }, [latest, now]);
  const latestActive = Boolean(latest && remainingMs > 0);

  useEffect(() => {
    if (!latestId || !latestActive) {
      setDynamicQr(null);
      setDynamicImg(null);
      setTokenError(null);
      return;
    }
    let cancelled = false;
    async function fetchToken() {
      const response = await apiFetch(`/api/attendance/sessions/${latestId}/token`, {
        method: "POST",
        body: JSON.stringify(
          teacherLocation ? { lat: teacherLocation.lat, lng: teacherLocation.lng } : {},
        ),
      });
      const json = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; data?: { token: string; url: string; expiresIn: number } }
        | null;
      if (cancelled) return;
      if (!response.ok || !json?.ok || !json.data) {
        setTokenError(json?.error ?? "Dinamik QR yangilashda xatolik");
        return;
      }
      setTokenError(null);
      setDynamicQr({
        token: json.data.token,
        url: json.data.url,
        expiresIn: json.data.expiresIn,
        fetchedAt: Date.now(),
      });
    }
    void fetchToken();
    const timer = window.setInterval(() => {
      void fetchToken();
    }, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [latestId, latestActive, teacherLocation]);

  useEffect(() => {
    if (!dynamicQr) {
      setDynamicImg(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(dynamicQr.url, { width: 512, margin: 1 })
      .then((url) => {
        if (!cancelled) setDynamicImg(url);
      })
      .catch(() => {
        if (!cancelled) setDynamicImg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [dynamicQr]);

  const tokenRemainingMs = useMemo(() => {
    if (!dynamicQr) return 0;
    return dynamicQr.expiresIn * 1000 - (now - dynamicQr.fetchedAt);
  }, [dynamicQr, now]);

  const remainingRatio = useMemo(() => {
    if (!latest) return 0;
    const total = new Date(latest.expiresAt).getTime() - new Date(latest.createdAt).getTime();
    if (total <= 0) return 0;
    return Math.max(0, Math.min(1, remainingMs / total));
  }, [latest, remainingMs]);

  async function startSession() {
    setBusy(true);
    setError(null);
    const response = await apiFetch("/api/attendance/sessions", {
      method: "POST",
      body: JSON.stringify({ courseId, minutes }),
    });
    const json = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;
    if (!response.ok || !json?.ok) {
      setError(json?.error ?? "Sessiya boshlashda xatolik");
      setBusy(false);
      return;
    }
    await refresh();
    setBusy(false);
  }

  async function closeSession() {
    if (!latest) return;
    setBusy(true);
    setError(null);
    const response = await apiFetch(`/api/attendance/sessions/${latest.id}`, { method: "DELETE" });
    const json = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;
    if (!response.ok || !json?.ok) {
      setError(json?.error ?? "Sessiyani yopishda xatolik");
      setBusy(false);
      return;
    }
    await refresh();
    setBusy(false);
  }

  const history = sessions.slice(1, 6);

  const qrSrc =
    dynamicImg ?? (qr && latest && qr.code === latest.code ? qr.url : null);
  const tokenRatio =
    dynamicQr && dynamicQr.expiresIn > 0
      ? Math.max(0, Math.min(1, tokenRemainingMs / (dynamicQr.expiresIn * 1000)))
      : 0;

  return (
    <Card>
      <CardHeader
        title="QR davomat sessiyasi"
        subtitle="Talabalar QR kodni skanerlaydi"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void refresh();
            }}
          >
            Yangilash
          </Button>
        }
      />
      <CardBody className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Label>Davomiyligi</Label>
            <Select
              value={minutes}
              disabled={busy}
              onChange={(event) => setMinutes(Number(event.target.value))}
            >
              {MINUTE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} daqiqa
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={() => {
              void startSession();
            }}
            disabled={busy}
          >
            {hasActive ? "Yangi sessiya" : "Sessiya boshlash"}
          </Button>
          {latestActive ? (
            <Button
              variant="secondary"
              onClick={() => {
                void closeSession();
              }}
              disabled={busy}
            >
              Yopish
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {latest ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_1fr]">
            <div className="mx-auto w-full max-w-64">
              <div className="rounded-3xl border border-slate-100 bg-white p-3 shadow-lift ring-1 ring-slate-900/5">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-2">
                  {qrSrc ? (
                    <img
                      src={qrSrc}
                      alt="Davomat uchun QR kod"
                      className="aspect-square w-full rounded-xl"
                    />
                  ) : (
                    <div className="aspect-square w-full animate-pulse rounded-xl bg-slate-100" />
                  )}
                </div>
              </div>
              <p className="mt-5 text-center text-xs text-slate-600">
                Talabalar QR kodni telefon kamerasi bilan skanerlaydi
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {latestActive ? (
                  <Badge tone="green" className="shadow-sm shadow-emerald-500/20">
                    Faol
                  </Badge>
                ) : (
                  <Badge tone="slate">Yopilgan</Badge>
                )}
                {latestActive ? <Badge tone="blue">Dinamik QR · 10s</Badge> : null}
                {latestActive ? (
                  <span className="relative inline-flex size-16 items-center justify-center">
                    <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r={TIMER_RADIUS}
                        fill="none"
                        strokeWidth="3.5"
                        className="stroke-gold-300/35"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r={TIMER_RADIUS}
                        fill="none"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={`${remainingRatio * TIMER_CIRCUMFERENCE} ${TIMER_CIRCUMFERENCE}`}
                        className="stroke-gold-400 drop-shadow-[0_0_6px_rgba(212,175,55,0.45)]"
                      />
                    </svg>
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-gold-800">
                      {formatRemaining(remainingMs)}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">
                    Tugadi: {fmtDateTime(latest.expiresAt)}
                  </span>
                )}
                {latestActive && dynamicQr ? (
                  <span
                    className="relative inline-flex size-16 items-center justify-center"
                    title="Token yangilanishiga qoldi"
                  >
                    <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r={TIMER_RADIUS}
                        fill="none"
                        strokeWidth="3.5"
                        className="stroke-brand-100"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r={TIMER_RADIUS}
                        fill="none"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={`${tokenRatio * TIMER_CIRCUMFERENCE} ${TIMER_CIRCUMFERENCE}`}
                        className="stroke-brand-600"
                      />
                    </svg>
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-brand-800">
                      {formatSecondsLeft(tokenRemainingMs)}
                    </span>
                  </span>
                ) : null}
              </div>
              {latestActive && !teacherLocation ? (
                <p className="text-xs text-slate-500">
                  Joylashuv ruxsati berilmagan — masofa tekshiruvi ishlamaydi
                </p>
              ) : null}
              {tokenError ? <p className="text-xs text-rose-600">{tokenError}</p> : null}

              <div>
                <p className="text-sm font-medium text-slate-800">
                  Belgilanganlar:{" "}
                  <span className="font-semibold text-brand-800">{latest.marked.length}</span>
                  {studentCount ? (
                    <span className="text-slate-600"> / {studentCount}</span>
                  ) : null}
                </p>
                {latest.marked.length === 0 ? (
                  <p className="mt-1.5 text-sm text-slate-500">
                    Hozircha hech kim belgilanmagan.
                  </p>
                ) : (
                  <ul className="mt-2.5 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                    {latest.marked.map((mark) => (
                      <li key={mark.studentId}>
                        <Badge
                          tone={STATUS_TONES[mark.status]}
                          className="px-2.5 py-1 shadow-sm ring-1 ring-black/[0.03]"
                        >
                          {mark.name} · {STATUS_LABELS[mark.status]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-xs text-slate-600">
                Ro&apos;yxat 30 sekundda bir marta avtomatik yangilanadi.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Hozircha sessiya boshlanmagan. Sessiya boshlangach QR kod shu yerda paydo bo&apos;ladi.
          </p>
        )}

        {history.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              So&apos;nggi sessiyalar
            </p>
            <Table>
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <th className="py-2.5 pr-3 text-left font-medium">Sana</th>
                  <th className="px-3 py-2.5 text-left font-medium">Holat</th>
                  <th className="px-3 py-2.5 text-right font-medium">Belgilangan</th>
                </tr>
              </thead>
              <tbody>
                {history.map((session) => (
                  <tr
                    key={session.id}
                    className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="py-2.5 pr-3 text-xs text-slate-500">
                      {fmtDateTime(session.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      {session.active ? (
                        <Badge tone="green">Faol</Badge>
                      ) : (
                        <Badge tone="slate">Yopilgan</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">
                      {session.marked.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
