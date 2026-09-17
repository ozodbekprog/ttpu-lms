"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Card, CardBody, CardHeader, Label, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CourseOption } from "@/components/attendance/lesson-utils";

export type LessonStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type LessonStudent = {
  id: string;
  name: string;
  avatarUrl: string | null;
  groupName: string | null;
};

const OPTIONS: { value: LessonStatus; short: string; label: string; active: string }[] = [
  { value: "PRESENT", short: "K", label: "Keldi", active: "bg-emerald-500 text-white shadow-sm" },
  { value: "ABSENT", short: "Y", label: "Yo'q", active: "bg-rose-500 text-white shadow-sm" },
  { value: "LATE", short: "Kech", label: "Kechikkan", active: "bg-amber-500 text-white shadow-sm" },
  { value: "EXCUSED", short: "S", label: "Sababli", active: "bg-slate-500 text-white shadow-sm" },
];

export function LessonAttendance({
  courseId,
  date,
  slot,
  students,
  initial,
  courses,
  selectedSlug,
}: {
  courseId: string;
  date: string;
  slot: number;
  students: LessonStudent[];
  initial: Record<string, LessonStatus>;
  courses: CourseOption[];
  selectedSlug: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, LessonStatus>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const statuses = useMemo(() => {
    const map: Record<string, LessonStatus> = {};
    for (const student of students) {
      map[student.id] = draft[student.id] ?? initial[student.id] ?? "PRESENT";
    }
    return map;
  }, [draft, initial, students]);

  const counts = useMemo(() => {
    const summary: Record<LessonStatus, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };
    for (const student of students) {
      summary[statuses[student.id] ?? "PRESENT"] += 1;
    }
    return summary;
  }, [statuses, students]);

  function setStatus(studentId: string, status: LessonStatus) {
    setDraft((prev) => ({ ...prev, [studentId]: status }));
    setMessage(null);
  }

  function markAllPresent() {
    const next: Record<string, LessonStatus> = {};
    for (const student of students) {
      next[student.id] = "PRESENT";
    }
    setDraft(next);
    setMessage(null);
  }

  function switchCourse(slug: string) {
    if (slug === selectedSlug) return;
    router.push(`/courses/${slug}/attendance/lesson?date=${date}&slot=${slot}`);
  }

  async function save() {
    if (students.length === 0) return;
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
          status: statuses[student.id] ?? "PRESENT",
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
      <CardHeader
        title="Talabalar"
        subtitle={`${students.length} ta · ${counts.PRESENT} keldi · ${counts.LATE} kech · ${counts.ABSENT} yo'q · ${counts.EXCUSED} sababli`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllPresent}
              disabled={saving || students.length === 0}
            >
              Hammasi keldi
            </Button>
            <Button
              onClick={() => {
                void save();
              }}
              disabled={saving || students.length === 0}
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        }
      />
      <CardBody className="space-y-5">
        {courses.length > 1 ? (
          <div className="max-w-sm">
            <Label>Kurs</Label>
            <Select value={selectedSlug} onChange={(event) => switchCourse(event.target.value)}>
              {courses.map((course) => (
                <option key={course.slug} value={course.slug}>
                  {course.title}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {students.length === 0 ? (
          <p className="text-sm text-slate-500">Kursda talaba yo&apos;q.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {students.map((student) => {
              const status = statuses[student.id] ?? "PRESENT";
              return (
                <div
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 transition-colors duration-150 last:border-0 hover:bg-slate-50/70 sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={student.name} src={student.avatarUrl} className="size-8! text-[10px]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{student.name}</p>
                      {student.groupName ? (
                        <p className="text-xs text-slate-400">{student.groupName}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="inline-flex shrink-0 items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                    {OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        title={option.label}
                        onClick={() => setStatus(student.id, option.value)}
                        className={cn(
                          "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 sm:px-3",
                          status === option.value
                            ? option.active
                            : "text-slate-500 hover:bg-white hover:text-slate-700",
                        )}
                      >
                        {option.short}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
        ) : null}

        <p className="text-xs text-slate-400">
          QR orqali belgilanganlar avtomatik &quot;Keldi&quot; bo&apos;lib turadi.
        </p>
      </CardBody>
    </Card>
  );
}
