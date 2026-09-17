import "server-only";
import { prisma } from "@/lib/prisma";
import type { AttendanceStatus, Role } from "@prisma/client";

export type ReportStudent = {
  id: string;
  name: string;
  email: string;
  group: string | null;
  assignmentAverage: number | null;
  quizAverage: number | null;
  attendanceRate: number | null;
  overall: number | null;
};

export type ReportAssignment = { id: string; title: string; maxScore: number };
export type ReportQuiz = { id: string; title: string; maxScore: number };

export type ReportStats = {
  studentCount: number;
  assignmentCount: number;
  quizCount: number;
  submissionCount: number;
  gradedCount: number;
  attendanceCount: number;
  assignmentAverage: number | null;
  submissionRate: number | null;
  attendanceRate: number | null;
  quizAverage: number | null;
};

export type CourseReport = {
  course: { id: string; title: string; slug: string };
  assignments: ReportAssignment[];
  quizzes: ReportQuiz[];
  attendanceDates: string[];
  students: ReportStudent[];
  stats: ReportStats;
  scores: Map<string, number | null>;
  quizScores: Map<string, number | null>;
  attendance: Map<string, AttendanceStatus>;
};

export const ATTENDANCE_CODES: Record<AttendanceStatus, string> = {
  PRESENT: "P",
  ABSENT: "A",
  LATE: "L",
  EXCUSED: "E",
};

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function scoreKey(studentId: string, itemId: string) {
  return `${studentId}:${itemId}`;
}

export async function resolveManagedCourse(ref: string, user: { id: string; role: Role }) {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: ref }, { slug: ref }] },
    select: { id: true, title: true, slug: true, teacherId: true },
  });
  if (!course) {
    return { ok: false as const, status: 404, error: "Kurs topilmadi" };
  }
  const canManage =
    user.role === "ADMIN" || (user.role === "TEACHER" && course.teacherId === user.id);
  if (!canManage) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const, course };
}

function averagePercent(values: Array<number | null>) {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return Math.round(present.reduce((sum, value) => sum + value, 0) / present.length);
}

export async function buildCourseReport(course: {
  id: string;
  title: string;
  slug: string;
}): Promise<CourseReport> {
  const [enrollments, assignments, submissions, attendance, quizzes] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId: course.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            group: { select: { name: true } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.assignment.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, maxScore: true },
    }),
    prisma.submission.findMany({
      where: { assignment: { courseId: course.id } },
      select: { studentId: true, assignmentId: true, score: true },
    }),
    prisma.attendance.findMany({
      where: { courseId: course.id },
      select: { studentId: true, date: true, status: true },
    }),
    prisma.quiz.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        questions: { select: { points: true } },
        attempts: { select: { studentId: true, score: true, finishedAt: true } },
      },
    }),
  ]);

  const scores = new Map<string, number | null>();
  for (const submission of submissions) {
    scores.set(scoreKey(submission.studentId, submission.assignmentId), submission.score);
  }

  const attendanceMap = new Map<string, AttendanceStatus>();
  const dateSet = new Set<string>();
  for (const record of attendance) {
    const key = dateKey(record.date);
    dateSet.add(key);
    attendanceMap.set(scoreKey(record.studentId, key), record.status);
  }
  const attendanceDates = [...dateSet].sort();

  const reportQuizzes: ReportQuiz[] = quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    maxScore: quiz.questions.reduce((sum, question) => sum + question.points, 0),
  }));

  const quizScores = new Map<string, number | null>();
  for (const quiz of quizzes) {
    for (const attempt of quiz.attempts) {
      if (!attempt.finishedAt || attempt.score === null) continue;
      const key = scoreKey(attempt.studentId, quiz.id);
      const current = quizScores.get(key);
      if (current == null || attempt.score > current) {
        quizScores.set(key, attempt.score);
      }
    }
  }

  let assignmentScoreSum = 0;
  let assignmentMaxSum = 0;
  let quizScoreSum = 0;
  let quizMaxSum = 0;
  let attendedTotal = 0;
  let attendanceTotal = 0;

  const students: ReportStudent[] = enrollments.map((enrollment) => {
    const studentId = enrollment.user.id;

    let scoreSum = 0;
    let maxSum = 0;
    for (const assignment of assignments) {
      const value = scores.get(scoreKey(studentId, assignment.id));
      if (value != null) {
        scoreSum += value;
        maxSum += assignment.maxScore;
      }
    }
    const assignmentAverage = maxSum > 0 ? Math.round((scoreSum / maxSum) * 100) : null;

    let quizScore = 0;
    let quizMax = 0;
    for (const quiz of reportQuizzes) {
      const value = quizScores.get(scoreKey(studentId, quiz.id));
      if (value != null) {
        quizScore += value;
        quizMax += quiz.maxScore;
      }
    }
    const quizAverage = quizMax > 0 ? Math.round((quizScore / quizMax) * 100) : null;

    let attended = 0;
    let total = 0;
    for (const date of attendanceDates) {
      const status = attendanceMap.get(scoreKey(studentId, date));
      if (!status) continue;
      total += 1;
      if (status === "PRESENT" || status === "LATE") attended += 1;
    }
    const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : null;

    assignmentScoreSum += scoreSum;
    assignmentMaxSum += maxSum;
    quizScoreSum += quizScore;
    quizMaxSum += quizMax;
    attendedTotal += attended;
    attendanceTotal += total;

    return {
      id: studentId,
      name: enrollment.user.name,
      email: enrollment.user.email,
      group: enrollment.user.group?.name ?? null,
      assignmentAverage,
      quizAverage,
      attendanceRate,
      overall: averagePercent([assignmentAverage, quizAverage, attendanceRate]),
    };
  });

  const gradedCount = submissions.filter((submission) => submission.score !== null).length;
  const possibleSubmissions = enrollments.length * assignments.length;

  const stats: ReportStats = {
    studentCount: enrollments.length,
    assignmentCount: assignments.length,
    quizCount: quizzes.length,
    submissionCount: submissions.length,
    gradedCount,
    attendanceCount: attendance.length,
    assignmentAverage:
      assignmentMaxSum > 0 ? Math.round((assignmentScoreSum / assignmentMaxSum) * 100) : null,
    submissionRate:
      possibleSubmissions > 0
        ? Math.min(100, Math.round((submissions.length / possibleSubmissions) * 100))
        : null,
    attendanceRate:
      attendanceTotal > 0 ? Math.round((attendedTotal / attendanceTotal) * 100) : null,
    quizAverage: quizMaxSum > 0 ? Math.round((quizScoreSum / quizMaxSum) * 100) : null,
  };

  return {
    course: { id: course.id, title: course.title, slug: course.slug },
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      maxScore: assignment.maxScore,
    })),
    quizzes: reportQuizzes,
    attendanceDates,
    students,
    stats,
    scores,
    quizScores,
    attendance: attendanceMap,
  };
}

export function reportSummary(report: CourseReport) {
  return {
    course: report.course,
    stats: report.stats,
    students: report.students,
    assignments: report.assignments,
    quizzes: report.quizzes,
    attendanceDates: report.attendanceDates,
  };
}
