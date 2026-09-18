import "server-only";
import { prisma } from "@/lib/prisma";
import {
  attendanceCounts,
  EXAM_MIN_PERCENT,
  type AttendanceCounts,
} from "@/app/api/attendance/summary/data";
import type { AttendanceStatus, Role } from "@prisma/client";

export { EXAM_MIN_PERCENT };

export type ExamBucket = "upcoming" | "today" | "past";

export type ExamGroups<T> = {
  upcoming: T[];
  today: T[];
  past: T[];
};

export type StudentExamItem = {
  id: string;
  title: string;
  description: string | null;
  dueAt: Date;
  timeLimitMin: number | null;
  maxAttempts: number;
  course: { id: string; title: string; slug: string };
  attendance: AttendanceCounts;
  attempts: { finished: number; active: boolean; lastScore: number | null };
};

export type StaffExamItem = {
  id: string;
  title: string;
  dueAt: Date;
  timeLimitMin: number | null;
  maxAttempts: number;
  isPublished: boolean;
  course: { id: string; title: string; slug: string; teacherName: string };
  questionCount: number;
  attemptCount: number;
  submittedCount: number;
};

export function examBucket(dueAt: Date, now: Date = new Date()): ExamBucket {
  const dueDay = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (dueDay === today) return "today";
  return dueDay > today ? "upcoming" : "past";
}

function groupExams<T extends { dueAt: Date }>(items: T[], now: Date): ExamGroups<T> {
  const groups: ExamGroups<T> = { upcoming: [], today: [], past: [] };
  for (const item of items) groups[examBucket(item.dueAt, now)].push(item);
  groups.past.reverse();
  return groups;
}

export async function getStudentExams(
  studentId: string,
  now: Date = new Date(),
): Promise<ExamGroups<StudentExamItem>> {
  const quizzes = await prisma.quiz.findMany({
    where: {
      isPublished: true,
      dueAt: { not: null },
      course: { enrollments: { some: { userId: studentId } } },
    },
    orderBy: { dueAt: "asc" },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      attempts: {
        where: { studentId },
        select: { finishedAt: true, score: true },
      },
    },
  });

  const courseIds = [...new Set(quizzes.map((quiz) => quiz.courseId))];
  const records =
    courseIds.length > 0
      ? await prisma.attendance.findMany({
          where: { studentId, courseId: { in: courseIds } },
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

  const items = quizzes.flatMap((quiz) => {
    if (!quiz.dueAt) return [];
    const finished = quiz.attempts.filter((attempt) => attempt.finishedAt !== null);
    const lastScore = finished.find((attempt) => attempt.score !== null)?.score ?? null;
    return [
      {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        dueAt: quiz.dueAt,
        timeLimitMin: quiz.timeLimitMin,
        maxAttempts: quiz.maxAttempts,
        course: quiz.course,
        attendance: attendanceCounts(byCourse.get(quiz.courseId) ?? []),
        attempts: {
          finished: finished.length,
          active: quiz.attempts.some((attempt) => attempt.finishedAt === null),
          lastScore,
        },
      },
    ];
  });

  return groupExams(items, now);
}

export async function getStaffExams(
  user: { id: string; role: Role },
  now: Date = new Date(),
): Promise<ExamGroups<StaffExamItem>> {
  const quizzes = await prisma.quiz.findMany({
    where: {
      dueAt: { not: null },
      ...(user.role === "TEACHER" ? { course: { teacherId: user.id } } : {}),
    },
    orderBy: { dueAt: "asc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          teacher: { select: { name: true } },
        },
      },
      _count: { select: { questions: true } },
      attempts: { select: { finishedAt: true } },
    },
  });

  const items = quizzes.flatMap((quiz) => {
    if (!quiz.dueAt) return [];
    return [
      {
        id: quiz.id,
        title: quiz.title,
        dueAt: quiz.dueAt,
        timeLimitMin: quiz.timeLimitMin,
        maxAttempts: quiz.maxAttempts,
        isPublished: quiz.isPublished,
        course: {
          id: quiz.course.id,
          title: quiz.course.title,
          slug: quiz.course.slug,
          teacherName: quiz.course.teacher.name,
        },
        questionCount: quiz._count.questions,
        attemptCount: quiz.attempts.length,
        submittedCount: quiz.attempts.filter((attempt) => attempt.finishedAt !== null).length,
      },
    ];
  });

  return groupExams(items, now);
}
