import Link from "next/link";
import { Badge, Table } from "@/components/ui";
import { formatHours, type WorkloadCourse } from "./workload-data";

export function WorkloadCoursesTable({
  courses,
  showTeacher,
}: {
  courses: WorkloadCourse[];
  showTeacher: boolean;
}) {
  return (
    <Table>
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <th className="px-5 py-3 font-semibold">Kurs</th>
          {showTeacher ? <th className="px-5 py-3 font-semibold">O&apos;qituvchi</th> : null}
          <th className="px-5 py-3 text-right font-semibold">Talabalar</th>
          <th className="px-5 py-3 font-semibold">Topshiriqlar</th>
          <th className="px-5 py-3 font-semibold">Testlar</th>
          <th className="px-5 py-3 text-right font-semibold">Haftalik soat</th>
        </tr>
      </thead>
      <tbody>
        {courses.map((course) => (
          <tr
            key={course.id}
            className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
          >
            <td className="px-5 py-3">
              <Link
                href={`/courses/${course.slug}`}
                className="font-medium text-slate-800 transition-colors duration-150 hover:text-brand-700"
              >
                {course.title}
              </Link>
            </td>
            {showTeacher ? (
              <td className="px-5 py-3 text-slate-600">{course.teacherName}</td>
            ) : null}
            <td className="px-5 py-3 text-right tabular-nums text-slate-700">
              {course.studentCount}
            </td>
            <td className="px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tabular-nums text-slate-700">{course.assignmentCount}</span>
                {course.pendingSubmissions > 0 ? (
                  <Badge tone="amber">{course.pendingSubmissions} baholanmagan</Badge>
                ) : null}
              </div>
            </td>
            <td className="px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tabular-nums text-slate-700">{course.quizCount}</span>
                {course.pendingTextAnswers > 0 ? (
                  <Badge tone="amber">{course.pendingTextAnswers} matnli javob</Badge>
                ) : null}
              </div>
            </td>
            <td className="px-5 py-3 text-right tabular-nums text-slate-700">
              {formatHours(course.weeklyHours)}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
