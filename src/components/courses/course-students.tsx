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
import { apiFetch } from "@/lib/api";

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

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/['`’‘ʻʼ]/g, "")
    .replace(/x/g, "h")
    .replace(/\s+/g, " ")
    .trim();
}

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
      const res = await apiFetch(`/api/courses/${resolvedCourseId}/enrollments`);
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
      const res = await apiFetch(`/api/courses/${resolvedCourseId}/enrollments`, {
        method: "POST",
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
      const res = await apiFetch(`/api/enrollments/${enrollmentId}`, { method: "DELETE" });
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

  const normalized = normalizeSearch(query);
  const options = (students ?? []).filter((student) => {
    if (!normalized) return true;
    return (
      normalizeSearch(student.name).includes(normalized) ||
      normalizeSearch(student.email).includes(normalized)
    );
  });
  const availableOptions = options.filter((student) => !student.isEnrolled);
  const noMatches = normalized.length > 0 && availableOptions.length === 0;

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>
      ) : null}

      {resolvedCourseId ? (
        adding ? (
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M19 8v6" />
                      <path d="M22 11h-6" />
                    </svg>
                  </span>
                  {"Talaba qo'shish"}
                </span>
              }
              subtitle="Talabani ism yoki email bo'yicha toping"
            />
            <CardBody className="flex flex-wrap items-end gap-3">
              <div className="min-w-52 flex-1">
                <Label>Qidiruv</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </span>
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ism yoki email"
                    className="pl-9"
                  />
                </div>
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
                {noMatches ? (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Mos talaba topilmadi — imlo farq qilishi mumkin (Ahmad/Axmad). Boshqacha
                    yozib ko&apos;ring.
                  </p>
                ) : null}
              </div>
              <Button onClick={addStudent} disabled={busy || loading || !selectedId}>
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
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                {"Qo'shish"}
              </Button>
              <Button variant="secondary" onClick={() => setAdding(false)}>
                Bekor
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="flex justify-end">
            <Button onClick={openAdd}>
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M19 8v6" />
                <path d="M22 11h-6" />
              </svg>
              {"Talaba qo'shish"}
            </Button>
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
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-[0.08em] text-slate-400">
                <th className="px-5 py-3.5 font-semibold">#</th>
                <th className="px-5 py-3.5 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Talaba
                  </span>
                </th>
                <th className="px-5 py-3.5 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    Email
                  </span>
                </th>
                <th className="px-5 py-3.5 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Guruh
                  </span>
                </th>
                <th className="px-5 py-3.5 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4" />
                      <path d="M8 2v4" />
                      <path d="M3 10h18" />
                    </svg>
                    Yozilgan
                  </span>
                </th>
                <th className="px-5 py-3.5 font-semibold">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((enrollment, index) => (
                <tr
                  key={enrollment.id}
                  className="group transition-colors duration-150 hover:bg-brand-50/30"
                >
                  <td className="px-5 py-3">
                    <span className="inline-flex size-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200/70">
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
                      <span className="inline-flex rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
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
                      className="text-rose-600 hover:bg-rose-50! hover:text-rose-700!"
                      disabled={busy}
                      onClick={() =>
                        removeStudent(enrollment.id, enrollment.user.id, enrollment.user.name)
                      }
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
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
