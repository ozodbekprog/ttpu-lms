import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type BankStaffUser = { id: string; role: Role };

export async function findManageableBankQuestion(id: string, user: BankStaffUser) {
  const question = await prisma.bankQuestion.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true, teacherId: true } },
      subject: { select: { id: true, name: true } },
    },
  });
  if (!question) return null;
  if (user.role === "ADMIN") return question;
  if (question.courseId) return question.course?.teacherId === user.id ? question : null;
  if (question.subjectId) {
    const link = await prisma.teacherSubject.findUnique({
      where: { teacherId_subjectId: { teacherId: user.id, subjectId: question.subjectId } },
      select: { id: true },
    });
    return link ? question : null;
  }
  return null;
}

export async function resolveBankTarget(
  user: BankStaffUser,
  courseId: string | null,
  subjectId: string | null,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    if (!course) return { ok: false, status: 404, error: "Kurs topilmadi" };
    if (user.role === "TEACHER" && course.teacherId !== user.id) {
      return { ok: false, status: 403, error: "Forbidden" };
    }
    return { ok: true };
  }
  if (subjectId) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
    if (!subject) return { ok: false, status: 404, error: "Fan topilmadi" };
    if (user.role === "TEACHER") {
      const link = await prisma.teacherSubject.findUnique({
        where: { teacherId_subjectId: { teacherId: user.id, subjectId } },
        select: { id: true },
      });
      if (!link) return { ok: false, status: 403, error: "Forbidden" };
    }
    return { ok: true };
  }
  return { ok: false, status: 400, error: "Kurs yoki fanni tanlang" };
}
