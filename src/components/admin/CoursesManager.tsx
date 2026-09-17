"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Select, Table } from "@/components/ui";
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
      <div className="flex flex-wrap items-center gap-3">
        {notice ? <span className="text-sm text-emerald-600">{notice}</span> : null}
        {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      </div>

      <Card>
        <CardHeader title="Kurslar" subtitle={`${courses.length} ta`} />
        {courses.length === 0 ? (
          <CardBody>
            <EmptyState title="Kurslar yo'q" description="Kurslar Komp 2 moduli orqali yaratiladi." />
          </CardBody>
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Kurs</th>
                <th className="px-5 py-3 font-medium">O'qituvchi</th>
                <th className="px-5 py-3 font-medium">Talabalar</th>
                <th className="px-5 py-3 font-medium">Holat</th>
                <th className="px-5 py-3 font-medium">Yaratilgan</th>
                <th className="px-5 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const currentTeacher = teachers.find((t) => t.id === course.teacher.id);
                return (
                  <tr key={course.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900">{course.title}</span>
                      <span className="block text-xs text-slate-500">{course.slug}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Select
                        value={course.teacher.id}
                        disabled={busyId === course.id}
                        onChange={(e) => assignTeacher(course, e.target.value)}
                        className="max-w-52"
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
                    </td>
                    <td className="px-5 py-3 text-slate-600">{course.studentCount}</td>
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
                          className="text-rose-600 hover:bg-rose-50"
                          disabled={busyId === course.id}
                          onClick={() => remove(course)}
                        >
                          O'chirish
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
