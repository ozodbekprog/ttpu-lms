import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, EmptyState, Input, PageHeader } from "@/components/ui";
import {
  CatalogCourseCard,
  type CatalogCourse,
} from "@/components/catalog/catalog-course-card";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  const where: Prisma.CourseWhereInput = { isPublished: true };
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { teacher: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      teacher: { select: { name: true } },
      sections: { select: { _count: { select: { materials: true } } } },
      _count: { select: { enrollments: true } },
      enrollments: { where: { userId: user.id }, select: { id: true } },
    },
  });

  const staff = user.role !== "STUDENT";

  const items: CatalogCourse[] = courses.map((course) => ({
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
        title="Katalog"
        subtitle={
          staff
            ? `E'lon qilingan kurslar — ${items.length} ta`
            : `Ochiq kurslar — ${items.length} ta`
        }
      />

      <form action="/catalog" method="get" className="mb-6 flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Kurs yoki o'qituvchi nomi bo'yicha qidirish"
          className="max-w-md"
        />
        <Button type="submit" variant="secondary">
          Qidirish
        </Button>
        {query ? (
          <Link href="/catalog" className="text-sm text-slate-500 hover:text-slate-800">
            Tozalash
          </Link>
        ) : null}
      </form>

      {items.length === 0 ? (
        <EmptyState
          title={query ? "Hech narsa topilmadi" : "Kurslar yo'q"}
          description={
            query
              ? `"${query}" bo'yicha e'lon qilingan kurs topilmadi.`
              : "Hozircha katalogda e'lon qilingan kurslar yo'q."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((course) => (
            <CatalogCourseCard key={course.id} course={course} staff={staff} />
          ))}
        </div>
      )}
    </>
  );
}
