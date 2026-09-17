import { getCurrentUser } from "@/lib/auth";
import { csvResponse, type CsvValue } from "@/components/reports/csv";
import {
  ATTENDANCE_CODES,
  buildCourseReport,
  resolveManagedCourse,
  scoreKey,
} from "@/components/reports/report-data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const resolved = await resolveManagedCourse(id, user);
  if (!resolved.ok) {
    return Response.json({ ok: false, error: resolved.error }, { status: resolved.status });
  }

  const report = await buildCourseReport(resolved.course);

  const header: CsvValue[] = [
    "Talaba",
    "Email",
    "Guruh",
    ...report.attendanceDates,
    "Davomat %",
  ];

  const rows: CsvValue[][] = [header];
  for (const student of report.students) {
    rows.push([
      student.name,
      student.email,
      student.group,
      ...report.attendanceDates.map((date) => {
        const status = report.attendance.get(scoreKey(student.id, date));
        return status ? ATTENDANCE_CODES[status] : null;
      }),
      student.attendanceRate,
    ]);
  }

  return csvResponse(`davomat-${report.course.slug}.csv`, rows);
}
