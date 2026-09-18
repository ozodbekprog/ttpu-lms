"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Avatar, Badge, ButtonLink, Card, CardHeader, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  JOURNAL_MIN_PERCENT,
  JOURNAL_STATUS_META,
  JOURNAL_STATUS_ORDER,
  journalDateParts,
  journalMonthKey,
  journalMonthKeys,
  journalMonthLabel,
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

function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function subscribeToday() {
  return () => {};
}

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
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const today = useSyncExternalStore(subscribeToday, localToday, () => null);

  const months = useMemo(() => journalMonthKeys(dates), [dates]);
  const activeMonth = monthKey && months.includes(monthKey) ? monthKey : months[months.length - 1] ?? null;
  const monthIndex = activeMonth ? months.indexOf(activeMonth) : -1;
  const todayMonth = today ? journalMonthKey(today) : null;
  const visibleDates = useMemo(
    () => (activeMonth ? dates.filter((date) => journalMonthKey(date) === activeMonth) : dates),
    [dates, activeMonth],
  );

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
    for (const date of visibleDates) map[date] = { attended: 0, total: 0 };
    for (const student of students) {
      const row = records[student.id];
      if (!row) continue;
      for (const date of visibleDates) {
        const status = row[date];
        if (!status) continue;
        const entry = map[date];
        if (!entry) continue;
        entry.total += 1;
        if (status !== "ABSENT") entry.attended += 1;
      }
    }
    return map;
  }, [records, visibleDates, students]);

  const overall = useMemo(() => {
    let attended = 0;
    let total = 0;
    for (const date of visibleDates) {
      attended += totals[date]?.attended ?? 0;
      total += totals[date]?.total ?? 0;
    }
    return { attended, total };
  }, [visibleDates, totals]);

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
          action={
            months.length > 0 ? (
              <div className="flex items-center gap-2">
                {todayMonth && months.includes(todayMonth) && activeMonth !== todayMonth ? (
                  <button
                    type="button"
                    onClick={() => setMonthKey(todayMonth)}
                    className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors duration-150 hover:bg-brand-100"
                  >
                    Bugun
                  </button>
                ) : null}
                <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white p-1 shadow-[0_2px_8px_-4px_rgba(29,52,96,0.25)]">
                  <button
                    type="button"
                    aria-label="Oldingi oy"
                    disabled={monthIndex <= 0}
                    onClick={() => setMonthKey(months[monthIndex - 1] ?? activeMonth)}
                    className="flex size-7 items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m14 6-6 6 6 6" />
                    </svg>
                  </button>
                  <span className="min-w-24 px-1 text-center text-xs font-semibold text-slate-700">
                    {activeMonth ? journalMonthLabel(activeMonth) : ""}
                  </span>
                  <button
                    type="button"
                    aria-label="Keyingi oy"
                    disabled={monthIndex < 0 || monthIndex >= months.length - 1}
                    onClick={() => setMonthKey(months[monthIndex + 1] ?? activeMonth)}
                    className="flex size-7 items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m10 6 6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : null
          }
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
                    <th className="sticky left-0 top-0 z-30 min-w-36 border-b border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-[2px_0_10px_-8px_rgba(15,23,42,0.45)] sm:min-w-44">
                      Talaba
                    </th>
                    {visibleDates.map((date) => {
                      const parts = journalDateParts(date);
                      const isToday = date === today;
                      return (
                        <th
                          key={date}
                          className={cn(
                            "sticky top-0 z-20 min-w-10 border-b border-slate-200 bg-slate-50 px-1 py-2 text-center align-bottom",
                            isToday &&
                              "border-x border-brand-100 bg-gradient-to-b from-brand-100/70 to-brand-50",
                          )}
                        >
                          <span
                            className={cn(
                              "block text-[11px] font-semibold tabular-nums text-slate-700",
                              isToday && "text-brand-700",
                            )}
                          >
                            {parts.label}
                          </span>
                          <span
                            className={cn(
                              "block text-[10px] font-normal text-slate-400",
                              isToday && "font-semibold text-brand-500",
                            )}
                          >
                            {isToday ? "Bugun" : parts.weekday}
                          </span>
                        </th>
                      );
                    })}
                    <th className="sticky right-0 top-0 z-30 min-w-28 border-b border-l border-slate-200 bg-slate-50 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-[-2px_0_10px_-8px_rgba(15,23,42,0.45)]">
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
                            "sticky left-0 z-10 border-b border-r border-slate-100 px-3 py-1.5 text-left font-normal shadow-[2px_0_10px_-8px_rgba(15,23,42,0.35)] transition-colors duration-150",
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
                                "max-w-24 truncate text-sm font-medium text-slate-800 sm:max-w-none",
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
                        {visibleDates.map((date) => {
                          const status = records[student.id]?.[date] ?? null;
                          const meta = status ? JOURNAL_STATUS_META[status] : null;
                          const isToday = date === today;
                          return (
                            <td
                              key={date}
                              className={cn(
                                "border-b border-slate-100 px-1 py-1.5 text-center",
                                isToday && "border-x border-brand-100/70 bg-gradient-to-b from-brand-50/70 to-brand-50/30",
                              )}
                            >
                              <button
                                type="button"
                                disabled={!canEdit}
                                title={meta ? meta.label : "Belgilanmagan"}
                                onClick={(event) => openEditor(event, student.id, date)}
                                className={cn(
                                  "mx-auto flex size-8 items-center justify-center rounded-full text-[9px] font-semibold leading-none transition-all duration-150",
                                  meta ? meta.badge : "bg-slate-100 shadow-inner",
                                  canEdit
                                    ? "cursor-pointer hover:scale-110 hover:shadow-md hover:ring-2 hover:ring-brand-300/70 hover:ring-offset-1 active:scale-95"
                                    : "cursor-default",
                                )}
                              >
                                {meta ? (
                                  meta.short
                                ) : (
                                  <span className="size-1.5 rounded-full bg-slate-300" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td
                          className={cn(
                            "sticky right-0 z-10 border-b border-l border-slate-100 px-3 py-1.5 shadow-[-2px_0_10px_-8px_rgba(15,23,42,0.35)] transition-colors duration-150",
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
                    <td className="sticky left-0 z-10 border-r border-slate-100 bg-slate-50 px-3 py-2.5 text-[11px] font-medium text-slate-500 shadow-[2px_0_10px_-8px_rgba(15,23,42,0.35)]">
                      Keldi / jami
                    </td>
                    {visibleDates.map((date) => {
                      const totalsForDate = totals[date] ?? { attended: 0, total: 0 };
                      return (
                        <td
                          key={date}
                          className={cn(
                            "bg-slate-50/80 px-1 py-2 text-center text-[10px] font-medium tabular-nums text-slate-500",
                            date === today &&
                              "border-x border-brand-100/70 bg-brand-50/80 font-semibold text-brand-700",
                          )}
                        >
                          {totalsForDate.attended}/{totalsForDate.total}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 border-l border-slate-100 bg-slate-50 px-3 py-2.5 text-right text-[10px] font-semibold tabular-nums text-slate-500 shadow-[-2px_0_10px_-8px_rgba(15,23,42,0.35)]">
                      {overall.attended}/{overall.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 sm:px-6">
              <span className="font-medium text-slate-600">Legenda:</span>
              {JOURNAL_STATUS_ORDER.map((status) => {
                const meta = JOURNAL_STATUS_META[status];
                return (
                  <span key={status} className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-[10px] font-semibold leading-none",
                        meta.badge,
                      )}
                    >
                      {meta.short}
                    </span>
                    {meta.label}
                  </span>
                );
              })}
              <span className="inline-flex items-center gap-1.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 shadow-inner">
                  <span className="size-1.5 rounded-full bg-slate-300" />
                </span>
                Belgilanmagan
              </span>
              <span className="ml-auto hidden text-slate-400 sm:inline">
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
            className="animate-fade-up fixed z-50 w-48 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl ring-1 ring-slate-900/5 backdrop-blur"
            style={{ top: editor.top, left: editor.left }}
          >
            <p className="truncate px-2 pb-1.5 text-[11px] font-medium text-slate-400">
              {editingStudent?.name ?? ""} · {journalDateParts(editor.date).label}
            </p>
            <div className="flex justify-between gap-1">
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
                      "flex size-10 items-center justify-center rounded-full text-[10px] font-semibold leading-none transition-all duration-150 hover:scale-105 hover:brightness-95 active:scale-95",
                      meta.badge,
                      editingStatus === status && "ring-2 ring-brand-500 ring-offset-2",
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
                className="mt-1.5 w-full rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
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
