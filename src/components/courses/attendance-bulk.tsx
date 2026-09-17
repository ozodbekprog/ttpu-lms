"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Card, CardBody, CardHeader, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

export type AttendanceStatusValue = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

const OPTIONS: {
  value: AttendanceStatusValue;
  short: string;
  label: string;
  active: string;
}[] = [
  { value: "PRESENT", short: "P", label: "Bor", active: "bg-emerald-500 text-white shadow-sm" },
  { value: "ABSENT", short: "A", label: "Yo'q", active: "bg-rose-500 text-white shadow-sm" },
  { value: "LATE", short: "L", label: "Kechikkan", active: "bg-amber-500 text-white shadow-sm" },
  { value: "EXCUSED", short: "E", label: "Sababli", active: "bg-brand-600 text-white shadow-sm" },
];

function todayIso() {
  const date = new Date();
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function AttendanceBulk({
  courseId,
  students,
  entries,
}: {
  courseId: string;
  students: { id: string; name: string }[];
  entries: { studentId: string; date: string; status: AttendanceStatusValue }[];
}) {
  const router = useRouter();
  const [date, setDate] = useState(todayIso());
  const [draft, setDraft] = useState<Record<string, AttendanceStatusValue>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const saved = useMemo(() => {
    const byDate: Record<string, Record<string, AttendanceStatusValue>> = {};
    for (const entry of entries) {
      byDate[entry.date] = byDate[entry.date] ?? {};
      byDate[entry.date][entry.studentId] = entry.status;
    }
    return byDate;
  }, [entries]);

  function statusOf(studentId: string) {
    return draft[studentId] ?? saved[date]?.[studentId] ?? "PRESENT";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/courses/${courseId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        entries: students.map((student) => ({
          studentId: student.id,
          status: statusOf(student.id),
        })),
      }),
    });
    const json = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;

    setSaving(false);
    if (!response.ok || !json?.ok) {
      setError(json?.error ?? "Saqlashda xatolik yuz berdi");
      return;
    }

    setDraft({});
    setMessage("Davomat saqlandi");
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Davomat belgilash" subtitle={`${students.length} ta talaba`} />
      <CardBody>
        {students.length === 0 ? (
          <p className="text-sm text-slate-500">Kursda talaba yo&apos;q.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="max-w-xs">
              <Label>Sana</Label>
              <Input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setDraft({});
                  setMessage(null);
                }}
                required
              />
              <p className="mt-1.5 text-xs text-slate-400 sm:hidden">
                P — Bor, A — Yo&apos;q, L — Kechikkan, E — Sababli
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              {students.map((student) => {
                const status = statusOf(student.id);
                return (
                  <div
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 transition-colors duration-150 last:border-0 hover:bg-slate-50/70 sm:px-4"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={student.name} className="size-8! text-[10px]" />
                      <span className="truncate text-sm font-medium text-slate-800">
                        {student.name}
                      </span>
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                      {OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          title={option.label}
                          onClick={() =>
                            setDraft((prev) => ({ ...prev, [student.id]: option.value }))
                          }
                          className={cn(
                            "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 sm:px-3",
                            status === option.value
                              ? option.active
                              : "text-slate-500 hover:bg-white hover:text-slate-700",
                          )}
                        >
                          <span className="sm:hidden">{option.short}</span>
                          <span className="hidden sm:inline">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {error ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            ) : null}
            {message ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
