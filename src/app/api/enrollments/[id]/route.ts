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
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: { course: { select: { id: true, teacherId: true } } },
  });
  if (!enrollment) {
    return Response.json({ ok: false, error: "Yozuv topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, enrollment.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.enrollment.delete({ where: { id: enrollment.id } });

  return Response.json({ ok: true, data: { id: enrollment.id } });
}
