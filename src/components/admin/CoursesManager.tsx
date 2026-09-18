"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Select, Table } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";

export type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isElective?: boolean;
  createdAt: Date;
  teacher: { id: string; name: string };
  studentCount: number;
};

export type TeacherOption = { id: string; name: string; email: string };

type ApiResult = { ok: boolean; error?: string };

function ToggleSwitch({
  checked,
  disabled,
  onToggle,
  label,
  tone,
}: {
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
  tone: "emerald" | "amber";
}) {
  const active =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  const knob = tone === "emerald" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? active
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-150",
          checked ? knob : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "inline-block size-3 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-150",
            checked && "translate-x-3.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}

export default function CoursesManager({
  courses,
  teachers,
}: {
  courses: AdminCourse[];
  teachers: TeacherOption[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [electiveOverrides, setElectiveOverrides] = useState<Record<string, boolean>>({});

  const search = query.trim().toLowerCase();
  const filtered = search
    ? courses.filter(
        (course) =>
          course.title.toLowerCase().includes(search) ||
          course.slug.toLowerCase().includes(search) ||
          course.teacher.name.toLowerCase().includes(search),
      )
    : courses;

  async function send(id: string, body?: unknown, method: "PATCH" | "DELETE" = "PATCH") {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json().catch(() => null)) as ApiResult | null;
      if (!res.ok || !json || !json.ok) {
        setError(json?.error ?? "Amalni bajarib bo'lmadi");
        return null;
      }
      return json;
    } catch {
      setError("Tarmoqda xatolik");
      return null;
    } finally {
      setBusyId(null);
    }
  }

  function isElective(course: AdminCourse) {
    return electiveOverrides[course.id] ?? course.isElective ?? false;
  }

  async function togglePublish(course: AdminCourse) {
    const json = await send(course.id, { isPublished: !course.isPublished });
    if (!json) return;
    setNotice(course.isPublished ? "Kurs yashirildi" : "Kurs e'lon qilindi");
    router.refresh();
  }

  async function toggleElective(course: AdminCourse) {
    const next = !isElective(course);
    const json = await send(course.id, { isElective: next });
    if (!json) return;
    setElectiveOverrides((prev) => ({ ...prev, [course.id]: next }));
    setNotice(next ? "Kurs tanlov fan sifatida belgilandi" : "Kurs tanlov fanlardan chiqarildi");
    router.refresh();
  }

  async function assignTeacher(course: AdminCourse, teacherId: string) {
    if (teacherId === course.teacher.id) return;
    const json = await send(course.id, { teacherId });
    if (!json) return;
    setNotice("O'qituvchi biriktirildi");
    router.refresh();
  }

  async function remove(course: AdminCourse) {
    if (!window.confirm(`"${course.title}" kursi o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.`)) return;
    const json = await send(course.id, undefined, "DELETE");
    if (!json) return;
    setNotice("Kurs o'chirildi");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kurs yoki o'qituvchi qidirish..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {notice ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {notice}
            </span>
          ) : null}
          {error ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
              {error}
            </span>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader title="Kurslar" subtitle={`${filtered.length} ta`} />
        {courses.length === 0 ? (
          <CardBody>
            <EmptyState title="Kurslar yo'q" description="Kurslar Komp 2 moduli orqali yaratiladi." />
          </CardBody>
        ) : filtered.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Hech narsa topilmadi"
              description={`"${query.trim()}" bo'yicha kurs topilmadi.`}
              action={
                <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                  Tozalash
                </Button>
              }
            />
          </CardBody>
        ) : (
          <Table className="max-h-[68vh] overflow-y-auto">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Kurs</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">O&apos;qituvchi</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Talabalar</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Holat</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Yaratilgan</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 text-right font-semibold backdrop-blur">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((course) => {
                const currentTeacher = teachers.find((t) => t.id === course.teacher.id);
                return (
                  <tr
                    key={course.id}
                    className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">{course.title}</span>
                          <span className="block truncate text-xs text-slate-400">{course.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={course.teacher.name} className="size-7 text-[10px]" />
                        <Select
                          value={course.teacher.id}
                          disabled={busyId === course.id}
                          onChange={(e) => assignTeacher(course, e.target.value)}
                          className="max-w-44 rounded-lg py-1.5 text-xs"
                        >
                          {!currentTeacher ? (
                            <option value={course.teacher.id}>{course.teacher.name}</option>
                          ) : null}
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={course.studentCount > 0 ? "blue" : "slate"} className="gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {course.studentCount} ta
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <ToggleSwitch
                          checked={course.isPublished}
                          disabled={busyId === course.id}
                          onToggle={() => togglePublish(course)}
                          label={course.isPublished ? "E'lon qilingan" : "Qoralama"}
                          tone="emerald"
                        />
                        <ToggleSwitch
                          checked={isElective(course)}
                          disabled={busyId === course.id}
                          onToggle={() => toggleElective(course)}
                          label="Tanlov fan"
                          tone="amber"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(course.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          disabled={busyId === course.id}
                          onClick={() => remove(course)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                          O&apos;chirish
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
