import { Table } from "@/components/ui";
import { cn, gradeColor } from "@/lib/utils";
import type { CourseReport } from "@/components/reports/report-data";

function PercentCell({ value }: { value: number | null }) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 text-right text-sm font-semibold",
        value !== null ? gradeColor(value) : "text-slate-300",
      )}
    >
      {value !== null ? `${value}%` : "—"}
    </td>
  );
}

export function ReportStudentsTable({ report }: { report: CourseReport }) {
  if (report.students.length === 0) {
    return <p className="text-sm text-slate-500">Kursda talaba yo&apos;q.</p>;
  }

  return (
    <Table>
      <thead>
        <tr className="border-b border-slate-200 text-xs text-slate-500">
          <th className="py-2 pr-4 text-left font-medium">Talaba</th>
          <th className="px-3 py-2 text-right font-medium">Topshiriqlar</th>
          <th className="px-3 py-2 text-right font-medium">Testlar</th>
          <th className="px-3 py-2 text-right font-medium">Davomat</th>
          <th className="px-3 py-2 text-right font-medium">Umumiy</th>
        </tr>
      </thead>
      <tbody>
        {report.students.map((student) => (
          <tr key={student.id} className="border-b border-slate-100 last:border-0">
            <td className="py-2.5 pr-4">
              <p className="text-sm font-medium text-slate-800">{student.name}</p>
              <p className="text-xs text-slate-400">{student.group ?? student.email}</p>
            </td>
            <PercentCell value={student.assignmentAverage} />
            <PercentCell value={student.quizAverage} />
            <PercentCell value={student.attendanceRate} />
            <PercentCell value={student.overall} />
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
