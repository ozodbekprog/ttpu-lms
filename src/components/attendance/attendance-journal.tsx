"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, ButtonLink, Card, CardHeader, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  JOURNAL_MIN_PERCENT,
  JOURNAL_STATUS_META,
  JOURNAL_STATUS_ORDER,
  journalDateParts,
} from "@/components/attendance/journal-utils";
import type {
  JournalStatus,
  JournalStudent,
  JournalSummaryRow,
} from "@/components/attendance/journal-utils";

type EditorState = {
  studentId: string;
  date: string;
  top: number;
  left: number;
};

const EMPTY_SUMMARY: JournalSummaryRow = {
  present: 0,
  absent: 0,
  late: 0,
  excused: 0,
  total: 0,
  percent: 0,
  eligible: false,
};

export function AttendanceJournal({
  courseId,
  attendanceHref,
  students,
  dates,
  records: initialRecords,
  currentUserId,
  canEdit,
}: {
  courseId: string;
  attendanceHref: string;
  students: JournalStudent[];
  dates: string[];
  records: Record<string, Record<string, JournalStatus>>;
  currentUserId: string;
  canEdit: boolean;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const map: Record<string, JournalSummaryRow> = {};
    for (const student of students) {
      const counts = { present: 0, absent: 0, late: 0, excused: 0 };
      for (const date of dates) {
        const status = records[student.id]?.[date];
        if (!status) continue;
        if (status === "PRESENT") counts.present += 1;
        else if (status === "ABSENT") counts.absent += 1;
        else if (status === "LATE") counts.late += 1;
        else counts.excused += 1;
      }
      const total = counts.present + counts.absent + counts.late + counts.excused;
      const attended = counts.present + counts.late + counts.excused;
      const percent = total > 0 ? Math.round((attended / total) * 100) : 0;
      map[student.id] = {
        ...counts,
        total,
        percent,
        eligible: percent >= JOURNAL_MIN_PERCENT,
      };
    }
    return map;
  }, [records, dates, students]);

  const totals = useMemo(() => {
    const map: Record<string, { attended: number; total: number }> = {};
    for (const date of dates) map[date] = { attended: 0, total: 0 };
    for (const student of students) {
      const row = records[student.id];
      if (!row) continue;
      for (const date of dates) {
        const status = row[date];
        if (!status) continue;
        const entry = map[date];
        if (!entry) continue;
        entry.total += 1;
        if (status !== "ABSENT") entry.attended += 1;
      }
    }
    return map;
  }, [records, dates, students]);

  const overall = useMemo(() => {
    let attended = 0;
    let total = 0;
    for (const date of dates) {
      attended += totals[date]?.attended ?? 0;
      total += totals[date]?.total ?? 0;
    }
    return { attended, total };
  }, [dates, totals]);

  useEffect(() => {
    if (!editor) return;
    const close = () => setEditor(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [editor]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  function openEditor(
    event: React.MouseEvent<HTMLButtonElement>,
    studentId: string,
    date: string,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 196;
    const height = 132;
    const left = Math.max(8, Math.min(rect.left - 8, window.innerWidth - width - 8));
    const top =
      rect.bottom + height + 12 > window.innerHeight
        ? Math.max(8, rect.top - height - 8)
        : rect.bottom + 6;
    setEditor({ studentId, date, top, left });
  }

  function setStatusLocally(studentId: string, date: string, status: JournalStatus | null) {
    setRecords((prev) => {
      const row = { ...(prev[studentId] ?? {}) };
      if (status) row[date] = status;
      else delete row[date];
      return { ...prev, [studentId]: row };
    });
  }

  async function saveStatus(status: JournalStatus) {
    if (!editor) return;
    const { studentId, date } = editor;
    setEditor(null);
    const previous = records[studentId]?.[date] ?? null;
    if (previous === status) return;
    setError(null);
    setStatusLocally(studentId, date, status);
    const response = await fetch(`/api/courses/${courseId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, entries: [{ studentId, status }] }),
    });
    const json = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!response.ok || !json?.ok) {
      setStatusLocally(studentId, date, previous);
      setError(json?.error ?? "Saqlashda xatolik yuz berdi");
      return;
    }
    setMessage("Davomat saqlandi");
  }

  async function clearStatus() {
    if (!editor) return;
    const { studentId, date } = editor;
    setEditor(null);
    const previous = records[studentId]?.[date] ?? null;
    if (!previous) return;
    setError(null);
    setStatusLocally(studentId, date, null);
    const response = await fetch(`/api/courses/${courseId}/attendance`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, studentId }),
    });
    const json = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!response.ok || !json?.ok) {
      setStatusLocally(studentId, date, previous);
      setError(json?.error ?? "O'chirishda xatolik yuz berdi");
      return;
    }
    setMessage("Yozuv tozalandi");
  }

  const editingStudent = editor ? students.find((student) => student.id === editor.studentId) : null;
  const editingStatus = editor ? records[editor.studentId]?.[editor.date] ?? null : null;
  const empty = students.length === 0 || dates.length === 0;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader
          title="Guruh jurnali"
          subtitle={`${students.length} ta talaba · ${dates.length} ta dars`}
        />
        {empty ? (
          <div className="px-6 py-6">
            <EmptyState
              title="Jurnal ma'lumotlari yo'q"
              description={
                canEdit
                  ? "Davomat belgilangach jadval shu yerda paydo bo'ladi."
                  : "Hozircha davomat belgilanmagan."
              }
              action={
                canEdit ? (
                  <ButtonLink href={attendanceHref} size="sm">
                    Davomat belgilash
                  </ButtonLink>
                ) : null
              }
            />
          </div>
        ) : (
          <>
            <div className="max-h-[72vh] overflow-auto">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-30 min-w-44 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Talaba
                    </th>
                    {dates.map((date) => {
                      const parts = journalDateParts(date);
                      return (
                        <th
                          key={date}
                          className="sticky top-0 z-20 min-w-11 border-b border-slate-200 bg-slate-50 px-1 py-1.5 text-center align-bottom"
                        >
                          <span className="block text-[11px] font-semibold tabular-nums text-slate-700">
                            {parts.label}
                          </span>
                          <span className="block text-[10px] font-normal text-slate-400">
                            {parts.weekday}
                          </span>
                        </th>
                      );
                    })}
                    <th className="sticky right-0 top-0 z-30 min-w-28 border-b border-l border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Keldi %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const isMe = student.id === currentUserId;
                    const rowSummary = summary[student.id] ?? EMPTY_SUMMARY;
                    const rowBg = isMe ? "bg-brand-50" : "bg-white group-hover:bg-slate-50";
                    return (
                      <tr key={student.id} className="group">
                        <th
                          scope="row"
                          className={cn(
                            "sticky left-0 z-10 border-b border-r border-slate-100 px-3 py-1.5 text-left font-normal transition-colors duration-150",
                            rowBg,
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={student.name}
                              src={student.avatarUrl}
                              className="size-7! text-[10px]"
                            />
                            <span
                              className={cn(
                                "truncate text-sm font-medium text-slate-800",
                                isMe && "text-brand-900",
                              )}
                            >
                              {student.name}
                            </span>
                            {isMe ? (
                              <span className="shrink-0 text-[10px] font-semibold text-brand-600">
                                (siz)
                              </span>
                            ) : null}
                          </div>
                        </th>
                        {dates.map((date) => {
                          const status = records[student.id]?.[date] ?? null;
                          const meta = status ? JOURNAL_STATUS_META[status] : null;
                          return (
                            <td key={date} className="border-b border-slate-100 px-1 py-1.5 text-center">
                              <button
                                type="button"
                                disabled={!canEdit}
                                title={meta ? meta.label : "Belgilanmagan"}
                                onClick={(event) => openEditor(event, student.id, date)}
                                className={cn(
                                  "mx-auto flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-[10px] font-semibold transition-all duration-150",
                                  meta ? meta.chip : "text-slate-300",
                                  canEdit
                                    ? "cursor-pointer hover:ring-2 hover:ring-brand-300/70"
                                    : "cursor-default",
                                )}
                              >
                                {meta ? meta.short : "·"}
                              </button>
                            </td>
                          );
                        })}
                        <td
                          className={cn(
                            "sticky right-0 z-10 border-b border-l border-slate-100 px-3 py-1.5 transition-colors duration-150",
                            rowBg,
                          )}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-semibold tabular-nums text-slate-700">
                              {rowSummary.percent}%
                            </span>
                            <Badge
                              tone={rowSummary.eligible ? "green" : "rose"}
                              className="px-1.5 py-0.5 text-[10px]"
                            >
                              {rowSummary.eligible ? "Ruxsat" : "Ruxsat yo'q"}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="sticky left-0 z-10 border-r border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
                      Keldi / jami
                    </td>
                    {dates.map((date) => {
                      const totalsForDate = totals[date] ?? { attended: 0, total: 0 };
                      return (
                        <td
                          key={date}
                          className="bg-slate-50/80 px-1 py-2 text-center text-[10px] font-medium tabular-nums text-slate-500"
                        >
                          {totalsForDate.attended}/{totalsForDate.total}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 border-l border-slate-100 bg-slate-50 px-3 py-2 text-right text-[10px] font-semibold tabular-nums text-slate-500">
                      {overall.attended}/{overall.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Legenda:</span>
              {JOURNAL_STATUS_ORDER.map((status) => {
                const meta = JOURNAL_STATUS_META[status];
                return (
                  <span key={status} className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[9px] font-semibold",
                        meta.chip,
                      )}
                    >
                      {meta.short}
                    </span>
                    {meta.label}
                  </span>
                );
              })}
              <span className="ml-auto text-slate-400">
                {canEdit ? "Tahrirlash uchun katak ustiga bosing" : "Faqat ko'rish"}
              </span>
            </div>
          </>
        )}
      </Card>

      {editor ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setEditor(null)} />
          <div
            className="fixed z-50 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
            style={{ top: editor.top, left: editor.left }}
          >
            <p className="truncate px-2 pb-1.5 text-[11px] font-medium text-slate-400">
              {editingStudent?.name ?? ""} · {journalDateParts(editor.date).label}
            </p>
            <div className="flex gap-1">
              {JOURNAL_STATUS_ORDER.map((status) => {
                const meta = JOURNAL_STATUS_META[status];
                return (
                  <button
                    key={status}
                    type="button"
                    title={meta.label}
                    onClick={() => {
                      void saveStatus(status);
                    }}
                    className={cn(
                      "flex h-8 flex-1 items-center justify-center rounded-lg text-[10px] font-semibold transition-all duration-150 hover:brightness-95",
                      meta.chip,
                      editingStatus === status && "ring-2 ring-brand-400",
                    )}
                  >
                    {meta.short}
                  </button>
                );
              })}
            </div>
            {editingStatus ? (
              <button
                type="button"
                onClick={() => {
                  void clearStatus();
                }}
                className="mt-1 w-full rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                Tozalash
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {error || message ? (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-50 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg",
            error ? "bg-rose-600" : "bg-brand-900",
          )}
        >
          {error ?? message}
        </div>
      ) : null}
    </>
  );
}
