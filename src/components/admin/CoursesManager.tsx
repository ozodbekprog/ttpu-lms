"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Select, Table } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: Date;
  teacher: { id: string; name: string };
  studentCount: number;
};

export type TeacherOption = { id: string; name: string; email: string };

type ApiResult = { ok: boolean; error?: string };

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

  async function togglePublish(course: AdminCourse) {
    const json = await send(course.id, { isPublished: !course.isPublished });
    if (!json) return;
    setNotice(course.isPublished ? "Kurs yashirildi" : "Kurs e'lon qilindi");
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
          <Table>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-semibold">Kurs</th>
                <th className="px-5 py-3 font-semibold">O&apos;qituvchi</th>
                <th className="px-5 py-3 font-semibold">Talabalar</th>
                <th className="px-5 py-3 font-semibold">Holat</th>
                <th className="px-5 py-3 font-semibold">Yaratilgan</th>
                <th className="px-5 py-3 text-right font-semibold">Amallar</th>
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
                          className="max-w-44"
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
                      <Badge tone="slate">{course.studentCount} ta</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={course.isPublished ? "green" : "amber"}>
                        {course.isPublished ? "E'lon qilingan" : "Qoralama"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(course.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === course.id}
                          onClick={() => togglePublish(course)}
                        >
                          {course.isPublished ? "Yashirish" : "E'lon qilish"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          disabled={busyId === course.id}
                          onClick={() => remove(course)}
                        >
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
