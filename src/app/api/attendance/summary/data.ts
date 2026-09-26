import "server-only";
import { prisma } from "@/lib/prisma";
import type { AttendanceStatus } from "@prisma/client";

export const EXAM_MIN_PERCENT = 80;

export type AttendanceCounts = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  suspicious: number;
  total: number;
  percent: number;
  eligible: boolean;
};

export type CourseAttendance = AttendanceCounts & {
  courseId: string;
  courseTitle: string;
  slug: string;
};

export type StudentAttendanceSummary = {
  studentId: string;
  courses: CourseAttendance[];
  overall: AttendanceCounts;
};

export function attendanceCounts(statuses: AttendanceStatus[]): AttendanceCounts {
  const totals: Record<AttendanceStatus, number> = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
    SUSPICIOUS: 0,
  };
  for (const status of statuses) totals[status] += 1;
  const total = statuses.length;
  const attended = totals.PRESENT + totals.LATE + totals.EXCUSED + totals.SUSPICIOUS;
  const percent = total > 0 ? Math.round((attended / total) * 100) : 0;
  return {
    present: totals.PRESENT,
    absent: totals.ABSENT,
    late: totals.LATE,
    excused: totals.EXCUSED,
    suspicious: totals.SUSPICIOUS,
    total,
    percent,
    eligible: percent >= EXAM_MIN_PERCENT,
  };
}

export async function getStudentAttendance(
  studentId: string,
  courseIds?: string[],
): Promise<StudentAttendanceSummary> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: studentId,
      ...(courseIds ? { courseId: { in: courseIds } } : {}),
    },
    select: { course: { select: { id: true, title: true, slug: true } } },
    orderBy: { course: { title: "asc" } },
  });

  const courses = enrollments.map((enrollment) => enrollment.course);
  const records =
    courses.length > 0
      ? await prisma.attendance.findMany({
          where: { studentId, courseId: { in: courses.map((course) => course.id) } },
          select: { courseId: true, status: true },
        })
      : [];

  const byCourse = new Map<string, AttendanceStatus[]>();
  for (const record of records) {
    const list = byCourse.get(record.courseId);
    if (list) {
      list.push(record.status);
    } else {
      byCourse.set(record.courseId, [record.status]);
    }
  }

  return {
    studentId,
    courses: courses.map((course) => ({
      courseId: course.id,
      courseTitle: course.title,
      slug: course.slug,
      ...attendanceCounts(byCourse.get(course.id) ?? []),
    })),
    overall: attendanceCounts(records.map((record) => record.status)),
  };
}

export async function getCourseAttendance(courseId: string, studentId: string) {
  const records = await prisma.attendance.findMany({
    where: { courseId, studentId },
    select: { status: true },
  });
  return attendanceCounts(records.map((record) => record.status));
}
