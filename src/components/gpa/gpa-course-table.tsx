import Link from "next/link";
import { Card, CardHeader, Progress, Table } from "@/components/ui";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/grades/grade-badge";
import { GPA_CREDITS } from "@/app/api/gpa/data";
import type { StudentGpa } from "@/app/api/gpa/data";
import { GpaPointsBadge, LetterBadge, LETTER_META } from "./gpa-badge";

export function GpaCourseTable({ data, delay = 0 }: { data: StudentGpa; delay?: number }) {
  const { courses, gpa, totalCredits } = data;

  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <Card className="h-full overflow-hidden">
        <CardHeader
          title="Kurslar bo'yicha"
          subtitle={`${courses.length} ta kurs · har biri ${GPA_CREDITS} kredit`}
        />
        <div className="hidden px-6 pb-5 pt-2 md:block">
          <Table>
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-[0.12em] text-slate-600">
                <th className="py-3 pr-4 text-left font-medium">Kurs</th>
                <th className="px-3 py-3 text-center font-medium">O&apos;rtacha</th>
                <th className="px-3 py-3 text-center font-medium">Baho</th>
                <th className="px-3 py-3 text-center font-medium">GPA ball</th>
                <th className="px-3 py-3 text-right font-medium">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr
                  key={course.courseId}
                  className="group border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="py-3.5 pr-4">
                    <Link href={`/courses/${course.slug}`} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-transform duration-150 group-hover:scale-105",
                          LETTER_META[course.letter].soft,
                        )}
                      >
                        {course.title.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800 transition-colors duration-150 group-hover:text-brand-700">
                          {course.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-600">
                          {course.gradedCount} ta baholangan ish
                        </span>
                      </span>
                    </Link>
                    <Progress value={course.percent} className="mt-2.5 h-1.5 max-w-64" />
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <GradeBadge percent={course.percent} size="sm" />
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <LetterBadge letter={course.letter} />
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <GpaPointsBadge points={course.points} />
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span className="text-sm font-semibold tabular-nums text-slate-700">
                      {course.credits}
                    </span>
                    <span className="ml-1 text-xs text-slate-600">kredit</span>
                  </td>
                </tr>
              ))}
            </tbody>
            {gpa != null ? (
              <tfoot>
                <tr>
                  <td colSpan={5} className="pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-gold-300/10 px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                        Umumiy GPA
                      </span>
                      <span className="flex items-center gap-3">
                        <GpaPointsBadge points={gpa} size="lg" digits={2} />
                        <span className="text-sm font-semibold tabular-nums text-slate-700">
                          {totalCredits}
                          <span className="ml-1 text-xs font-normal text-slate-600">kredit</span>
                        </span>
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </Table>
        </div>
        <ul className="divide-y divide-slate-100 md:hidden">
          {courses.map((course) => (
            <li key={course.courseId} className="px-5 py-4">
              <Link href={`/courses/${course.slug}`} className="flex items-start gap-3">
                <span
                  className={cn(
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold",
                    LETTER_META[course.letter].soft,
                  )}
                >
                  {course.title.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {course.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    {course.gradedCount} ta baholangan ish
                  </span>
                </span>
                <LetterBadge letter={course.letter} />
              </Link>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={course.percent} className="h-1.5 flex-1" />
                <GradeBadge percent={course.percent} size="sm" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <span>GPA ball</span>
                <span className="flex items-center gap-2">
                  <GpaPointsBadge points={course.points} size="sm" />
                  <span className="text-sm font-semibold tabular-nums text-slate-700">
                    {course.credits}
                  </span>
                  <span>kredit</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
        {gpa != null ? (
          <div className="border-t border-brand-100/70 bg-gradient-to-r from-brand-50 via-white to-gold-300/10 px-5 py-4 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                Umumiy GPA
              </span>
              <span className="flex items-center gap-2">
                <GpaPointsBadge points={gpa} digits={2} />
                <span className="text-xs font-medium text-slate-500">{totalCredits} kredit</span>
              </span>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
