import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, ButtonLink, Card, CardBody, EmptyState, Input, PageHeader } from "@/components/ui";
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
        eyebrow="Kurslar"
        title="Katalog"
        subtitle={
          staff
            ? `E'lon qilingan kurslar — ${items.length} ta`
            : `Ochiq kurslar — ${items.length} ta`
        }
      />

      <form action="/catalog" method="get" className="mb-6">
        <Card>
          <CardBody className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-96">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <Input
                name="q"
                defaultValue={query}
                placeholder="Kurs yoki o'qituvchi nomi bo'yicha qidirish"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Qidirish
            </Button>
            {query ? (
              <Link
                href="/catalog"
                className="text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-brand-800"
              >
                Tozalash
              </Link>
            ) : null}
          </CardBody>
        </Card>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title={query ? "Hech narsa topilmadi" : "Kurslar yo'q"}
          description={
            query
              ? `"${query}" bo'yicha e'lon qilingan kurs topilmadi.`
              : "Hozircha katalogda e'lon qilingan kurslar yo'q."
          }
          action={
            query ? (
              <ButtonLink href="/catalog" variant="secondary" size="sm">
                Barcha kurslar
              </ButtonLink>
            ) : undefined
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
