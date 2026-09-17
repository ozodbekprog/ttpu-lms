import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attemptPatchSchema } from "@/components/quiz/schema";
import {
  closeExpiredAttempt,
  expiredAttemptDeadline,
  findManageableQuiz,
  publicError,
} from "@/components/quiz/server";
import { autoScore, toQuestionFull, totalPoints } from "@/components/quiz/shared";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = attemptPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }
  const hasAnswers = parsed.data.answers !== undefined;
  const hasScore = parsed.data.score !== undefined;
  if (hasAnswers === hasScore) {
    return Response.json(
      { ok: false, error: "Javoblar yoki ball yuborilishi kerak" },
      { status: 400 },
    );
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id },
    include: { quiz: { include: { course: true, questions: { orderBy: { position: "asc" } } } } },
  });
  if (!attempt) return Response.json({ ok: false, error: "Urinish topilmadi" }, { status: 404 });

  try {
    const questions = attempt.quiz.questions.map(toQuestionFull);
    const expiredDeadline = expiredAttemptDeadline(attempt.startedAt, attempt.quiz.timeLimitMin);

    if (hasAnswers) {
      if (user.role !== "STUDENT" || attempt.studentId !== user.id) {
        return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
      if (attempt.finishedAt) {
        return Response.json({ ok: false, error: "Urinish allaqachon topshirilgan" }, { status: 409 });
      }
      if (expiredDeadline) {
        await closeExpiredAttempt(prisma, id, attempt.answers, questions, expiredDeadline);
        return Response.json(
          { ok: false, error: "Vaqt tugagan — urinish yopildi" },
          { status: 409 },
        );
      }
      const answers = parsed.data.answers ?? {};
      const score = autoScore(questions, answers);
      const updated = await prisma.quizAttempt.update({
        where: { id },
        data: { answers, score, finishedAt: new Date() },
      });
      return Response.json({
        ok: true,
        data: { id: updated.id, score: updated.score, finishedAt: updated.finishedAt },
      });
    }

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    const manageable = await findManageableQuiz(attempt.quizId, user);
    if (!manageable) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

    let finishedAt = attempt.finishedAt;
    if (!finishedAt && expiredDeadline) {
      const closed = await closeExpiredAttempt(prisma, id, attempt.answers, questions, expiredDeadline);
      finishedAt = closed.finishedAt;
    }
    if (!finishedAt) {
      return Response.json({ ok: false, error: "Urinish hali topshirilmagan" }, { status: 409 });
    }

    const maxScore = totalPoints(questions);
    const score = parsed.data.score ?? 0;
    if (score > maxScore) {
      return Response.json(
        { ok: false, error: `Ball 0 dan ${maxScore} gacha bo'lishi kerak` },
        { status: 400 },
      );
    }
    const updated = await prisma.quizAttempt.update({ where: { id }, data: { score } });
    return Response.json({ ok: true, data: { id: updated.id, score: updated.score } });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}
