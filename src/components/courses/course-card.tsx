import Link from "next/link";
import { Avatar, Badge, Card } from "@/components/ui";
import { initials } from "@/lib/utils";

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
    <Link href={`/courses/${course.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lift">
        <div
          className="relative h-24 shrink-0"
          style={{ background: `linear-gradient(120deg, ${course.coverColor}, #131f3c)` }}
        >
          <span className="pointer-events-none absolute -right-8 -top-12 size-28 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute -bottom-14 right-14 size-32 rounded-full bg-white/5" />
          <span className="absolute bottom-3 left-5 inline-flex size-10 items-center justify-center rounded-xl bg-white/15 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
            {initials(course.title)}
          </span>
          {staff && !course.isPublished ? (
            <span className="absolute right-3 top-3">
              <Badge tone="gold">Qoralama</Badge>
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-semibold tracking-tight text-slate-900 transition-colors duration-150 group-hover:text-brand-800">
            {course.title}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={course.teacherName} />
            <span className="truncate text-xs text-slate-500">{course.teacherName}</span>
          </div>
          {course.description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
              {course.description}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              {course.materialsCount} ta material
            </span>
            {staff ? (
              <span className="inline-flex items-center gap-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                {course.studentsCount} talaba
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
