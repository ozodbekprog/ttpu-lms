import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader } from "@/components/ui";
import {
  ElectiveCourseCard,
  type ElectiveCourse,
} from "@/components/electives/elective-course-card";

export default async function ElectivesPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: { isPublished: true, isElective: true },
    orderBy: { createdAt: "asc" },
    include: {
      teacher: { select: { name: true } },
      sections: { select: { _count: { select: { materials: true } } } },
      _count: { select: { enrollments: true } },
      enrollments: { where: { userId: user.id }, select: { id: true } },
    },
  });

  const staff = user.role !== "STUDENT";

  const items: ElectiveCourse[] = courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    coverColor: course.coverColor,
    teacherName: course.teacher.name,
    materialsCount: course.sections.reduce((sum, s) => sum + s._count.materials, 0),
    studentsCount: course._count.enrollments,
    isEnrolled: course.enrollments.length > 0,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Tanlov fanlar"
        title="Electivlar"
        subtitle={
          staff
            ? `E'lon qilingan tanlov fanlar — ${items.length} ta`
            : `Tanlov fanlar — ${items.length} ta`
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="Tanlov fanlar yo'q"
          description="Hozircha e'lon qilingan tanlov fanlari mavjud emas."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((course) => (
            <ElectiveCourseCard key={course.id} course={course} staff={staff} />
          ))}
        </div>
      )}
    </>
  );
}
