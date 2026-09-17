import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, PageHeader } from "@/components/ui";
import { dayName, fmtDate } from "@/lib/utils";
import { canManageCourse } from "@/components/courses/course-access";
import { LessonAttendance } from "@/components/attendance/lesson-attendance";
import type { LessonStatus } from "@/components/attendance/lesson-attendance";
import {
  SLOT_TIMES,
  dateFromIso,
  matchCourseSlug,
  normalizeTeacherName,
  todayIso,
} from "@/components/attendance/lesson-utils";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function LessonAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; slot?: string }>;
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

  const [enrollments, attendanceRows, dayEntries, teacherCourses] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId: course.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            group: { select: { name: true } },
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
  ]);

  const courseOption = { slug: course.slug, title: course.title };
  const teacherName = normalizeTeacherName(user.name);
  const matchedEntry =
    dayEntries.find(
      (entry) =>
        matchCourseSlug(entry.subject, [courseOption]) === course.slug &&
        entry.teacher !== null &&
        normalizeTeacherName(entry.teacher) === teacherName,
    ) ??
    dayEntries.find((entry) => matchCourseSlug(entry.subject, [courseOption]) === course.slug) ??
    null;

  const students = enrollments.map((enrollment) => ({
    id: enrollment.user.id,
    name: enrollment.user.name,
    avatarUrl: enrollment.user.avatarUrl,
    groupName: enrollment.user.group?.name ?? null,
  }));

  const initial: Record<string, LessonStatus> = {};
  for (const row of attendanceRows) {
    initial[row.studentId] = row.status;
  }

  const groupName =
    matchedEntry?.group.name ?? students.find((student) => student.groupName)?.groupName ?? null;
  const room = matchedEntry?.room ?? null;
  const subject = matchedEntry?.subject ?? course.title;
  const time = SLOT_TIMES[slot] ?? `${slot}-par`;

  const subtitleParts = [`${dayName(weekday)}, ${fmtDate(dateValue)}`, `${slot}-par (${time})`];
  if (room) subtitleParts.push(room);
  if (groupName) subtitleParts.push(groupName);

  return (
    <>
      <PageHeader
        eyebrow="Davomat"
        title={subject}
        subtitle={subtitleParts.join(" · ")}
        action={
          <ButtonLink href={`/courses/${course.slug}/attendance`} variant="secondary" size="sm">
            Davomat bo&apos;limi
          </ButtonLink>
        }
      />
      <LessonAttendance
        courseId={course.id}
        date={date}
        slot={slot}
        students={students}
        initial={initial}
        courses={teacherCourses}
        selectedSlug={course.slug}
      />
    </>
  );
}
