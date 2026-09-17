import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";

const patchSchema = z.object({
  title: z.string().trim().min(1, "Sarlavha kiriting").max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  dueAt: z.string().trim().nullable().optional(),
  maxScore: z.coerce.number().int().min(1).max(1000).optional(),
});

function parseDueAt(value: string | null | undefined) {
  if (!value) return { ok: true as const, date: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { ok: false as const, date: null };
  return { ok: true as const, date };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!assignment) {
    return Response.json({ ok: false, error: "Topshiriq topilmadi" }, { status: 404 });
  }

  if (user.role === "STUDENT") {
    const enrolled = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: assignment.courseId, userId: user.id } },
    });
    if (!enrolled) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id, studentId: user.id },
    });
    return Response.json({ ok: true, data: { ...assignment, submissions } });
  }

  if (!canManageCourse(user, assignment.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const submissions = await prisma.submission.findMany({
    where: { assignmentId: id },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { submittedAt: "asc" },
  });
  return Response.json({ ok: true, data: { ...assignment, submissions } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!assignment) {
    return Response.json({ ok: false, error: "Topshiriq topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, assignment.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const due = parseDueAt(parsed.data.dueAt);
  if (!due.ok) {
    return Response.json({ ok: false, error: "Muddat sanasi noto'g'ri" }, { status: 400 });
  }

  const updated = await prisma.assignment.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description || null }
        : {}),
      ...(parsed.data.dueAt !== undefined ? { dueAt: due.date } : {}),
      ...(parsed.data.maxScore !== undefined ? { maxScore: parsed.data.maxScore } : {}),
    },
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!assignment) {
    return Response.json({ ok: false, error: "Topshiriq topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, assignment.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.assignment.delete({ where: { id } });

  return Response.json({ ok: true, data: { id } });
}
