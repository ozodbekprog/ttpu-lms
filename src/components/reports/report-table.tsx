import { Table } from "@/components/ui";
import { cn, gradeColor } from "@/lib/utils";
import type { CourseReport } from "@/components/reports/report-data";

function PercentCell({ value, emphasis = false }: { value: number | null; emphasis?: boolean }) {
  return (
    <td
      className={cn(
        "px-3 py-3 text-right text-sm font-semibold transition-colors duration-150",
        emphasis ? "bg-brand-50/40 group-hover:bg-brand-50/70" : "",
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
        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
          <th className="py-2.5 pr-4 text-left font-medium">Talaba</th>
          <th className="px-3 py-2.5 text-right font-medium">Topshiriqlar</th>
          <th className="px-3 py-2.5 text-right font-medium">Testlar</th>
          <th className="px-3 py-2.5 text-right font-medium">Davomat</th>
          <th className="rounded-r-xl bg-brand-50 px-3 py-2.5 text-right font-semibold text-brand-800">
            Umumiy
          </th>
        </tr>
      </thead>
      <tbody>
        {report.students.map((student) => (
          <tr
            key={student.id}
            className="group border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
          >
            <td className="py-3 pr-4">
              <p className="text-sm font-medium text-slate-800">{student.name}</p>
              <p className="text-xs text-slate-400">{student.group ?? student.email}</p>
            </td>
            <PercentCell value={student.assignmentAverage} />
            <PercentCell value={student.quizAverage} />
            <PercentCell value={student.attendanceRate} />
            <PercentCell value={student.overall} emphasis />
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
