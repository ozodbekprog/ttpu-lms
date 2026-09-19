import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicError } from "@/components/quiz/server";
import { questionTypeSchema } from "@/components/quiz/schema";
import { bankQuestionCreateSchema } from "@/components/question-bank/schema";
import { resolveBankTarget } from "@/components/question-bank/server";
import { toBankQuestion } from "@/components/question-bank/shared";

const bankInclude = {
  course: { select: { id: true, title: true } },
  subject: { select: { id: true, name: true } },
} satisfies Prisma.BankQuestionInclude;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") ?? undefined;
  const subjectId = url.searchParams.get("subjectId") ?? undefined;
  const difficultyValue = url.searchParams.get("difficulty");
  const typeValue = url.searchParams.get("type");
  const query = (url.searchParams.get("q") ?? "").trim();

  const where: Prisma.BankQuestionWhereInput = {};
  if (courseId) where.courseId = courseId;
  if (subjectId) where.subjectId = subjectId;
  if (query) where.text = { contains: query, mode: "insensitive" };
  if (difficultyValue) {
    const difficulty = Number(difficultyValue);
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 3) {
      return Response.json({ ok: false, error: "Qiyinlik noto'g'ri" }, { status: 400 });
    }
    where.difficulty = difficulty;
  }
  if (typeValue) {
    const parsedType = questionTypeSchema.safeParse(typeValue);
    if (!parsedType.success) {
      return Response.json({ ok: false, error: "Savol turi noto'g'ri" }, { status: 400 });
    }
    where.type = parsedType.data;
  }
  if (user.role === "TEACHER") {
    where.OR = [
      { course: { teacherId: user.id } },
      { subject: { teachers: { some: { teacherId: user.id } } } },
    ];
  }

  try {
    const questions = await prisma.bankQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: bankInclude,
    });
    return Response.json({ ok: true, data: questions.map(toBankQuestion) });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bankQuestionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const target = await resolveBankTarget(user, data.courseId, data.subjectId);
  if (!target.ok) {
    return Response.json({ ok: false, error: target.error }, { status: target.status });
  }

  try {
    const question = await prisma.bankQuestion.create({
      data: {
        courseId: data.courseId,
        subjectId: data.subjectId,
        text: data.text,
        type: data.type,
        options: data.options,
        correct: data.correct,
        difficulty: data.difficulty,
      },
      include: bankInclude,
    });
    return Response.json({ ok: true, data: toBankQuestion(question) }, { status: 201 });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}
