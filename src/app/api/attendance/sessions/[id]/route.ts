import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";

export async function GET(
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
  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, slug: true, title: true, teacherId: true } },
    },
  });
  if (!session) {
    return Response.json({ ok: false, error: "Sessiya topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, session.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const marks = await prisma.attendance.findMany({
    where: { courseId: session.courseId, date: session.date },
    include: { student: { select: { id: true, name: true } } },
    orderBy: { student: { name: "asc" } },
  });

  return Response.json({
    ok: true,
    data: {
      id: session.id,
      code: session.code,
      date: session.date,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      active: session.expiresAt.getTime() > Date.now(),
      course: {
        id: session.course.id,
        slug: session.course.slug,
        title: session.course.title,
      },
      marked: marks.map((mark) => ({
        studentId: mark.studentId,
        name: mark.student.name,
        status: mark.status,
      })),
    },
  });
}

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
  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: { course: { select: { teacherId: true } } },
  });
  if (!session) {
    return Response.json({ ok: false, error: "Sessiya topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, session.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const updated = await prisma.attendanceSession.update({
    where: { id },
    data: { expiresAt: now },
  });

  return Response.json({
    ok: true,
    data: { id: updated.id, expiresAt: updated.expiresAt, active: false },
  });
}
