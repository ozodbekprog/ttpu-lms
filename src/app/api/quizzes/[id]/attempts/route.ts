import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEnrolled, publicError } from "@/components/quiz/server";
import { toQuestionFull, toQuestionPublic } from "@/components/quiz/shared";

function attemptPayload(
  attempt: { id: string; startedAt: Date; finishedAt: Date | null },
  quiz: {
    id: string;
    title: string;
    timeLimitMin: number | null;
    maxAttempts: number;
    questions: Array<Parameters<typeof toQuestionFull>[0]>;
  },
) {
  return {
    attempt: { id: attempt.id, startedAt: attempt.startedAt, finishedAt: attempt.finishedAt },
    quiz: {
      id: quiz.id,
      title: quiz.title,
      timeLimitMin: quiz.timeLimitMin,
      maxAttempts: quiz.maxAttempts,
    },
    questions: quiz.questions.map((question) => toQuestionPublic(toQuestionFull(question))),
  };
}

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "STUDENT") {
    return Response.json({ ok: false, error: "Faqat talaba test boshlashi mumkin" }, { status: 403 });
  }

  const { id } = await ctx.params;
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { position: "asc" } } },
    });
    if (!quiz || !quiz.isPublished) {
      return Response.json({ ok: false, error: "Test topilmadi" }, { status: 404 });
    }
    if (!(await isEnrolled(quiz.courseId, user.id))) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const active = await prisma.quizAttempt.findFirst({
      where: { quizId: id, studentId: user.id, finishedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (active) {
      return Response.json({ ok: true, data: attemptPayload(active, quiz) });
    }

    const finishedCount = await prisma.quizAttempt.count({
      where: { quizId: id, studentId: user.id, finishedAt: { not: null } },
    });
    if (finishedCount >= quiz.maxAttempts) {
      return Response.json(
        { ok: false, error: "Urinishlar soni tugagan" },
        { status: 409 },
      );
    }

    const attempt = await prisma.quizAttempt.create({
      data: { quizId: id, studentId: user.id },
    });
    return Response.json({ ok: true, data: attemptPayload(attempt, quiz) }, { status: 201 });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}
