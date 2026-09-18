import Link from "next/link";
import { Card, CardBody, CardHeader, Progress, Table } from "@/components/ui";
import { GradeBadge } from "@/components/grades/grade-badge";
import { GPA_CREDITS } from "@/app/api/gpa/data";
import type { StudentGpa } from "@/app/api/gpa/data";
import { GpaPointsBadge, LetterBadge } from "./gpa-badge";

export function GpaCourseTable({ data, delay = 0 }: { data: StudentGpa; delay?: number }) {
  const { courses, gpa, totalCredits } = data;

  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <Card className="h-full">
        <CardHeader
          title="Kurslar bo'yicha"
          subtitle={`${courses.length} ta kurs · har biri ${GPA_CREDITS} kredit`}
        />
        <CardBody>
          <Table>
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2.5 pr-3 text-left font-medium">Kurs</th>
                <th className="px-3 py-2.5 text-center font-medium">O&apos;rtacha</th>
                <th className="px-3 py-2.5 text-center font-medium">Baho</th>
                <th className="px-3 py-2.5 text-center font-medium">GPA ball</th>
                <th className="px-3 py-2.5 text-right font-medium">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr
                  key={course.courseId}
                  className="group border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="py-3 pr-3">
                    <Link href={`/courses/${course.slug}`} className="flex items-center gap-3">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                        {course.title.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800 transition-colors duration-150 group-hover:text-brand-700">
                          {course.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {course.gradedCount} ta baholangan ish
                        </span>
                      </span>
                    </Link>
                    <Progress value={course.percent} className="mt-2.5 h-1.5 max-w-56" />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <GradeBadge percent={course.percent} size="sm" />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <LetterBadge letter={course.letter} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <GpaPointsBadge points={course.points} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-semibold tabular-nums text-slate-700">
                      {course.credits}
                    </span>
                    <span className="ml-1 text-xs text-slate-400">kredit</span>
                  </td>
                </tr>
              ))}
            </tbody>
            {gpa != null ? (
              <tfoot>
                <tr>
                  <td
                    colSpan={3}
                    className="pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
                  >
                    Umumiy GPA
                  </td>
                  <td className="pt-4 text-center">
                    <GpaPointsBadge points={gpa} size="lg" digits={2} />
                  </td>
                  <td className="pt-4 text-right">
                    <span className="text-sm font-semibold tabular-nums text-slate-700">
                      {totalCredits}
                    </span>
                    <span className="ml-1 text-xs text-slate-400">kredit</span>
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
