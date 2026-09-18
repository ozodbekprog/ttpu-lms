import "server-only";
import { prisma } from "@/lib/prisma";

export const GPA_CREDITS = 6;

export type GpaLetter = "A" | "B" | "C" | "D" | "F";

export type GpaCourse = {
  courseId: string;
  title: string;
  slug: string;
  percent: number;
  points: number;
  letter: GpaLetter;
  credits: number;
  gradedCount: number;
};

export type StudentGpa = {
  studentId: string;
  gpa: number | null;
  totalCredits: number;
  qualityPoints: number;
  overallPercent: number | null;
  gradedCount: number;
  courses: GpaCourse[];
};

export function gpaPoints(percent: number): number {
  if (percent >= 90) return 4;
  if (percent >= 85) return 3.7;
  if (percent >= 80) return 3.3;
  if (percent >= 75) return 3;
  if (percent >= 70) return 2.7;
  if (percent >= 65) return 2.3;
  if (percent >= 60) return 2;
  return 0;
}

export function letterGrade(percent: number): GpaLetter {
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  return "F";
}

type CourseTotals = { score: number; max: number; gradedCount: number };

export async function getStudentGpa(
  studentId: string,
  courseIds?: string[],
): Promise<StudentGpa> {
  const [submissions, attempts] = await Promise.all([
    prisma.submission.findMany({
      where: {
        studentId,
        status: "GRADED",
        score: { not: null },
        ...(courseIds ? { assignment: { courseId: { in: courseIds } } } : {}),
      },
      select: {
        score: true,
        assignment: { select: { courseId: true, maxScore: true } },
      },
    }),
    prisma.quizAttempt.findMany({
      where: {
        studentId,
        finishedAt: { not: null },
        score: { not: null },
        ...(courseIds ? { quiz: { courseId: { in: courseIds } } } : {}),
      },
      select: {
        score: true,
        quiz: { select: { courseId: true, questions: { select: { points: true } } } },
      },
    }),
  ]);

  const totals = new Map<string, CourseTotals>();

  function add(courseId: string, score: number, max: number) {
    if (max <= 0) return;
    const current = totals.get(courseId) ?? { score: 0, max: 0, gradedCount: 0 };
    current.score += score;
    current.max += max;
    current.gradedCount += 1;
    totals.set(courseId, current);
  }

  for (const submission of submissions) {
    add(submission.assignment.courseId, submission.score ?? 0, submission.assignment.maxScore);
  }

  for (const attempt of attempts) {
    const quizMax = attempt.quiz.questions.reduce((sum, question) => sum + question.points, 0);
    add(attempt.quiz.courseId, attempt.score ?? 0, quizMax);
  }

  if (totals.size === 0) {
    return {
      studentId,
      gpa: null,
      totalCredits: 0,
      qualityPoints: 0,
      overallPercent: null,
      gradedCount: 0,
      courses: [],
    };
  }

  const records = await prisma.course.findMany({
    where: { id: { in: [...totals.keys()] } },
    select: { id: true, title: true, slug: true },
    orderBy: { title: "asc" },
  });

  const courses: GpaCourse[] = [];
  let qualityPoints = 0;
  let totalCredits = 0;
  let overallScore = 0;
  let overallMax = 0;
  let gradedCount = 0;

  for (const record of records) {
    const total = totals.get(record.id);
    if (!total || total.max <= 0) continue;
    const percent = Math.round((total.score / total.max) * 100);
    const points = gpaPoints(percent);
    qualityPoints += points * GPA_CREDITS;
    totalCredits += GPA_CREDITS;
    overallScore += total.score;
    overallMax += total.max;
    gradedCount += total.gradedCount;
    courses.push({
      courseId: record.id,
      title: record.title,
      slug: record.slug,
      percent,
      points,
      letter: letterGrade(percent),
      credits: GPA_CREDITS,
      gradedCount: total.gradedCount,
    });
  }

  const gpa = totalCredits > 0 ? Math.round((qualityPoints / totalCredits) * 100) / 100 : null;
  const overallPercent = overallMax > 0 ? Math.round((overallScore / overallMax) * 100) : null;

  return {
    studentId,
    gpa,
    totalCredits,
    qualityPoints: Math.round(qualityPoints * 100) / 100,
    overallPercent,
    gradedCount,
    courses,
  };
}
