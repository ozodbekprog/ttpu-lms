import Link from "next/link";
import { Badge, Card, CardBody } from "@/components/ui";

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverColor: string;
  isPublished: boolean;
  teacherName: string;
  materialsCount: number;
  studentsCount: number;
};

export function CourseCard({ course, staff = false }: { course: CourseCardData; staff?: boolean }) {
  return (
    <Link href={`/courses/${course.slug}`} className="block h-full">
      <Card className="h-full overflow-hidden transition hover:border-blue-300 hover:shadow-md">
        <div className="h-20" style={{ backgroundColor: course.coverColor }} />
        <CardBody>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{course.title}</h3>
            {staff && !course.isPublished ? <Badge tone="amber">Qoralama</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">{course.teacherName}</p>
          {course.description ? (
            <p className="mt-2 line-clamp-2 text-xs text-slate-400">{course.description}</p>
          ) : null}
          <p className="mt-3 text-xs text-slate-400">
            {course.materialsCount} ta material
            {staff ? ` · ${course.studentsCount} talaba` : ""}
          </p>
        </CardBody>
      </Card>
    </Link>
  );
}
