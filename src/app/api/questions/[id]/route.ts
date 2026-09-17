import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { questionInputSchema } from "@/components/quiz/schema";
import { findManageableQuestion, publicError } from "@/components/quiz/server";
import { toQuestionFull } from "@/components/quiz/shared";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const question = await findManageableQuestion(id, user);
  if (!question) return Response.json({ ok: false, error: "Savol topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = questionInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.question.update({
      where: { id },
      data: {
        text: parsed.data.text,
        type: parsed.data.type,
        options: parsed.data.options,
        correct: parsed.data.correct,
        points: parsed.data.points,
      },
    });
    return Response.json({ ok: true, data: toQuestionFull(updated) });
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
  const question = await findManageableQuestion(id, user);
  if (!question) return Response.json({ ok: false, error: "Savol topilmadi" }, { status: 404 });

  try {
    await prisma.question.delete({ where: { id } });
    return Response.json({ ok: true, data: { id } });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}
