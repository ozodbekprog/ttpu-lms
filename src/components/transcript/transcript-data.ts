import "server-only";
import { prisma } from "@/lib/prisma";
import { getStudentGpa, letterGrade } from "@/app/api/gpa/data";

export type TranscriptCourse = {
  courseId: string;
  title: string;
  teacher: string;
  assignments: number | null;
  quizzes: number | null;
  attendance: number | null;
  final: number | null;
  letter: string;
};

export type TranscriptStudent = {
  id: string;
  name: string;
  email: string;
  group: string | null;
};

export type TranscriptData = {
  student: TranscriptStudent;
  courses: TranscriptCourse[];
  gpa: number | null;
  serial: string;
};

export function transcriptSerial(studentId: string) {
  return `TTPU-TR-${studentId.slice(-8).toUpperCase()}`;
}

export async function buildTranscript(studentId: string): Promise<TranscriptData | null> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      group: { select: { name: true } },
    },
  });
  if (!student || student.role !== "STUDENT") return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    select: {
      course: {
        select: { id: true, title: true, teacher: { select: { name: true } } },
      },
    },
  });
  const courseIds = enrollments.map((enrollment) => enrollment.course.id);

  const [submissions, attempts, attendance, gpaSummary] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId, score: { not: null }, assignment: { courseId: { in: courseIds } } },
      select: { score: true, assignment: { select: { courseId: true, maxScore: true } } },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId, score: { not: null }, quiz: { courseId: { in: courseIds } } },
      select: {
        score: true,
        quiz: { select: { courseId: true, questions: { select: { points: true } } } },
      },
    }),
    prisma.attendance.findMany({
      where: { studentId, courseId: { in: courseIds } },
      select: { courseId: true, status: true },
    }),
    getStudentGpa(studentId, courseIds),
  ]);

  const assignmentTotals = new Map<string, { score: number; max: number }>();
  const quizTotals = new Map<string, { score: number; max: number }>();
  const attendanceTotals = new Map<string, { attended: number; total: number }>();

  function addTotal(
    totals: Map<string, { score: number; max: number }>,
    courseId: string,
    score: number,
    max: number,
  ) {
    if (max <= 0) return;
    const current = totals.get(courseId) ?? { score: 0, max: 0 };
    current.score += score;
    current.max += max;
    totals.set(courseId, current);
  }

  for (const submission of submissions) {
    addTotal(
      assignmentTotals,
      submission.assignment.courseId,
      submission.score ?? 0,
      submission.assignment.maxScore,
    );
  }

  for (const attempt of attempts) {
    const max = attempt.quiz.questions.reduce((sum, question) => sum + question.points, 0);
    addTotal(quizTotals, attempt.quiz.courseId, attempt.score ?? 0, max);
  }

  for (const record of attendance) {
    const current = attendanceTotals.get(record.courseId) ?? { attended: 0, total: 0 };
    current.total += 1;
    if (record.status !== "ABSENT") current.attended += 1;
    attendanceTotals.set(record.courseId, current);
  }

  function percentOf(total: { score: number; max: number } | undefined) {
    if (!total || total.max <= 0) return null;
    return Math.round((total.score / total.max) * 100);
  }

  const courses = enrollments
    .map((enrollment) => {
      const course = enrollment.course;
      const assignments = percentOf(assignmentTotals.get(course.id));
      const quizzes = percentOf(quizTotals.get(course.id));
      const attendanceTotal = attendanceTotals.get(course.id);
      const attendance =
        attendanceTotal && attendanceTotal.total > 0
          ? Math.round((attendanceTotal.attended / attendanceTotal.total) * 100)
          : null;
      const parts = [assignments, quizzes, attendance].filter(
        (value): value is number => value !== null,
      );
      const final =
        parts.length > 0
          ? Math.round(parts.reduce((sum, value) => sum + value, 0) / parts.length)
          : null;
      return {
        courseId: course.id,
        title: course.title,
        teacher: course.teacher.name,
        assignments,
        quizzes,
        attendance,
        final,
        letter: final !== null ? letterGrade(final) : "—",
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      group: student.group?.name ?? null,
    },
    courses,
    gpa: gpaSummary.gpa,
    serial: transcriptSerial(student.id),
  };
}
