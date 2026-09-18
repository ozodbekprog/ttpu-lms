"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Badge, Button, Card, CardBody, CardHeader, Label, Select, Table } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";

type AttendanceStatusValue = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

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
};

const STATUS_TONES: Record<AttendanceStatusValue, "green" | "rose" | "amber" | "blue"> = {
  PRESENT: "green",
  ABSENT: "rose",
  LATE: "amber",
  EXCUSED: "blue",
};

const MINUTE_OPTIONS = [5, 10, 15, 30, 60];

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

  const refresh = useCallback(async () => {
    const response = await fetch(
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

  const remainingMs = useMemo(() => {
    if (!latest) return 0;
    return new Date(latest.expiresAt).getTime() - now;
  }, [latest, now]);
  const latestActive = Boolean(latest && remainingMs > 0);

  async function startSession() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/attendance/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const response = await fetch(`/api/attendance/sessions/${latest.id}`, { method: "DELETE" });
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

  return (
    <Card>
      <CardHeader
        title="QR davomat sessiyasi"
        subtitle="Talabalar QR kodni skanerlaydi yoki kodni kiritadi"
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
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                {qr && latest && qr.code === latest.code ? (
                  <img
                    src={qr.url}
                    alt="Davomat uchun QR kod"
                    className="aspect-square w-full rounded-xl"
                  />
                ) : (
                  <div className="aspect-square w-full animate-pulse rounded-xl bg-slate-100" />
                )}
              </div>
              <p className="mt-4 text-center font-mono text-4xl font-semibold tracking-[0.3em] text-brand-900">
                {latest.code}
              </p>
              <p className="mt-1 text-center text-xs text-slate-400">/attendance/check-in</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {latestActive ? (
                  <Badge tone="green">Faol</Badge>
                ) : (
                  <Badge tone="slate">Yopilgan</Badge>
                )}
                {latestActive ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-gold-300/20 px-3 py-1 font-mono text-sm font-semibold text-gold-600">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    {formatRemaining(remainingMs)}
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">
                    Tugadi: {fmtDateTime(latest.expiresAt)}
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-800">
                  Belgilanganlar:{" "}
                  <span className="font-semibold text-brand-800">{latest.marked.length}</span>
                  {studentCount ? (
                    <span className="text-slate-400"> / {studentCount}</span>
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
                        <Badge tone={STATUS_TONES[mark.status]}>
                          {mark.name} · {STATUS_LABELS[mark.status]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-xs text-slate-400">
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              So&apos;nggi sessiyalar
            </p>
            <Table>
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2.5 pr-3 text-left font-medium">Kod</th>
                  <th className="px-3 py-2.5 text-left font-medium">Sana</th>
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
                    <td className="py-2.5 pr-3 font-mono text-xs tracking-wider text-slate-700">
                      {session.code}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">
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
