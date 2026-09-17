import { getCurrentUser } from "@/lib/auth";
import {
  buildCourseReport,
  reportSummary,
  resolveManagedCourse,
} from "@/components/reports/report-data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const courseRef = new URL(request.url).searchParams.get("courseId");
  if (!courseRef) {
    return Response.json({ ok: false, error: "courseId parametri kerak" }, { status: 400 });
  }

  const resolved = await resolveManagedCourse(courseRef, user);
  if (!resolved.ok) {
    return Response.json({ ok: false, error: resolved.error }, { status: resolved.status });
  }

  const report = await buildCourseReport(resolved.course);

  return Response.json({ ok: true, data: reportSummary(report) });
}
