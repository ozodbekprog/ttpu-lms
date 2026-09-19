import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicError } from "@/components/quiz/server";
import { asNumberArray, asStringArray } from "@/components/quiz/shared";
import { bankQuestionUpdateSchema, questionShapeError } from "@/components/question-bank/schema";
import { findManageableBankQuestion, resolveBankTarget } from "@/components/question-bank/server";
import { toBankQuestion } from "@/components/question-bank/shared";

const bankInclude = {
  course: { select: { id: true, title: true } },
  subject: { select: { id: true, name: true } },
};

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const question = await findManageableBankQuestion(id, user);
  if (!question) return Response.json({ ok: false, error: "Savol topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = bankQuestionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const merged = {
    courseId: data.courseId !== undefined ? data.courseId : question.courseId,
    subjectId: data.subjectId !== undefined ? data.subjectId : question.subjectId,
    text: data.text ?? question.text,
    type: data.type ?? question.type,
    options: data.options ?? asStringArray(question.options),
    correct: data.correct ?? asNumberArray(question.correct),
    difficulty: data.difficulty ?? question.difficulty,
  };

  const shapeIssue = questionShapeError(merged);
  if (shapeIssue) {
    return Response.json({ ok: false, error: shapeIssue }, { status: 400 });
  }
  const target = await resolveBankTarget(user, merged.courseId, merged.subjectId);
  if (!target.ok) {
    return Response.json({ ok: false, error: target.error }, { status: target.status });
  }

  try {
    const updated = await prisma.bankQuestion.update({
      where: { id },
      data: {
        courseId: merged.courseId,
        subjectId: merged.subjectId,
        text: merged.text,
        type: merged.type,
        options: merged.options,
        correct: merged.correct,
        difficulty: merged.difficulty,
      },
      include: bankInclude,
    });
    return Response.json({ ok: true, data: toBankQuestion(updated) });
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
  const question = await findManageableBankQuestion(id, user);
  if (!question) return Response.json({ ok: false, error: "Savol topilmadi" }, { status: 404 });

  try {
    await prisma.bankQuestion.delete({ where: { id } });
    return Response.json({ ok: true, data: { id } });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}
