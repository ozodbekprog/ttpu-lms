"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Card, CardBody, CardHeader, Label, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CourseOption } from "@/components/attendance/lesson-utils";

export type LessonStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "SUSPICIOUS";

export type LessonStudent = {
  id: string;
  name: string;
  avatarUrl: string | null;
  groupName: string | null;
  subGroupName: string | null;
};

const OPTIONS: {
  value: LessonStatus;
  short: string;
  label: string;
  active: string;
  idle: string;
  dot: string;
}[] = [
  {
    value: "PRESENT",
    short: "K",
    label: "Keldi",
    active: "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-1 ring-emerald-400/60",
    idle: "text-emerald-700 hover:bg-emerald-50",
    dot: "bg-emerald-500",
  },
  {
    value: "ABSENT",
    short: "Y",
    label: "Yo'q",
    active: "bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-1 ring-rose-400/60",
    idle: "text-rose-700 hover:bg-rose-50",
    dot: "bg-rose-500",
  },
  {
    value: "LATE",
    short: "Kech",
    label: "Kechikkan",
    active: "bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-1 ring-amber-400/60",
    idle: "text-amber-700 hover:bg-amber-50",
    dot: "bg-amber-500",
  },
  {
    value: "EXCUSED",
    short: "S",
    label: "Sababli",
    active: "bg-slate-500 text-white shadow-md shadow-slate-500/30 ring-1 ring-slate-400/60",
    idle: "text-slate-600 hover:bg-slate-100",
    dot: "bg-slate-400",
  },
  {
    value: "SUSPICIOUS",
    short: "Sh",
    label: "Shubhali",
    active: "bg-violet-500 text-white shadow-md shadow-violet-500/30 ring-1 ring-violet-400/60",
    idle: "text-violet-700 hover:bg-violet-50",
    dot: "bg-violet-500",
  },
];

function StatusGlyph({ status, size = 13 }: { status: LessonStatus; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  if (status === "PRESENT") {
    return (
      <svg {...common}>
        <path d="m5 13 4 4L19 7" />
      </svg>
    );
  }
  if (status === "ABSENT") {
    return (
      <svg {...common}>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    );
  }
  if (status === "LATE") {
    return (
      <svg {...common} strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  return (
    <svg {...common} strokeWidth={2}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

export function LessonAttendance({
  courseId,
  date,
  slot,
  students,
  initial,
  courses,
  selectedSlug,
  subGroup,
  cancelled,
}: {
  courseId: string;
  date: string;
  slot: number;
  students: LessonStudent[];
  initial: Record<string, LessonStatus>;
  courses: CourseOption[];
  selectedSlug: string;
  subGroup: string | null;
  cancelled: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, LessonStatus>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleStudents = useMemo(
    () => (subGroup ? students.filter((student) => student.subGroupName === subGroup) : students),
    [students, subGroup],
  );

  const statuses = useMemo(() => {
    const map: Record<string, LessonStatus> = {};
    for (const student of visibleStudents) {
      map[student.id] = draft[student.id] ?? initial[student.id] ?? "PRESENT";
    }
    return map;
  }, [draft, initial, visibleStudents]);

  const counts = useMemo(() => {
    const summary: Record<LessonStatus, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
      SUSPICIOUS: 0,
    };
    for (const student of visibleStudents) {
      summary[statuses[student.id] ?? "PRESENT"] += 1;
    }
    return summary;
  }, [statuses, visibleStudents]);

  function setStatus(studentId: string, status: LessonStatus) {
    setDraft((prev) => ({ ...prev, [studentId]: status }));
    setMessage(null);
  }

  function markAllPresent() {
    const next: Record<string, LessonStatus> = {};
    for (const student of visibleStudents) {
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
    if (cancelled || visibleStudents.length === 0) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/courses/${courseId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        entries: visibleStudents.map((student) => ({
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
    <>
      <Card className="animate-fade-up">
        <CardHeader
          title="Talabalar"
          subtitle={
            cancelled
              ? "Dars bekor qilingan — davomat belgilanmaydi"
              : subGroup
                ? `${visibleStudents.length} ta talaba · ${subGroup} kichik guruh`
                : `${visibleStudents.length} ta talaba · holatni belgilang`
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

          {visibleStudents.length === 0 ? (
            <p className="text-sm text-slate-500">
              {subGroup ? `${subGroup} kichik guruhda talaba yo'q.` : "Kursda talaba yo'q."}
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              {visibleStudents.map((student) => {
                const status = statuses[student.id] ?? "PRESENT";
                const activeOption = OPTIONS.find((option) => option.value === status);
                return (
                  <div
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 transition-colors duration-150 last:border-0 hover:bg-slate-50/70 sm:px-4"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={student.name} src={student.avatarUrl} className="size-8! text-[10px]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{student.name}</p>
                        <p className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span className={cn("size-1.5 rounded-full", activeOption?.dot)} />
                          {student.subGroupName ?? student.groupName ?? activeOption?.label}
                        </p>
                      </div>
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1">
                      {OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          title={option.label}
                          onClick={() => setStatus(student.id, option.value)}
                          disabled={cancelled}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold transition-all duration-150 sm:px-2.5",
                            status === option.value
                              ? option.active
                              : cn("hover:shadow-sm", option.idle),
                            cancelled && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <StatusGlyph status={option.value} />
                          <span>{option.short}</span>
                          <span className="hidden md:inline">{option.label}</span>
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

          <p className="text-xs text-slate-600">
            QR orqali belgilanganlar avtomatik &quot;Keldi&quot; bo&apos;lib turadi.
          </p>
        </CardBody>
      </Card>

      {visibleStudents.length > 0 ? (
        <div className="sticky bottom-4 z-20 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-lift backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              {OPTIONS.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  <span className={cn("size-1.5 rounded-full", option.dot)} />
                  <span className="font-semibold tabular-nums text-slate-800">
                    {counts[option.value]}
                  </span>
                  {option.label}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="lg"
                onClick={markAllPresent}
                disabled={saving || cancelled || visibleStudents.length === 0}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 13 3 3L15 7" />
                  <path d="m11 15 2 2 8-8" />
                </svg>
                Hammasi keldi
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  void save();
                }}
                disabled={saving || cancelled || visibleStudents.length === 0}
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
