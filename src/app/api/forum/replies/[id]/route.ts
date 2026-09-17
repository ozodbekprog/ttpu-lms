import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reply = await prisma.forumReply.findUnique({
    where: { id },
    include: {
      topic: {
        include: { course: { select: { id: true, slug: true, teacherId: true } } },
      },
    },
  });
  if (!reply) {
    return Response.json({ ok: false, error: "Javob topilmadi" }, { status: 404 });
  }
  if (reply.authorId !== user.id && !canManageCourse(user, reply.topic.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.forumReply.delete({ where: { id: reply.id } });

  return Response.json({ ok: true, data: { id: reply.id } });
}
