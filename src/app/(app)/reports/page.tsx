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
          <form method="get" className="flex items-end gap-2">
            <Select name="courseId" defaultValue={selected.id} className="w-64">
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Ko&apos;rsatish
            </Button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          label="Talabalar"
          value={stats.studentCount}
          hint={`${stats.assignmentCount} topshiriq, ${stats.quizCount} test`}
        />
        <Stat
          label="Topshiriqlar o'rtachasi"
          value={percent(stats.assignmentAverage)}
          hint={`${stats.gradedCount}/${stats.submissionCount} baholangan`}
        />
        <Stat
          label="Topshirish foizi"
          value={percent(stats.submissionRate)}
          hint={`${stats.submissionCount} ta javob`}
        />
        <Stat
          label="Davomat foizi"
          value={percent(stats.attendanceRate)}
          hint={`${stats.attendanceCount} ta yozuv`}
        />
        <Stat label="Test o'rtachasi" value={percent(stats.quizAverage)} hint={`${stats.quizCount} ta test`} />
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
