import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { questionInputSchema } from "@/components/quiz/schema";
import { findManageableQuiz, publicError } from "@/components/quiz/server";
import { toQuestionFull } from "@/components/quiz/shared";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const quiz = await findManageableQuiz(id, user);
  if (!quiz) return Response.json({ ok: false, error: "Test topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = questionInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  try {
    const last = await prisma.question.findFirst({
      where: { quizId: id },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const question = await prisma.question.create({
      data: {
        quizId: id,
        text: parsed.data.text,
        type: parsed.data.type,
        options: parsed.data.options,
        correct: parsed.data.correct,
        points: parsed.data.points,
        position: (last?.position ?? 0) + 1,
      },
    });
    return Response.json({ ok: true, data: toQuestionFull(question) }, { status: 201 });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}
