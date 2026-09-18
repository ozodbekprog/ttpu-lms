import Link from "next/link";
import { Badge, ButtonLink, Card, CardBody, EmptyState, Progress, Stat } from "@/components/ui";
import { cn } from "@/lib/utils";

export type StaffCourseAttendanceRow = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  students: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  percent: number;
};

function percentTone(percent: number) {
  if (percent >= 80) return "text-emerald-600";
  if (percent >= 60) return "text-amber-600";
  return "text-rose-600";
}

export function StaffAttendanceOverview({ courses }: { courses: StaffCourseAttendanceRow[] }) {
  const totals = courses.reduce(
    (accumulator, course) => ({
      students: accumulator.students + course.students,
      attended: accumulator.attended + course.present + course.late + course.excused,
      total: accumulator.total + course.total,
    }),
    { students: 0, attended: 0, total: 0 },
  );
  const overallPercent =
    totals.total > 0 ? Math.round((totals.attended / totals.total) * 100) : 0;
  const atRisk = courses.filter((course) => course.total > 0 && course.percent < 80).length;

  if (courses.length === 0) {
    return (
      <EmptyState
        title="Kurslar yo'q"
        description="Davomat statistikasi kurslar mavjud bo'lganda ko'rinadi."
        action={
          <ButtonLink href="/courses" variant="secondary" size="sm">
            Kurslarga o&apos;tish
          </ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Kurslar" value={courses.length} />
        <Stat label="Talabalar" value={totals.students} hint="Barcha kurslar bo'yicha" />
        <Stat label="Umumiy davomat" value={`${overallPercent}%`} hint={`${totals.attended} / ${totals.total} belgi`} />
        <Stat label="80% dan past" value={atRisk} hint="E'tibor talab qiladigan kurslar" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="relative overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
            <CardBody className="flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="font-semibold tracking-tight text-slate-900 transition-colors duration-150 hover:text-brand-700"
                  >
                    {course.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    {course.students} ta talaba · {course.total} ta belgi
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-2xl font-semibold tabular-nums",
                    course.total > 0 ? percentTone(course.percent) : "text-slate-300",
                  )}
                >
                  {course.total > 0 ? `${course.percent}%` : "—"}
                </span>
              </div>

              <Progress value={course.percent} max={100} className="h-2" />

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>
                  <span className="font-semibold text-emerald-600">{course.present}</span> keldi
                </span>
                <span>
                  <span className="font-semibold text-amber-600">{course.late}</span> kechikdi
                </span>
                <span>
                  <span className="font-semibold text-slate-500">{course.excused}</span> sababli
                </span>
                <span>
                  <span className="font-semibold text-rose-600">{course.absent}</span> kelmadi
                </span>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <ButtonLink
                  href={`/courses/${course.slug}/attendance/journal`}
                  variant="secondary"
                  size="sm"
                >
                  Jurnal
                </ButtonLink>
                <ButtonLink href={`/courses/${course.slug}/attendance`} variant="ghost" size="sm">
                  QR check-in
                </ButtonLink>
                {course.isPublished ? null : <Badge tone="amber">Qoralama</Badge>}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
