"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Select,
  Table,
} from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export type CourseStudent = {
  id: string;
  courseId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    group: { name: string } | null;
  };
};

type AvailableStudent = {
  id: string;
  name: string;
  email: string;
  group: { name: string } | null;
  isEnrolled: boolean;
};

type StudentsResponse = {
  ok?: boolean;
  error?: string;
  data?: { students?: AvailableStudent[] };
};

type EnrollmentResponse = { ok?: boolean; error?: string } | null;

export function CourseStudents({
  courseId,
  enrollments,
}: {
  courseId?: string;
  enrollments: CourseStudent[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameCourse = pathname.split("/").filter(Boolean)[1] ?? null;
  const resolvedCourseId = courseId ?? enrollments[0]?.courseId ?? pathnameCourse;

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [students, setStudents] = useState<AvailableStudent[] | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  async function loadStudents() {
    if (!resolvedCourseId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${resolvedCourseId}/enrollments`);
      const json = (await res.json().catch(() => null)) as StudentsResponse;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Talabalar ro'yxatini yuklab bo'lmadi");
        return;
      }
      setStudents(json.data?.students ?? []);
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setAdding(true);
    setError(null);
    if (students === null) void loadStudents();
  }

  async function addStudent() {
    if (!resolvedCourseId || !selectedId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${resolvedCourseId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedId }),
      });
      const json = (await res.json().catch(() => null)) as EnrollmentResponse;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Talabani qo'shib bo'lmadi");
        return;
      }
      setStudents((prev) =>
        prev ? prev.map((s) => (s.id === selectedId ? { ...s, isEnrolled: true } : s)) : prev,
      );
      setSelectedId("");
      setQuery("");
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  async function removeStudent(enrollmentId: string, userId: string, name: string) {
    if (busy) return;
    if (!window.confirm(`${name} kursdan chiqarilsinmi?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as EnrollmentResponse;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Talabani chiqarib bo'lmadi");
        return;
      }
      setStudents((prev) =>
        prev ? prev.map((s) => (s.id === userId ? { ...s, isEnrolled: false } : s)) : prev,
      );
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  const normalized = query.trim().toLowerCase();
  const options = (students ?? []).filter((student) => {
    if (!normalized) return true;
    return (
      student.name.toLowerCase().includes(normalized) ||
      student.email.toLowerCase().includes(normalized)
    );
  });

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>
      ) : null}

      {resolvedCourseId ? (
        adding ? (
          <Card>
            <CardHeader title="Talaba qo'shish" subtitle="Talabani ism yoki email bo'yicha toping" />
            <CardBody className="flex flex-wrap items-end gap-3">
              <div className="min-w-52 flex-1">
                <Label>Qidiruv</Label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ism yoki email"
                />
              </div>
              <div className="min-w-52 flex-1">
                <Label>Talaba</Label>
                <Select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">{loading ? "Yuklanmoqda..." : "Talabani tanlang"}</option>
                  {options.map((student) => (
                    <option key={student.id} value={student.id} disabled={student.isEnrolled}>
                      {student.name} — {student.email}
                      {student.group ? ` (${student.group.name})` : ""}
                      {student.isEnrolled ? " — yozilgan" : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <Button onClick={addStudent} disabled={busy || loading || !selectedId}>
                {"Qo'shish"}
              </Button>
              <Button variant="secondary" onClick={() => setAdding(false)}>
                Bekor
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="flex justify-end">
            <Button onClick={openAdd}>{"+ Talaba qo'shish"}</Button>
          </div>
        )
      ) : null}

      {enrollments.length === 0 ? (
        <EmptyState title="Talabalar yo'q" description="Bu kursga hali talaba yozilmagan." />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader title="Talabalar" subtitle={`${enrollments.length} ta yozilgan`} />
          <Table>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Talaba</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Guruh</th>
                <th className="px-5 py-3 font-medium">Yozilgan</th>
                <th className="px-5 py-3 font-medium">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((enrollment, index) => (
                <tr key={enrollment.id} className="transition-colors duration-150 hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <span className="inline-flex size-6 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={enrollment.user.name} className="size-8! text-[10px]" />
                      <span className="font-medium text-slate-800">{enrollment.user.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{enrollment.user.email}</td>
                  <td className="px-5 py-3">
                    {enrollment.user.group?.name ? (
                      <span className="inline-flex rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {enrollment.user.group.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(enrollment.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600"
                      disabled={busy}
                      onClick={() =>
                        removeStudent(enrollment.id, enrollment.user.id, enrollment.user.name)
                      }
                    >
                      Chiqarish
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
