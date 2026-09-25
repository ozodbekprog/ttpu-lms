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
    <Link href={`/courses/${course.slug}`} className="group block h-full rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-brand-200 group-hover:shadow-lift">
        <div
          className="relative h-28 shrink-0 overflow-hidden"
          style={{ background: `linear-gradient(125deg, ${course.coverColor} 0%, #131f3c 94%)` }}
        >
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_-10%,rgba(255,255,255,0.28),transparent_55%)]" />
          <span className="pointer-events-none absolute -right-10 -top-16 size-40 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <span className="pointer-events-none absolute -bottom-16 left-1/3 size-36 rounded-full bg-gold-400/10 blur-2xl" />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/15 to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 ring-1 ring-inset ring-white/20 backdrop-blur">
            Kurs
          </span>
          {staff && !course.isPublished ? (
            <span className="absolute right-4 top-4">
              <Badge tone="gold" className="shadow-sm ring-1 ring-inset ring-white/25">
                Qoralama
              </Badge>
            </span>
          ) : null}
          <span className="absolute bottom-4 left-4 inline-flex size-11 items-center justify-center rounded-2xl bg-white/15 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/25 backdrop-blur transition-transform duration-300 group-hover:scale-105">
            {initials(course.title)}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-base font-semibold tracking-tight text-slate-900 transition-colors duration-150 group-hover:text-brand-800">
            {course.title}
          </h3>
          <div className="mt-2.5 flex items-center gap-2">
            <Avatar name={course.teacherName} className="size-8! text-[10px]" />
            <span className="truncate text-xs font-medium text-slate-500">{course.teacherName}</span>
          </div>
          {course.description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
              {course.description}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200/70">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-600"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              {course.materialsCount} material
            </span>
            {staff ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200/70">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-600"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                {course.studentsCount} talaba
              </span>
            ) : null}
            <span className="ml-auto inline-flex size-7 items-center justify-center rounded-full bg-brand-50 text-brand-700 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
