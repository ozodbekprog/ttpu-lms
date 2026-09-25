import Link from "next/link";
import { Badge, ButtonLink, Card, CardBody, EmptyState, Progress } from "@/components/ui";
import { AttendanceRing } from "@/components/attendance/overview-ring";
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

const TILES = [
  { key: "courses", label: "Kurslar", tone: "bg-brand-50 text-brand-700 ring-brand-100" },
  { key: "students", label: "Talabalar", tone: "bg-purple-50 text-purple-600 ring-purple-100" },
  { key: "marks", label: "Belgilar", tone: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  { key: "risk", label: "80% dan past", tone: "bg-rose-50 text-rose-600 ring-rose-100" },
] as const;

function TileIcon({ tile }: { tile: (typeof TILES)[number]["key"] }) {
  const stroke = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  if (tile === "courses") {
    return (
      <svg {...stroke}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M4 5.5v16" />
      </svg>
    );
  }
  if (tile === "students") {
    return (
      <svg {...stroke}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M16 5.5a3 3 0 0 1 0 5.8M17.5 20a5.4 5.4 0 0 0-2-4.2" />
      </svg>
    );
  }
  if (tile === "marks") {
    return (
      <svg {...stroke}>
        <path d="M4 19V5M4 19h16" />
        <path d="M8 15v-4M12.5 15V7M17 15v-6" />
      </svg>
    );
  }
  return (
    <svg {...stroke}>
      <path d="M12 3l9 16H3z" />
      <path d="M12 9v4M12 16h.01" />
    </svg>
  );
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
  const tileValues: Record<(typeof TILES)[number]["key"], number> = {
    courses: courses.length,
    students: totals.students,
    marks: totals.total,
    risk: atRisk,
  };

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
      <Card className="animate-fade-up relative overflow-hidden border-brand-100/80">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
        <span className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-gold-300/15 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-28 -left-16 size-64 rounded-full bg-brand-300/20 blur-3xl" />
        <CardBody className="relative grid gap-8 py-8 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex justify-center">
            <AttendanceRing percent={overallPercent} caption="umumiy davomat" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-lg ring-1",
                  atRisk === 0
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25 ring-emerald-300/50"
                    : "bg-gradient-to-r from-amber-500 to-gold-500 shadow-amber-500/25 ring-amber-300/50",
                )}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {atRisk === 0 ? (
                    <path d="m5 13 4 4L19 7" />
                  ) : (
                    <>
                      <path d="M12 3l9 16H3z" />
                      <path d="M12 9v4M12 16h.01" />
                    </>
                  )}
                </svg>
                {atRisk === 0 ? "Barcha kurslar barqaror" : `${atRisk} kurs e'tibor talab qiladi`}
              </span>
              <span className="text-sm text-slate-500">
                {courses.length} ta kurs · {totals.students} ta talaba
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TILES.map((tile) => (
                <div
                  key={tile.key}
                  className="rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lift"
                >
                  <span className={cn("inline-flex size-8 items-center justify-center rounded-xl ring-1", tile.tone)}>
                    <TileIcon tile={tile.key} />
                  </span>
                  <p className="mt-2.5 text-xl font-semibold tabular-nums text-brand-950">
                    {tile.key === "marks" && totals.total === 0 ? "—" : tileValues[tile.key]}
                  </p>
                  <p className="text-xs text-slate-600">{tile.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Progress value={overallPercent} max={100} className="h-2 flex-1" />
              <span className="text-xs font-semibold tabular-nums text-slate-500">
                {totals.attended} / {totals.total}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="animate-fade-up group relative overflow-hidden transition-shadow duration-200 hover:shadow-lift"
          >
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400 opacity-70 transition-opacity duration-200 group-hover:opacity-100" />
            <CardBody className="flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="font-semibold tracking-tight text-slate-900 transition-colors duration-150 hover:text-brand-700"
                  >
                    {course.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-600">
                    {course.students} ta talaba · {course.total} ta belgi
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-xl px-2 py-1 text-lg font-semibold tabular-nums",
                    course.total === 0
                      ? "text-slate-500"
                      : course.percent >= 80
                        ? "bg-emerald-50 text-emerald-600"
                        : course.percent >= 60
                          ? "bg-amber-50 text-amber-600"
                          : "bg-rose-50 text-rose-600",
                  )}
                >
                  {course.total > 0 ? `${course.percent}%` : "—"}
                </span>
              </div>

              <Progress value={course.percent} max={100} className="h-2" />

              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {course.present} keldi
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  {course.late} kech
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  <span className="size-1.5 rounded-full bg-slate-400" />
                  {course.excused} sababli
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                  <span className="size-1.5 rounded-full bg-rose-500" />
                  {course.absent} kelmadi
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
