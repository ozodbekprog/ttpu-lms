import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    where: { isPublished: true, isElective: true },
    orderBy: { createdAt: "asc" },
    include: {
      teacher: { select: { id: true, name: true } },
      sections: { select: { _count: { select: { materials: true } } } },
      _count: { select: { enrollments: true } },
      enrollments: { where: { userId: user.id }, select: { id: true } },
    },
  });

  const data = courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    coverColor: course.coverColor,
    teacher: course.teacher,
    materialsCount: course.sections.reduce((sum, s) => sum + s._count.materials, 0),
    studentsCount: course._count.enrollments,
    isEnrolled: course.enrollments.length > 0,
  }));

  return Response.json({ ok: true, data });
}
