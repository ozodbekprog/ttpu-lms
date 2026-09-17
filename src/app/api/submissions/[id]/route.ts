import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";
import { notifyUser } from "@/server/notify";

const gradeSchema = z.object({
  score: z.coerce.number().int().min(0),
  feedback: z.string().trim().max(5000).nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { assignment: { include: { course: true } } },
  });
  if (!submission) {
    return Response.json({ ok: false, error: "Topshiriq javobi topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, submission.assignment.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = gradeSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  if (parsed.data.score > submission.assignment.maxScore) {
    return Response.json(
      { ok: false, error: `Ball 0 dan ${submission.assignment.maxScore} gacha bo'lishi kerak` },
      { status: 400 },
    );
  }

  const updated = await prisma.submission.update({
    where: { id },
    data: {
      score: parsed.data.score,
      feedback: parsed.data.feedback || null,
      status: "GRADED",
      gradedAt: new Date(),
    },
  });

  try {
    await notifyUser(submission.studentId, {
      title: `Topshiriq baholandi: ${submission.assignment.title} — ${parsed.data.score} ball`,
      link: `/courses/${submission.assignment.course.slug}/assignments/${submission.assignmentId}`,
    });
  } catch {}

  return Response.json({ ok: true, data: updated });
}
