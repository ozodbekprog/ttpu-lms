import Link from "next/link";
import { Avatar, Badge, ButtonLink, Card, CardBody } from "@/components/ui";
import { EnrollButton } from "@/components/catalog/enroll-button";

export type ElectiveCourse = {
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

export function ElectiveCourseCard({
  course,
  staff,
}: {
  course: ElectiveCourse;
  staff: boolean;
}) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-300/80 hover:shadow-[0_2px_6px_rgba(16,24,40,0.05),0_16px_36px_-16px_rgba(29,52,96,0.22)]">
      <div className="relative h-16" style={{ backgroundColor: course.coverColor }}>
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 to-black/10" />
        <span className="absolute inset-x-0 bottom-0 h-px bg-gold-400/70" />
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-gold-600 shadow-sm">
          Tanlov fan
        </span>
      </div>
      <CardBody className="flex flex-1 flex-col">
        <div className="flex items-start gap-3">
          <Avatar name={course.teacherName} className="-mt-9 size-12 text-sm ring-4 ring-white" />
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="truncate font-semibold tracking-tight text-slate-900">
              <Link
                href={`/courses/${course.slug}`}
                className="transition-colors duration-150 hover:text-brand-700"
              >
                {course.title}
              </Link>
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">{course.teacherName}</p>
          </div>
        </div>

        {course.description ? (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {course.description}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            {course.materialsCount} material
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {course.studentsCount} talaba
          </span>
        </div>

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
