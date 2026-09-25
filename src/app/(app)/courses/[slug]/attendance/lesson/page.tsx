import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dayName, fmtDate } from "@/lib/utils";
import { canManageCourse } from "@/components/courses/course-access";
import { LessonAttendance } from "@/components/attendance/lesson-attendance";
import type { LessonStatus } from "@/components/attendance/lesson-attendance";
import { SessionPanel } from "@/components/attendance/SessionPanel";
import { getModuleFlags } from "@/server/settings";
import {
  SLOT_TIMES,
  dateFromIso,
  matchCourseSlug,
  normalizeTeacherName,
  todayIso,
} from "@/components/attendance/lesson-utils";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function MetaChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
      <span className="text-gold-300">{icon}</span>
      {children}
    </span>
  );
}

export default async function LessonAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; slot?: string; subGroup?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const query = await searchParams;

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) notFound();
  if (!canManageCourse(user, course)) redirect("/dashboard");

  const date =
    typeof query.date === "string" && DATE_PATTERN.test(query.date) ? query.date : todayIso();
  const dateValue = dateFromIso(date);
  const rawSlot = typeof query.slot === "string" ? Number(query.slot) : Number.NaN;
  const slot = Number.isInteger(rawSlot) && rawSlot >= 1 && rawSlot <= 8 ? rawSlot : 1;
  const weekdayRaw = dateValue.getUTCDay();
  const weekday = weekdayRaw === 0 ? 7 : weekdayRaw;

  const [enrollments, attendanceRows, dayEntries, teacherCourses, moduleFlags] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId: course.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            group: { select: { name: true } },
            subGroup: { select: { name: true } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.attendance.findMany({ where: { courseId: course.id, date: dateValue } }),
    prisma.scheduleEntry.findMany({
      where: { dayOfWeek: weekday, slot },
      include: { group: { select: { name: true } } },
    }),
    user.role === "TEACHER"
      ? prisma.course.findMany({
          where: { teacherId: user.id },
          select: { slug: true, title: true },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([] as { slug: string; title: string }[]),
    getModuleFlags(),
  ]);

  const courseOption = { slug: course.slug, title: course.title };
  const teacherName = normalizeTeacherName(user.name);
  const requestedSubGroup =
    typeof query.subGroup === "string" && query.subGroup.trim() ? query.subGroup.trim() : null;
  const candidates = dayEntries.filter(
    (entry) => matchCourseSlug(entry.subject, [courseOption]) === course.slug,
  );
  const matchedEntry =
    (requestedSubGroup ? candidates.find((entry) => entry.subGroup === requestedSubGroup) : undefined) ??
    candidates.find(
      (entry) => entry.teacher !== null && normalizeTeacherName(entry.teacher) === teacherName,
    ) ??
    candidates[0] ??
    null;

  const students = enrollments.map((enrollment) => ({
    id: enrollment.user.id,
    name: enrollment.user.name,
    avatarUrl: enrollment.user.avatarUrl,
    groupName: enrollment.user.group?.name ?? null,
    subGroupName: enrollment.user.subGroup?.name ?? null,
  }));

  const initial: Record<string, LessonStatus> = {};
  for (const row of attendanceRows) {
    initial[row.studentId] = row.status;
  }

  const groupName =
    matchedEntry?.group.name ?? students.find((student) => student.groupName)?.groupName ?? null;
  const subGroup = matchedEntry?.subGroup ?? requestedSubGroup;
  const room = matchedEntry?.room ?? null;
  const subject = matchedEntry?.subject ?? course.title;
  const time = SLOT_TIMES[slot] ?? `${slot}-par`;
  const scheduleStatus = matchedEntry?.status ?? "NORMAL";
  const scheduleNote = matchedEntry?.note ?? null;
  const cancelled = scheduleStatus === "CANCELLED";

  return (
    <>
      <section className="animate-fade-up relative mb-7 overflow-hidden rounded-2xl border border-brand-900/40 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-6 text-white shadow-card md:p-7">
        <span className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-gold-400/10 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">
              Davomat · {slot}-par
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">{subject}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-white/90">
              <MetaChip
                icon={
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
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M8 3v4M16 3v4M3 11h18" />
                  </svg>
                }
              >
                {dayName(weekday)}, {fmtDate(dateValue)}
              </MetaChip>
              <MetaChip
                icon={
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
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                }
              >
                {time}
              </MetaChip>
              {room ? (
                <MetaChip
                  icon={
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
                      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  }
                >
                  {room}
                </MetaChip>
              ) : null}
              {groupName || subGroup ? (
                <MetaChip
                  icon={
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
                      <circle cx="9" cy="8" r="3.2" />
                      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
                      <path d="M16 5.5a3 3 0 0 1 0 5.8M17.5 20a5.4 5.4 0 0 0-2-4.2" />
                    </svg>
                  }
                >
                  {[groupName, subGroup ? `${subGroup} kichik guruh` : null].filter(Boolean).join(" · ")}
                </MetaChip>
              ) : null}
            </div>
          </div>
          <Link
            href={`/courses/${course.slug}/attendance`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/20"
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
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Davomat bo&apos;limi
          </Link>
        </div>
      </section>
      {cancelled ? (
        <section className="animate-fade-up mb-6 flex items-start gap-3.5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-rose-800">
              Bu dars bekor qilingan — davomat belgilanmaydi
            </p>
            {scheduleNote ? (
              <p className="mt-1 text-xs text-rose-600">{scheduleNote}</p>
            ) : null}
          </div>
        </section>
      ) : scheduleStatus !== "NORMAL" ? (
        <section
          className={
            scheduleStatus === "CHANGED"
              ? "animate-fade-up mb-6 flex items-start gap-3.5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
              : "animate-fade-up mb-6 flex items-start gap-3.5 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4"
          }
        >
          <span
            className={
              scheduleStatus === "CHANGED"
                ? "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600"
                : "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600"
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </span>
          <div className="min-w-0">
            <p
              className={
                scheduleStatus === "CHANGED"
                  ? "text-sm font-semibold text-amber-800"
                  : "text-sm font-semibold text-sky-800"
              }
            >
              {scheduleStatus === "CHANGED"
                ? "Dars o'zgartirilgan — jadvaldagi o'zgarishni tekshiring"
                : "Dars ko'chirilgan — jadvaldagi o'zgarishni tekshiring"}
            </p>
            {scheduleNote ? (
              <p
                className={
                  scheduleStatus === "CHANGED"
                    ? "mt-1 text-xs text-amber-700"
                    : "mt-1 text-xs text-sky-700"
                }
              >
                {scheduleNote}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
      {moduleFlags.qr_attendance ? (
        <div className="mb-6">
          <SessionPanel courseId={course.id} studentCount={students.length} />
        </div>
      ) : null}
      <LessonAttendance
        courseId={course.id}
        date={date}
        slot={slot}
        students={students}
        initial={initial}
        courses={teacherCourses}
        selectedSlug={course.slug}
        subGroup={subGroup}
        cancelled={cancelled}
        qrEnabled={moduleFlags.qr_attendance}
      />
    </>
  );
}
