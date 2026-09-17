"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label, Select } from "@/components/ui";

export type AttendanceStatusValue = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

const OPTIONS: { value: AttendanceStatusValue; label: string }[] = [
  { value: "PRESENT", label: "Bor" },
  { value: "ABSENT", label: "Yo'q" },
  { value: "LATE", label: "Kechikkan" },
  { value: "EXCUSED", label: "Sababli" },
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
    <Card>
      <CardHeader title="Davomat belgilash" subtitle={`${students.length} ta talaba`} />
      <CardBody>
        {students.length === 0 ? (
          <p className="text-sm text-slate-500">Kursda talaba yo&apos;q.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
            </div>
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="text-sm text-slate-800">{student.name}</span>
                  <Select
                    className="w-36"
                    value={statusOf(student.id)}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        [student.id]: event.target.value as AttendanceStatusValue,
                      }))
                    }
                  >
                    {OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
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
