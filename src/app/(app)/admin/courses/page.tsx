import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import CoursesManager from "@/components/admin/CoursesManager";

export default async function AdminCoursesPage() {
  await requireRole(["ADMIN"]);

  const [courses, teachers] = await Promise.all([
    prisma.course.findMany({
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["TEACHER", "ADMIN"] }, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const data = courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    isPublished: course.isPublished,
    createdAt: course.createdAt,
    teacher: course.teacher,
    studentCount: course._count.enrollments,
  }));

  return (
    <>
      <PageHeader title="Kurslar" subtitle={`${data.length} ta kurs`} />
      <CoursesManager courses={data} teachers={teachers} />
    </>
  );
}
