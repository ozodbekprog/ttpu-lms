import "server-only";
import { prisma } from "@/lib/prisma";
import type { AttendanceStatus, Role } from "@prisma/client";

export type ChartPoint = { label: string; value: number };
export type DonutSlice = { label: string; value: number; color: string };

export type AdminCharts = {
  usersByRole: DonutSlice[];
  submissionsByDay: ChartPoint[];
  attendanceRateByDay: ChartPoint[];
  topCourses: ChartPoint[];
  quizAverages: ChartPoint[];
};

const DAY_WINDOW = 14;
const ATTENDED: AttendanceStatus[] = ["PRESENT", "EXCUSED"];

const ROLE_META: Record<Role, { label: string; color: string }> = {
  STUDENT: { label: "Talabalar", color: "#5373b8" },
  TEACHER: { label: "O'qituvchilar", color: "#34497f" },
  ADMIN: { label: "Adminlar", color: "#c9a227" },
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildWindow() {
  const today = startOfDay(new Date());
  const days = Array.from({ length: DAY_WINDOW }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (DAY_WINDOW - 1 - index));
    return date;
  });
  return { start: days[0], days };
}

function shorten(title: string, max = 22) {
  const trimmed = title.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

export async function getAdminCharts(): Promise<AdminCharts> {
  const { start, days } = buildWindow();

  const [roleCounts, submissions, attendance, courses, quizzes] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.submission.findMany({
      where: { submittedAt: { gte: start } },
      select: { submittedAt: true },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: start } },
      select: { date: true, status: true },
    }),
    prisma.course.findMany({
      select: { title: true, _count: { select: { enrollments: true } } },
    }),
    prisma.quiz.findMany({
      select: {
        title: true,
        questions: { select: { points: true } },
        attempts: { select: { score: true, finishedAt: true } },
      },
    }),
  ]);

  const countByRole = new Map<Role, number>(roleCounts.map((row) => [row.role, row._count._all]));
  const usersByRole: DonutSlice[] = (["STUDENT", "TEACHER", "ADMIN"] as Role[]).map((role) => ({
    label: ROLE_META[role].label,
    value: countByRole.get(role) ?? 0,
    color: ROLE_META[role].color,
  }));

  const submissionBuckets = new Map<string, number>();
  for (const submission of submissions) {
    const key = dayKey(submission.submittedAt);
    submissionBuckets.set(key, (submissionBuckets.get(key) ?? 0) + 1);
  }
  const submissionsByDay: ChartPoint[] = days.map((date) => ({
    label: dayLabel(date),
    value: submissionBuckets.get(dayKey(date)) ?? 0,
  }));

  const attendanceBuckets = new Map<string, { attended: number; total: number }>();
  for (const record of attendance) {
    const key = dayKey(record.date);
    const bucket = attendanceBuckets.get(key) ?? { attended: 0, total: 0 };
    bucket.total += 1;
    if (ATTENDED.includes(record.status)) bucket.attended += 1;
    attendanceBuckets.set(key, bucket);
  }
  const attendanceRateByDay: ChartPoint[] = days.map((date) => {
    const bucket = attendanceBuckets.get(dayKey(date));
    return {
      label: dayLabel(date),
      value: bucket && bucket.total > 0 ? Math.round((bucket.attended / bucket.total) * 100) : 0,
    };
  });

  const topCourses: ChartPoint[] = courses
    .map((course) => ({ label: shorten(course.title), value: course._count.enrollments }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const quizAverages: ChartPoint[] = quizzes
    .map((quiz) => {
      const maxScore = quiz.questions.reduce((sum, question) => sum + question.points, 0);
      const attemptCount = quiz.attempts.length;
      const finished = quiz.attempts.filter(
        (attempt) => attempt.finishedAt !== null && attempt.score !== null,
      );
      if (maxScore <= 0 || finished.length === 0) return null;
      const percentage =
        finished.reduce((sum, attempt) => sum + (attempt.score ?? 0) / maxScore, 0) /
        finished.length;
      return {
        label: shorten(quiz.title),
        value: Math.max(0, Math.min(100, Math.round(percentage * 100))),
        attemptCount,
      };
    })
    .filter((item): item is ChartPoint & { attemptCount: number } => item !== null)
    .sort((a, b) => b.attemptCount - a.attemptCount)
    .slice(0, 5)
    .map(({ label, value }) => ({ label, value }));

  return { usersByRole, submissionsByDay, attendanceRateByDay, topCourses, quizAverages };
}
