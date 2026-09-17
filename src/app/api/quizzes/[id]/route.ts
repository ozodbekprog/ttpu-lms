import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quizUpdateSchema } from "@/components/quiz/schema";
import { publicError } from "@/components/quiz/server";
import { toQuestionFull, toQuestionPublic } from "@/components/quiz/shared";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true, slug: true, teacherId: true } },
      questions: { orderBy: { position: "asc" } },
    },
  });
  if (!quiz) return Response.json({ ok: false, error: "Test topilmadi" }, { status: 404 });

  const staff = user.role === "ADMIN" || user.role === "TEACHER";
  const questions = quiz.questions.map(toQuestionFull);

  if (staff) {
    if (user.role === "TEACHER" && quiz.course.teacherId !== user.id) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    return Response.json({ ok: true, data: { ...quiz, questions } });
  }

  if (!quiz.isPublished) return Response.json({ ok: false, error: "Test topilmadi" }, { status: 404 });
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId: quiz.courseId, userId: user.id } },
    select: { id: true },
  });
  if (!enrollment) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: id, studentId: user.id },
    orderBy: { startedAt: "desc" },
    select: { id: true, startedAt: true, finishedAt: true, score: true },
  });
  return Response.json({
    ok: true,
    data: { ...quiz, questions: questions.map(toQuestionPublic), attempts },
  });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = quizUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  try {
    const quiz = await prisma.quiz.findUnique({ where: { id }, include: { course: true } });
    if (!quiz) return Response.json({ ok: false, error: "Test topilmadi" }, { status: 404 });
    if (user.role === "TEACHER" && quiz.course.teacherId !== user.id) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const data = parsed.data;
    if (data.courseId && data.courseId !== quiz.courseId) {
      const course = await prisma.course.findUnique({ where: { id: data.courseId } });
      if (!course) return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
      if (user.role === "TEACHER" && course.teacherId !== user.id) {
        return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const updated = await prisma.quiz.update({ where: { id }, data });
    return Response.json({ ok: true, data: { id: updated.id } });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id }, include: { course: true } });
    if (!quiz) return Response.json({ ok: false, error: "Test topilmadi" }, { status: 404 });
    if (user.role === "TEACHER" && quiz.course.teacherId !== user.id) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    await prisma.quiz.delete({ where: { id } });
    return Response.json({ ok: true, data: { id } });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}
