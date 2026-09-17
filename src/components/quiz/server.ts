import { prisma } from "@/lib/prisma";
import type { Course, Question, Quiz, Role } from "@prisma/client";

export type StaffUser = { id: string; role: Role };

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
  if (error instanceof Error && error.message) return error.message;
  return "Xatolik yuz berdi";
}
