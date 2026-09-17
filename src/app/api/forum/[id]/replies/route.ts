import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";
import { notifyUser } from "@/server/notify";

const replySchema = z.object({
  body: z.string().trim().min(1, "Javob matnini kiriting").max(10000),
});

export async function POST(
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
    const enrolled = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: topic.course.id, userId: user.id } },
    });
    if (!enrolled) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await request.json().catch(() => null);
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const reply = await prisma.forumReply.create({
    data: {
      topicId: topic.id,
      authorId: user.id,
      body: parsed.data.body,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  if (topic.authorId !== user.id) {
    try {
      await notifyUser(topic.authorId, {
        title: `Yangi javob: ${topic.title}`,
        body: reply.body.slice(0, 200),
        link: `/courses/${topic.course.slug}/forum/${topic.id}`,
      });
    } catch {}
  }

  return Response.json({ ok: true, data: reply }, { status: 201 });
}
