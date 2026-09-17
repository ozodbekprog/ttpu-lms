import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { CourseCard, type CourseCardData } from "@/components/courses/course-card";

export default async function CoursesPage() {
  const user = await requireUser();

  const where =
    user.role === "ADMIN"
      ? {}
      : user.role === "TEACHER"
        ? { teacherId: user.id }
        : { enrollments: { some: { userId: user.id } } };

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      teacher: { select: { name: true } },
      sections: { select: { _count: { select: { materials: true } } } },
      _count: { select: { enrollments: true } },
    },
  });

  const staff = user.role !== "STUDENT";

  const items: CourseCardData[] = courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    coverColor: course.coverColor,
    isPublished: course.isPublished,
    teacherName: course.teacher.name,
    materialsCount: course.sections.reduce((sum, s) => sum + s._count.materials, 0),
    studentsCount: course._count.enrollments,
  }));

  const subtitle =
    user.role === "ADMIN"
      ? `Barcha kurslar — ${items.length} ta`
      : user.role === "TEACHER"
        ? `Siz o'qitadigan kurslar — ${items.length} ta`
        : `Yozilgan kurslaringiz — ${items.length} ta`;

  return (
    <>
      <PageHeader
        title="Kurslar"
        subtitle={subtitle}
        action={staff ? <ButtonLink href="/courses/new">Yangi kurs</ButtonLink> : undefined}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Kurslar topilmadi"
          description={
            staff
              ? "Hozircha kurs yo'q. Birinchi kursni yarating."
              : "Siz hali biror kursga yozilmagansiz."
          }
          action={staff ? <ButtonLink href="/courses/new">Yangi kurs</ButtonLink> : undefined}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((course) => (
            <CourseCard key={course.id} course={course} staff={staff} />
          ))}
        </div>
      )}
    </>
  );
}
