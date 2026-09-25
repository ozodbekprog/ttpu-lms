import Link from "next/link";
import { Badge, Table } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatHours, type WorkloadTeacher } from "./workload-data";

export type WorkloadSortKey = "name" | "courses" | "students" | "hours" | "pending";

const SORT_KEYS: WorkloadSortKey[] = ["name", "courses", "students", "hours", "pending"];

export function parseWorkloadSort(
  sort?: string,
  dir?: string,
): { sort: WorkloadSortKey; dir: "asc" | "desc" } {
  const key = SORT_KEYS.includes(sort as WorkloadSortKey) ? (sort as WorkloadSortKey) : "name";
  return { sort: key, dir: dir === "desc" ? "desc" : "asc" };
}

export function sortWorkloadTeachers(
  teachers: WorkloadTeacher[],
  sort: WorkloadSortKey,
  dir: "asc" | "desc",
) {
  const factor = dir === "asc" ? 1 : -1;
  return [...teachers].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "uz") * factor;
    const value = (row: WorkloadTeacher) => {
      if (sort === "courses") return row.courseCount;
      if (sort === "students") return row.studentCount;
      if (sort === "hours") return row.weeklyHours;
      return row.pendingReviews;
    };
    return (value(a) - value(b)) * factor;
  });
}

const COLUMNS: Array<{ key: WorkloadSortKey; label: string; align?: "right" }> = [
  { key: "name", label: "O'qituvchi" },
  { key: "courses", label: "Kurslar", align: "right" },
  { key: "students", label: "Talabalar", align: "right" },
  { key: "hours", label: "Haftalik soat", align: "right" },
  { key: "pending", label: "Kutilayotgan", align: "right" },
];

function sortHref(
  key: WorkloadSortKey,
  current: WorkloadSortKey,
  dir: "asc" | "desc",
  teacherId: string | null,
) {
  const params = new URLSearchParams();
  if (teacherId) params.set("teacherId", teacherId);
  params.set("sort", key);
  params.set("dir", current === key && dir === "asc" ? "desc" : "asc");
  return `/workload?${params.toString()}`;
}

function teacherHref(id: string, sort: WorkloadSortKey, dir: "asc" | "desc") {
  const params = new URLSearchParams();
  params.set("teacherId", id);
  params.set("sort", sort);
  params.set("dir", dir);
  return `/workload?${params.toString()}`;
}

function SortArrows({ dir }: { dir: "asc" | "desc" | null }) {
  return (
    <span aria-hidden className="inline-flex flex-col -space-y-1">
      <svg
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={dir === "asc" ? "text-brand-700" : "text-slate-300"}
      >
        <path d="m6 15 6-6 6 6" />
      </svg>
      <svg
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={dir === "desc" ? "text-brand-700" : "text-slate-300"}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

export function WorkloadTeachersTable({
  teachers,
  sort,
  dir,
  activeTeacherId,
}: {
  teachers: WorkloadTeacher[];
  sort: WorkloadSortKey;
  dir: "asc" | "desc";
  activeTeacherId: string | null;
}) {
  return (
    <Table>
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          {COLUMNS.map((column) => {
            const active = sort === column.key;
            return (
              <th
                key={column.key}
                aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
                className={cn("group/sort px-5 py-3", column.align === "right" ? "text-right" : "")}
              >
                <Link
                  href={sortHref(column.key, sort, dir, activeTeacherId)}
                  className={cn(
                    "inline-flex select-none items-center gap-1.5 transition-colors duration-150 hover:text-brand-700",
                    active ? "text-brand-700" : "",
                  )}
                >
                  {column.label}
                  <span
                    className={cn(
                      "inline-flex transition-opacity duration-150",
                      active ? "opacity-100" : "opacity-0 group-hover/sort:opacity-100",
                    )}
                  >
                    <SortArrows dir={active ? dir : null} />
                  </span>
                </Link>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {teachers.map((teacher) => {
          const active = teacher.id === activeTeacherId;
          return (
            <tr
              key={teacher.id}
              className={
                active
                  ? "border-b border-slate-50 bg-brand-50/60 last:border-0"
                  : "border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
              }
            >
              <td className="px-5 py-3">
                <Link
                  href={teacherHref(teacher.id, sort, dir)}
                  className="font-medium text-slate-800 transition-colors duration-150 hover:text-brand-700"
                >
                  {teacher.name}
                </Link>
                <p className="text-xs text-slate-600">{teacher.email}</p>
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                {teacher.courseCount}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                {teacher.studentCount}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                {formatHours(teacher.weeklyHours)}
              </td>
              <td className="px-5 py-3 text-right">
                {teacher.pendingReviews > 0 ? (
                  <Badge tone="amber">{teacher.pendingReviews}</Badge>
                ) : (
                  <span className="tabular-nums text-slate-600">0</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
