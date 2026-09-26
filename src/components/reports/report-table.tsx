import { Table } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CourseReport } from "@/components/reports/report-data";

function percentTone(value: number | null) {
  if (value === null) return "text-slate-500";
  if (value >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200/70";
  if (value >= 60) return "bg-amber-50 text-amber-700 ring-amber-200/70";
  return "bg-rose-50 text-rose-700 ring-rose-200/70";
}

function PercentCell({ value, emphasis = false }: { value: number | null; emphasis?: boolean }) {
  return (
    <td
      className={cn(
        "px-3 py-3 text-right text-sm font-semibold",
        emphasis ? "bg-brand-50/40 group-hover:bg-brand-50/70" : "",
      )}
    >
      {value !== null ? (
        <span
          className={cn(
            "inline-flex min-w-[3.25rem] justify-center rounded-lg px-2 py-0.5 tabular-nums ring-1 ring-inset transition-colors duration-150",
            percentTone(value),
          )}
        >
          {value}%
        </span>
      ) : (
        <span className="text-slate-500">—</span>
      )}
    </td>
  );
}

export function ReportStudentsTable({ report }: { report: CourseReport }) {
  if (report.students.length === 0) {
    return <p className="text-sm text-slate-500">Kursda talaba yo&apos;q.</p>;
  }

  return (
    <Table className="max-h-[70vh]">
      <thead>
        <tr className="text-xs uppercase tracking-wide text-slate-600">
          <th className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 py-2.5 pr-4 text-left font-medium backdrop-blur">
            Talaba
          </th>
          <th className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-3 py-2.5 text-right font-medium backdrop-blur">
            Topshiriqlar
          </th>
          <th className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-3 py-2.5 text-right font-medium backdrop-blur">
            Testlar
          </th>
          <th className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-3 py-2.5 text-right font-medium backdrop-blur">
            Davomat
          </th>
          <th className="sticky top-0 z-10 rounded-r-xl border-b border-slate-100 bg-brand-50 px-3 py-2.5 text-right font-semibold text-brand-800">
            Umumiy
          </th>
        </tr>
      </thead>
      <tbody>
        {report.students.map((student) => (
          <tr
            key={student.id}
            className="group border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/80"
          >
            <td className="py-3 pr-4">
              <p className="text-sm font-medium text-slate-800 transition-colors duration-150 group-hover:text-brand-900">
                {student.name}
              </p>
              <p className="text-xs text-slate-600">{student.group ?? student.email}</p>
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
