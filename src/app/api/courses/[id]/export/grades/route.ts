import { getCurrentUser } from "@/lib/auth";
import { csvResponse, type CsvValue } from "@/components/reports/csv";
import { buildCourseReport, resolveManagedCourse, scoreKey } from "@/components/reports/report-data";
import { attendanceCounts } from "@/app/api/attendance/summary/data";
import type { AttendanceStatus } from "@prisma/client";

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
    ...report.assignments.map(
      (assignment) => `Topshiriq: ${assignment.title} (max ${assignment.maxScore})`,
    ),
    "Topshiriqlar %",
    ...report.quizzes.map((quiz) => `Test: ${quiz.title} (max ${quiz.maxScore})`),
    "Testlar %",
    "Davomat %",
    "Umumiy %",
    "Davomat %",
    "Imtihon ruxsati (Ha/Yo'q)",
  ];

  const rows: CsvValue[][] = [header];
  for (const student of report.students) {
    const statuses: AttendanceStatus[] = [];
    for (const date of report.attendanceDates) {
      const status = report.attendance.get(scoreKey(student.id, date));
      if (status) statuses.push(status);
    }
    const attendance = attendanceCounts(statuses);
    rows.push([
      student.name,
      student.email,
      student.group,
      ...report.assignments.map(
        (assignment) => report.scores.get(scoreKey(student.id, assignment.id)) ?? null,
      ),
      student.assignmentAverage,
      ...report.quizzes.map(
        (quiz) => report.quizScores.get(scoreKey(student.id, quiz.id)) ?? null,
      ),
      student.quizAverage,
      student.attendanceRate,
      student.overall,
      attendance.percent,
      attendance.eligible ? "Ha" : "Yo'q",
    ]);
  }

  return csvResponse(`baholar-${report.course.slug}.csv`, rows);
}
