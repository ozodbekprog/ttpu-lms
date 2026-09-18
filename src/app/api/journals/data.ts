import "server-only";
import { prisma } from "@/lib/prisma";
import { dayName } from "@/lib/utils";
import {
  SLOT_TIMES,
  dateFromIso,
  matchCourseSlug,
  normalizeTeacherName,
} from "@/components/attendance/lesson-utils";
import {
  addDaysIso,
  isoFromDate,
  mondayOfIso,
  tashkentToday,
} from "@/components/journals/journals-utils";
import type {
  JournalLesson,
  JournalLessonStatus,
  JournalWeekData,
} from "@/components/journals/journals-utils";
import type { Role } from "@prisma/client";

type JournalUser = { id: string; role: Role; name: string };
type CourseOption = { slug: string; title: string };

export async function getWeeklyJournals(
  user: JournalUser,
  week: string | null,
): Promise<JournalWeekData> {
  const weekStart = mondayOfIso(week);
  const weekEnd = addDaysIso(weekStart, 5);
  const today = tashkentToday();

  const [entries, courses] = await Promise.all([
    prisma.scheduleEntry.findMany({
      where: { dayOfWeek: { gte: 1, lte: 6 } },
      orderBy: [{ dayOfWeek: "asc" }, { slot: "asc" }],
      include: { group: { select: { name: true } } },
    }),
    prisma.course.findMany({
      where: user.role === "TEACHER" ? { teacherId: user.id } : {},
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        subjectId: true,
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  const teacherName = normalizeTeacherName(user.name);
  const visibleEntries =
    user.role === "TEACHER"
      ? entries.filter(
          (entry) =>
            entry.teacher !== null && normalizeTeacherName(entry.teacher) === teacherName,
        )
      : entries;

  const options: CourseOption[] = courses.map((course) => ({
    slug: course.slug,
    title: course.title,
  }));

  const courseIds = courses.map((course) => course.id);
  const attendanceRows =
    courseIds.length === 0
      ? []
      : await prisma.attendance.groupBy({
          by: ["courseId", "date"],
          where: {
            courseId: { in: courseIds },
            date: { gte: dateFromIso(weekStart), lte: dateFromIso(weekEnd) },
          },
          _count: { _all: true },
        });

  const attendanceCounts = new Map(
    attendanceRows.map((row) => [
      `${row.courseId}|${isoFromDate(row.date)}`,
      row._count._all,
    ]),
  );

  const lessons: JournalLesson[] = visibleEntries.map((entry) => {
    const date = addDaysIso(weekStart, entry.dayOfWeek - 1);
    const bySubject = entry.subjectId
      ? (courses.find((course) => course.subjectId === entry.subjectId) ?? null)
      : null;
    const slug = bySubject?.slug ?? matchCourseSlug(entry.subject, options);
    const course = bySubject ?? courses.find((item) => item.slug === slug) ?? null;
    const attendanceCount = course
      ? (attendanceCounts.get(`${course.id}|${date}`) ?? 0)
      : 0;
    const studentCount = course?._count.enrollments ?? 0;
    const status: JournalLessonStatus =
      attendanceCount === 0
        ? "empty"
        : studentCount > 0 && attendanceCount >= studentCount
          ? "done"
          : "partial";

    return {
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      day: dayName(entry.dayOfWeek),
      date,
      slot: entry.slot,
      time: SLOT_TIMES[entry.slot] ?? `${entry.slot}-para`,
      subject: entry.subject,
      group: entry.group.name,
      room: entry.room,
      courseSlug: course?.slug ?? null,
      attendanceCount,
      studentCount,
      status,
    };
  });

  return { week: weekStart, weekEnd, today, lessons };
}
