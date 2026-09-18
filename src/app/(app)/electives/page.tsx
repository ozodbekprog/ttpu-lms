import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { type ElectiveCourse } from "@/components/electives/elective-course-card";
import { CourseBrowser } from "@/components/catalog/course-browser";

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

  const empty = (
    <EmptyState
      title="Tanlov fanlar yo'q"
      description="Hozircha e'lon qilingan tanlov fanlar mavjud emas. Yangi fanlar qo'shilganda shu yerda ko'rinadi."
      action={
        staff ? (
          <ButtonLink href="/courses/new" size="sm">
            Kurs yaratish
          </ButtonLink>
        ) : undefined
      }
    />
  );

  return (
    <>
      <PageHeader
        eyebrow="Katalog"
        title="Tanlov fanlar"
        subtitle={
          staff
            ? `E'lon qilingan tanlov fanlar — ${items.length} ta`
            : `Ochiq tanlov fanlar — ${items.length} ta`
        }
      />

      <CourseBrowser
        items={items}
        staff={staff}
        variant="elective"
        searchable
        empty={empty}
      />
    </>
  );
}
