import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  closeExpiredAttempt,
  expiredAttemptDeadline,
  isEnrolled,
  publicError,
} from "@/components/quiz/server";
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

    const questions = quiz.questions.map(toQuestionFull);

    const result = await prisma.$transaction(async (tx) => {
      const active = await tx.quizAttempt.findFirst({
        where: { quizId: id, studentId: user.id, finishedAt: null },
        orderBy: { startedAt: "desc" },
      });

      if (active) {
        const deadline = expiredAttemptDeadline(active.startedAt, quiz.timeLimitMin);
        if (!deadline) return { kind: "active" as const, attempt: active };
        await closeExpiredAttempt(tx, active.id, active.answers, questions, deadline);
      }

      const finishedCount = await tx.quizAttempt.count({
        where: { quizId: id, studentId: user.id, finishedAt: { not: null } },
      });
      if (finishedCount >= quiz.maxAttempts) return { kind: "limit" as const };

      const attempt = await tx.quizAttempt.create({
        data: { quizId: id, studentId: user.id },
      });
      return { kind: "created" as const, attempt };
    });

    if (result.kind === "limit") {
      return Response.json({ ok: false, error: "Urinishlar soni tugagan" }, { status: 409 });
    }
    if (result.kind === "active") {
      return Response.json({ ok: true, data: attemptPayload(result.attempt, quiz) });
    }
    return Response.json({ ok: true, data: attemptPayload(result.attempt, quiz) }, { status: 201 });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}
