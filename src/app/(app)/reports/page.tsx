import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  Stat,
} from "@/components/ui";
import { buildCourseReport } from "@/components/reports/report-data";
import { ExportButtons } from "@/components/reports/export-buttons";
import { ReportStudentsTable } from "@/components/reports/report-table";

function percent(value: number | null) {
  return value !== null ? `${value}%` : "—";
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const user = await requireRole(["TEACHER", "ADMIN"]);

  const courses = await prisma.course.findMany({
    where: user.role === "ADMIN" ? {} : { teacherId: user.id },
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true },
  });

  const { courseId } = await searchParams;
  const selected = courses.find((course) => course.id === courseId) ?? courses[0] ?? null;

  if (!selected) {
    return (
      <>
        <PageHeader title="Hisobotlar" subtitle="O'qituvchi paneli" />
        <EmptyState title="Kurslar yo'q" description="Avval kurs yarating." />
      </>
    );
  }

  const report = await buildCourseReport(selected);
  const { stats } = report;

  return (
    <>
      <PageHeader
        title="Hisobotlar"
        subtitle={`${selected.title} · ${stats.studentCount} ta talaba`}
        action={
          <form
            method="get"
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-1.5 shadow-sm backdrop-blur"
          >
            <span className="hidden select-none items-center gap-1.5 pl-2 pr-1 text-xs font-semibold uppercase tracking-wider text-slate-600 sm:inline-flex">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 5h18" />
                <path d="M6 12h12" />
                <path d="M10 19h4" />
              </svg>
              Kurs
            </span>
            <Select name="courseId" defaultValue={selected.id} className="w-64">
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
            <Button type="submit">Ko&apos;rsatish</Button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl transition-transform duration-150 hover:-translate-y-0.5 [&>div]:h-full [&>div]:bg-gradient-to-br [&>div]:from-white [&>div]:to-brand-50/70">
          <Stat
            label="Talabalar"
            value={stats.studentCount}
            hint={`${stats.assignmentCount} topshiriq, ${stats.quizCount} test`}
          />
        </div>
        <div className="rounded-2xl transition-transform duration-150 hover:-translate-y-0.5 [&>div]:h-full [&>div]:bg-gradient-to-br [&>div]:from-white [&>div]:to-emerald-50/70">
          <Stat
            label="Topshiriqlar o'rtachasi"
            value={percent(stats.assignmentAverage)}
            hint={`${stats.gradedCount}/${stats.submissionCount} baholangan`}
          />
        </div>
        <div className="rounded-2xl transition-transform duration-150 hover:-translate-y-0.5 [&>div]:h-full [&>div]:bg-gradient-to-br [&>div]:from-white [&>div]:to-sky-50/70">
          <Stat
            label="Topshirish foizi"
            value={percent(stats.submissionRate)}
            hint={`${stats.submissionCount} ta javob`}
          />
        </div>
        <div className="rounded-2xl transition-transform duration-150 hover:-translate-y-0.5 [&>div]:h-full [&>div]:bg-gradient-to-br [&>div]:from-white [&>div]:to-amber-50/70">
          <Stat
            label="Davomat foizi"
            value={percent(stats.attendanceRate)}
            hint={`${stats.attendanceCount} ta yozuv`}
          />
        </div>
        <div className="rounded-2xl transition-transform duration-150 hover:-translate-y-0.5 [&>div]:h-full [&>div]:bg-gradient-to-br [&>div]:from-white [&>div]:to-purple-50/70">
          <Stat
            label="Test o'rtachasi"
            value={percent(stats.quizAverage)}
            hint={`${stats.quizCount} ta test`}
          />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader title="Eksport" subtitle="Excel uchun CSV (UTF-8, BOM)" />
        <CardBody>
          <ExportButtons courseId={selected.id} />
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Talabalar jadvali" subtitle={`${stats.studentCount} ta talaba`} />
        <CardBody>
          <ReportStudentsTable report={report} />
        </CardBody>
      </Card>
    </>
  );
}
