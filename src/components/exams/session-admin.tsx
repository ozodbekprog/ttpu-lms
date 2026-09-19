"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Card, CardBody, CardHeader, Input, Progress, Select, Table } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AttendanceBadge } from "./session-badges";
import { SHEET_STATUSES, SHEET_STATUS_LABEL, type SessionSheetRow } from "./session-shared";

type Draft = { seat: string; status: string; score: string };

function buildDrafts(rows: SessionSheetRow[]) {
  const drafts: Record<string, Draft> = {};
  for (const row of rows) {
    drafts[row.studentId] = {
      seat: row.seat ?? "",
      status: row.status,
      score: row.score != null ? String(row.score) : "",
    };
  }
  return drafts;
}

export function SheetManager({ sessionId, rows }: { sessionId: string; rows: SessionSheetRow[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => buildDrafts(rows));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [force, setForce] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const admittedCount = rows.filter((row) => row.admitted).length;

  function patchDraft(studentId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] ?? { seat: "", status: "PENDING", score: "" }),
        ...patch,
      },
    }));
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/exams/sessions/${sessionId}/sheets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    const json = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      data?: { created?: number; skipped?: number; ineligible?: number };
    } | null;
    setGenerating(false);
    if (!response.ok || !json?.ok || !json.data) {
      setError(json?.error ?? "Ro'yxat shakllantirishda xatolik");
      return;
    }
    const skipped = json.data.ineligible ?? 0;
    setNotice(
      `${json.data.created ?? 0} ta varaq yaratildi · ${json.data.skipped ?? 0} ta allaqachon mavjud` +
        (skipped > 0 ? ` · ${skipped} ta ruxsatsiz o'tkazib yuborildi` : ""),
    );
    router.refresh();
  }

  async function forceAdd(studentId: string) {
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/exams/sessions/${sessionId}/sheets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true, studentIds: [studentId] }),
    });
    const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!response.ok || !json?.ok) {
      setError(json?.error ?? "Qo'shishda xatolik");
      return;
    }
    setNotice("Talaba majburiy ravishda ro'yxatga qo'shildi");
    router.refresh();
  }

  async function saveRow(row: SessionSheetRow) {
    if (!row.sheetId) return;
    const draft = drafts[row.studentId] ?? { seat: "", status: row.status, score: "" };
    const trimmed = draft.score.trim();
    const score = trimmed === "" ? null : Number(trimmed);
    if (score !== null && (!Number.isInteger(score) || score < 0 || score > 100)) {
      setRowErrors((current) => ({ ...current, [row.studentId]: "Ball 0-100 oralig'ida bo'lishi kerak" }));
      return;
    }
    setSavingId(row.studentId);
    setRowErrors((current) => ({ ...current, [row.studentId]: "" }));
    const response = await fetch(`/api/exams/sheets/${row.sheetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seat: draft.seat.trim() || null, status: draft.status, score }),
    });
    const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setSavingId(null);
    if (!response.ok || !json?.ok) {
      setRowErrors((current) => ({ ...current, [row.studentId]: json?.error ?? "Saqlashda xatolik" }));
      return;
    }
    setNotice(`${row.studentName}: natija saqlandi`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Imtihon varaqalari"
        subtitle={`${rows.length} ta talaba · ${admittedCount} ta ro'yxatda`}
        action={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={force}
                onChange={(event) => setForce(event.target.checked)}
                className="size-4 rounded border-slate-300 accent-brand-700"
              />
              Ruxsatsizlarni ham qo&apos;shish
            </label>
            <Button size="sm" onClick={generate} disabled={generating}>
              {generating ? "Shakllantirilmoqda..." : "Ro'yxatni shakllantirish"}
            </Button>
          </div>
        }
      />
      <CardBody>
        {notice ? (
          <p className="mb-4 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{notice}</p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</p>
        ) : null}

        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">
            Kursda hali talaba yo&apos;q.
          </p>
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <th className="rounded-l-xl py-2.5 pr-3 pl-3 text-left font-medium">Talaba</th>
                <th className="px-3 py-2.5 text-left font-medium">Davomat</th>
                <th className="px-3 py-2.5 text-left font-medium">Ruxsat</th>
                <th className="px-3 py-2.5 text-left font-medium">O&apos;rindiq</th>
                <th className="px-3 py-2.5 text-left font-medium">Natija</th>
                <th className="rounded-r-xl px-3 py-2.5 text-right font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const draft = drafts[row.studentId] ?? { seat: "", status: row.status, score: "" };
                return (
                  <tr key={row.studentId} className={cn("align-top", !row.admitted && "bg-slate-50/40")}>
                    <td className="py-3 pr-3 pl-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.studentName} size={32} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">{row.studentName}</p>
                          <p className="text-xs text-slate-400">{row.studentGroup ?? "Guruhsiz"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-36">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {row.attendance.present + row.attendance.late + row.attendance.excused}/
                            {row.attendance.total}
                          </span>
                          <span className={cn("font-semibold", row.attendance.eligible ? "text-emerald-600" : "text-rose-600")}>
                            {row.attendance.percent}%
                          </span>
                        </div>
                        <Progress value={row.attendance.percent} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <AttendanceBadge attendance={row.attendance} />
                        {row.admitted && !row.attendance.eligible ? (
                          <span className="text-[11px] font-medium text-amber-600">Majburiy kiritilgan</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {row.sheetId ? (
                        <Input
                          value={draft.seat}
                          onChange={(event) => patchDraft(row.studentId, { seat: event.target.value })}
                          maxLength={20}
                          placeholder="A-1"
                          className="w-24 px-2.5 py-1.5 text-sm"
                        />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {row.sheetId ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={draft.status}
                            onChange={(event) => patchDraft(row.studentId, { status: event.target.value })}
                            className="w-36 px-2.5 py-1.5 text-sm"
                          >
                            {SHEET_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {SHEET_STATUS_LABEL[status]}
                              </option>
                            ))}
                          </Select>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={draft.score}
                            onChange={(event) => patchDraft(row.studentId, { score: event.target.value })}
                            placeholder="Ball"
                            className="w-20 px-2.5 py-1.5 text-sm"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                      {rowErrors[row.studentId] ? (
                        <p className="mt-1.5 text-xs text-rose-600">{rowErrors[row.studentId]}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {row.sheetId ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => saveRow(row)}
                          disabled={savingId === row.studentId}
                        >
                          {savingId === row.studentId ? "..." : "Saqlash"}
                        </Button>
                      ) : !row.attendance.eligible ? (
                        <Button size="sm" variant="gold" onClick={() => forceAdd(row.studentId)}>
                          Majburiy qo&apos;shish
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">Ro&apos;yxatga olinmagan</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}

export function SessionStatusActions({
  sessionId,
  admissionOpen,
}: {
  sessionId: string;
  admissionOpen: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleAdmission() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/exams/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionOpen: !admissionOpen }),
    });
    const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(false);
    if (!response.ok || !json?.ok) {
      setError(json?.error ?? "O'zgartirishda xatolik");
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Sessiya va uning barcha varaqalari o'chiriladi. Davom etasizmi?")) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/exams/sessions/${sessionId}`, { method: "DELETE" });
    const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(false);
    if (!response.ok || !json?.ok) {
      setError(json?.error ?? "O'chirishda xatolik");
      return;
    }
    router.push("/exams/sessions");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button size="sm" variant={admissionOpen ? "secondary" : "primary"} onClick={toggleAdmission} disabled={busy}>
        {admissionOpen ? "Ruxsatni yopish" : "Ruxsatni ochish"}
      </Button>
      <Button size="sm" variant="danger" onClick={remove} disabled={busy}>
        O&apos;chirish
      </Button>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}
