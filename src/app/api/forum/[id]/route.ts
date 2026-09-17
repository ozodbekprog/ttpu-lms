import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";

const pinSchema = z.object({ isPinned: z.boolean() });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const topic = await prisma.forumTopic.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, slug: true, teacherId: true } },
      author: { select: { id: true, name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
  if (!topic) {
    return Response.json({ ok: false, error: "Mavzu topilmadi" }, { status: 404 });
  }

  if (!canManageCourse(user, topic.course)) {
    const enrolled = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: topic.course.id, userId: user.id } },
    });
    if (!enrolled) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
  }

  return Response.json({ ok: true, data: topic });
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
  const topic = await prisma.forumTopic.findUnique({
    where: { id },
    include: { course: { select: { id: true, slug: true, teacherId: true } } },
  });
  if (!topic) {
    return Response.json({ ok: false, error: "Mavzu topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, topic.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const updated = await prisma.forumTopic.update({
    where: { id: topic.id },
    data: { isPinned: parsed.data.isPinned },
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
  const topic = await prisma.forumTopic.findUnique({
    where: { id },
    include: { course: { select: { id: true, slug: true, teacherId: true } } },
  });
  if (!topic) {
    return Response.json({ ok: false, error: "Mavzu topilmadi" }, { status: 404 });
  }
  if (topic.authorId !== user.id && !canManageCourse(user, topic.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.forumTopic.delete({ where: { id: topic.id } });

  return Response.json({ ok: true, data: { id: topic.id } });
}
