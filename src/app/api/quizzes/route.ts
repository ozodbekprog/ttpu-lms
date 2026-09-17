import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quizCreateSchema } from "@/components/quiz/schema";
import { publicError } from "@/components/quiz/server";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") ?? undefined;

  try {
    if (user.role === "STUDENT") {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
        select: { courseId: true },
      });
      const quizzes = await prisma.quiz.findMany({
        where: {
          isPublished: true,
          courseId: courseId ?? { in: enrollments.map((item) => item.courseId) },
        },
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true, slug: true } },
          _count: { select: { questions: true } },
          attempts: {
            where: { studentId: user.id },
            select: { id: true, startedAt: true, finishedAt: true, score: true },
            orderBy: { startedAt: "desc" },
          },
        },
      });
      return Response.json({ ok: true, data: quizzes });
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId,
        ...(user.role === "TEACHER" ? { course: { teacherId: user.id } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });
    return Response.json({ ok: true, data: quizzes });
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
  const parsed = quizCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: parsed.data.courseId } });
    if (!course) return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
    if (user.role === "TEACHER" && course.teacherId !== user.id) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { questions, ...meta } = parsed.data;
    const quiz = await prisma.quiz.create({
      data: {
        courseId: meta.courseId,
        title: meta.title,
        description: meta.description,
        timeLimitMin: meta.timeLimitMin,
        maxAttempts: meta.maxAttempts,
        isPublished: meta.isPublished,
        questions:
          questions && questions.length > 0
            ? {
                create: questions.map((question, index) => ({
                  text: question.text,
                  type: question.type,
                  options: question.options,
                  correct: question.correct,
                  points: question.points,
                  position: index + 1,
                })),
              }
            : undefined,
      },
    });
    return Response.json({ ok: true, data: { id: quiz.id } }, { status: 201 });
  } catch (error) {
    return Response.json({ ok: false, error: publicError(error) }, { status: 500 });
  }
}
