import { Badge, Table } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CuratorStudent } from "@/app/api/curator/data";

function percentTone(value: number | null) {
  if (value === null) return "text-slate-300";
  if (value >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200/70";
  if (value >= 60) return "bg-amber-50 text-amber-700 ring-amber-200/70";
  return "bg-rose-50 text-rose-700 ring-rose-200/70";
}

function PercentValue({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-300">—</span>;
  return (
    <span
      className={cn(
        "inline-flex min-w-[3.25rem] justify-center rounded-lg px-2 py-0.5 text-sm font-semibold tabular-nums ring-1 ring-inset",
        percentTone(value),
      )}
    >
      {value}%
    </span>
  );
}

export function CuratorStudentsTable({ students }: { students: CuratorStudent[] }) {
  if (students.length === 0) {
    return <p className="text-sm text-slate-500">Guruhda talaba yo&apos;q.</p>;
  }

  return (
    <Table>
      <thead>
        <tr className="text-xs uppercase tracking-wide text-slate-400">
          <th className="border-b border-slate-100 py-2.5 pr-4 text-left font-medium">Talaba</th>
          <th className="border-b border-slate-100 px-3 py-2.5 text-right font-medium">Davomat</th>
          <th className="border-b border-slate-100 px-3 py-2.5 text-right font-medium">
            Topshiriqlar
          </th>
          <th className="border-b border-slate-100 px-3 py-2.5 text-right font-medium">Testlar</th>
          <th className="border-b border-slate-100 px-3 py-2.5 text-right font-medium">GPA</th>
          <th className="border-b border-slate-100 py-2.5 pl-4 text-right font-medium">Holat</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => {
          const attendanceRisk = !student.attendance.eligible;
          const gpaRisk = student.gpa !== null && student.gpa < 2;
          return (
            <tr
              key={student.id}
              className={cn(
                "border-b border-slate-50 transition-colors duration-150 last:border-0",
                attendanceRisk
                  ? "bg-rose-50/50"
                  : gpaRisk
                    ? "bg-amber-50/50"
                    : "hover:bg-slate-50/80",
              )}
            >
              <td className="py-3 pr-4">
                <p className="text-sm font-medium text-slate-800">{student.name}</p>
                <p className="text-xs text-slate-400">{student.email}</p>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-2">
                  <PercentValue value={student.attendance.percent} />
                  <Badge tone={student.attendance.eligible ? "green" : "rose"}>
                    {student.attendance.eligible ? "Ruxsat" : "Ruxsat yo'q"}
                  </Badge>
                </div>
              </td>
              <td className="px-3 py-3 text-right">
                <PercentValue value={student.assignmentAverage} />
              </td>
              <td className="px-3 py-3 text-right">
                <PercentValue value={student.quizAverage} />
              </td>
              <td className="px-3 py-3 text-right">
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    student.gpa === null
                      ? "text-slate-300"
                      : student.gpa < 2
                        ? "text-rose-600"
                        : "text-slate-800",
                  )}
                >
                  {student.gpa !== null ? student.gpa.toFixed(2) : "—"}
                </span>
              </td>
              <td className="py-3 pl-4 text-right">
                {student.problematic ? (
                  <Badge tone={attendanceRisk ? "rose" : "amber"}>Muammoli</Badge>
                ) : (
                  <Badge tone="green">Yaxshi</Badge>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
