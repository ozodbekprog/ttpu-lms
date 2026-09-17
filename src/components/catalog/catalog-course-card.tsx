import Link from "next/link";
import { Badge, ButtonLink, Card, CardBody } from "@/components/ui";
import { EnrollButton } from "@/components/catalog/enroll-button";

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverColor: string;
  teacherName: string;
  materialsCount: number;
  studentsCount: number;
  isEnrolled: boolean;
};

export function CatalogCourseCard({ course, staff }: { course: CatalogCourse; staff: boolean }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition hover:border-blue-300 hover:shadow-md">
      <div className="h-20" style={{ backgroundColor: course.coverColor }} />
      <CardBody className="flex flex-1 flex-col">
        <h3 className="text-sm font-semibold text-slate-900">
          <Link href={`/courses/${course.slug}`} className="hover:text-blue-700">
            {course.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-slate-500">{course.teacherName}</p>
        {course.description ? (
          <p className="mt-2 line-clamp-2 text-xs text-slate-400">{course.description}</p>
        ) : null}
        <p className="mt-3 text-xs text-slate-400">
          {course.materialsCount} ta material · {course.studentsCount} talaba
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {staff ? (
            <ButtonLink href={`/courses/${course.slug}`} variant="secondary" size="sm">
              Boshqarish
            </ButtonLink>
          ) : course.isEnrolled ? (
            <>
              <Badge tone="green">Yozilgansiz ✓</Badge>
              <ButtonLink href={`/courses/${course.slug}`} variant="secondary" size="sm">
                Kursga o&apos;tish
              </ButtonLink>
            </>
          ) : (
            <EnrollButton courseId={course.id} />
          )}
        </div>
      </CardBody>
    </Card>
  );
}
