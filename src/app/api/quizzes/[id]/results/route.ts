import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEnrolled, publicError } from "@/components/quiz/server";
import {
  asAnswers,
  toQuestionFull,
  toQuestionPublic,
  totalPoints,
} from "@/components/quiz/shared";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, teacherId: true } },
        questions: { orderBy: { position: "asc" } },
      },
    });
    if (!quiz) return Response.json({ ok: false, error: "Test topilmadi" }, { status: 404 });

    const questions = quiz.questions.map(toQuestionFull);
    const quizMeta = {
      id: quiz.id,
      title: quiz.title,
      timeLimitMin: quiz.timeLimitMin,
      maxAttempts: quiz.maxAttempts,
      maxScore: totalPoints(questions),
    };

    if (user.role === "ADMIN" || user.role === "TEACHER") {
      if (user.role === "TEACHER" && quiz.course.teacherId !== user.id) {
        return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
      const attempts = await prisma.quizAttempt.findMany({
        where: { quizId: id },
        orderBy: { startedAt: "desc" },
        include: { student: { select: { id: true, name: true, email: true } } },
      });
      return Response.json({
        ok: true,
        data: {
          quiz: quizMeta,
          questions,
          attempts: attempts.map((attempt) => ({
            id: attempt.id,
            startedAt: attempt.startedAt,
            finishedAt: attempt.finishedAt,
            score: attempt.score,
            answers: asAnswers(attempt.answers),
            student: attempt.student,
          })),
        },
      });
    }

    if (!quiz.isPublished) {
      return Response.json({ ok: false, error: "Test topilmadi" }, { status: 404 });
    }
    if (!(await isEnrolled(quiz.courseId, user.id))) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: id, studentId: user.id },
      orderBy: { startedAt: "desc" },
    });
    return Response.json({
      ok: true,
      data: {
        quiz: quizMeta,
        questions: questions.map(toQuestionPublic),
        attempts: attempts.map((attempt) => ({
          id: attempt.id,
          startedAt: attempt.startedAt,
          finishedAt: attempt.finishedAt,
          score: attempt.score,
          answers: asAnswers(attempt.answers),
        })),
      },
    });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}
