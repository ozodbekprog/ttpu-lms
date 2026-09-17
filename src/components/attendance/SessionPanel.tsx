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
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState<string | null>(null);

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
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setOrigin(window.location.origin);
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
    if (!latestCode) {
      setQr(null);
      return;
    }
    let cancelled = false;
    const checkInUrl = `${origin}/attendance/check-in?code=${latestCode}`;
    QRCode.toDataURL(checkInUrl, { width: 512, margin: 1 })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [latestCode, origin]);

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
      <CardBody className="space-y-5">
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
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {latest ? (
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <div className="mx-auto w-full max-w-60">
              {qr ? (
                <img
                  src={qr}
                  alt="Davomat uchun QR kod"
                  className="aspect-square w-full rounded-xl border border-slate-200 bg-white p-2"
                />
              ) : (
                <div className="aspect-square w-full animate-pulse rounded-xl bg-slate-100" />
              )}
              <p className="mt-3 text-center font-mono text-2xl font-semibold tracking-[0.35em] text-slate-900">
                {latest.code}
              </p>
              <p className="mt-1 text-center text-xs text-slate-400">
                /attendance/check-in
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {latestActive ? (
                  <Badge tone="green">Faol</Badge>
                ) : (
                  <Badge tone="slate">Yopilgan</Badge>
                )}
                {latestActive ? (
                  <span className="text-sm text-slate-600">
                    Qolgan vaqt:{" "}
                    <span className="font-mono font-semibold text-slate-900">
                      {formatRemaining(remainingMs)}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">
                    Tugadi: {fmtDateTime(latest.expiresAt)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Belgilanganlar: {latest.marked.length}
                  {studentCount ? ` / ${studentCount}` : ""}
                </p>
                {latest.marked.length === 0 ? (
                  <p className="mt-1 text-sm text-slate-500">
                    Hozircha hech kim belgilanmagan.
                  </p>
                ) : (
                  <ul className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
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
            <p className="mb-2 text-sm font-medium text-slate-700">So&apos;nggi sessiyalar</p>
            <Table>
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-3 text-left font-medium">Kod</th>
                  <th className="px-3 py-2 text-left font-medium">Sana</th>
                  <th className="px-3 py-2 text-left font-medium">Holat</th>
                  <th className="px-3 py-2 text-left font-medium">Belgilangan</th>
                </tr>
              </thead>
              <tbody>
                {history.map((session) => (
                  <tr key={session.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs text-slate-700">{session.code}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {fmtDateTime(session.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      {session.active ? (
                        <Badge tone="green">Faol</Badge>
                      ) : (
                        <Badge tone="slate">Yopilgan</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{session.marked.length}</td>
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
