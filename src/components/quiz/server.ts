import { prisma } from "@/lib/prisma";
import type { Course, Prisma, Question, Quiz, Role } from "@prisma/client";
import { asAnswers, autoScore, type QuestionFull } from "@/components/quiz/shared";

export type StaffUser = { id: string; role: Role };

export const ATTEMPT_GRACE_MS = 60_000;

export function expiredAttemptDeadline(
  startedAt: Date,
  timeLimitMin: number | null,
  now: Date = new Date(),
): Date | null {
  if (timeLimitMin === null) return null;
  const deadline = new Date(startedAt.getTime() + timeLimitMin * 60_000);
  return now.getTime() > deadline.getTime() + ATTEMPT_GRACE_MS ? deadline : null;
}

export async function closeExpiredAttempt(
  db: Prisma.TransactionClient,
  attemptId: string,
  storedAnswers: unknown,
  questions: QuestionFull[],
  deadline: Date,
) {
  return db.quizAttempt.update({
    where: { id: attemptId },
    data: { score: autoScore(questions, asAnswers(storedAnswers)), finishedAt: deadline },
  });
}

export async function findManageableQuiz(quizId: string, user: StaffUser): Promise<(Quiz & { course: Course }) | null> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { course: true },
  });
  if (!quiz) return null;
  if (user.role === "ADMIN") return quiz;
  if (user.role === "TEACHER" && quiz.course.teacherId === user.id) return quiz;
  return null;
}

export async function findManageableQuestion(
  questionId: string,
  user: StaffUser,
): Promise<(Question & { quiz: Quiz & { course: Course } }) | null> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { quiz: { include: { course: true } } },
  });
  if (!question) return null;
  if (user.role === "ADMIN") return question;
  if (user.role === "TEACHER" && question.quiz.course.teacherId === user.id) return question;
  return null;
}

export async function isEnrolled(courseId: string, userId: string): Promise<boolean> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { id: true },
  });
  return enrollment !== null;
}

export function isStaffRole(role: Role): boolean {
  return role === "ADMIN" || role === "TEACHER";
}

export function publicError(error: unknown): string {
  console.error(error);
  return "Xatolik yuz berdi";
}
