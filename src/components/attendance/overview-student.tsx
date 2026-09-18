import Link from "next/link";
import {
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Progress,
} from "@/components/ui";
import { AttendanceRing } from "@/components/attendance/overview-ring";
import {
  JOURNAL_STATUS_META,
  JOURNAL_STATUS_ORDER,
} from "@/components/attendance/journal-utils";
import type { JournalStatus } from "@/components/attendance/journal-utils";
import type { StudentAttendanceSummary } from "@/app/api/attendance/summary/data";
import { cn, fmtDate } from "@/lib/utils";

export type AttendanceHistoryRow = {
  id: string;
  date: Date;
  status: JournalStatus;
  courseTitle: string;
  courseSlug: string;
};

export function StudentAttendanceOverview({
  summary,
  history,
}: {
  summary: StudentAttendanceSummary;
  history: AttendanceHistoryRow[];
}) {
  const { overall, courses } = summary;
  const attended = overall.present + overall.late + overall.excused;

  return (
    <>
      <Card className="relative overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
        <CardBody className="grid gap-8 py-7 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex justify-center">
            <AttendanceRing percent={overall.percent} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                tone={overall.eligible ? "green" : "rose"}
                className="px-3 py-1 text-sm"
              >
                {overall.eligible ? "Imtihonga ruxsat" : "Ruxsat yo'q"}
              </Badge>
              <span className="text-sm text-slate-500">
                {overall.eligible
                  ? "80% mezondan muvaffaqiyatli o'tdingiz"
                  : "Imtihonga ruxsat uchun kamida 80% davomat kerak"}
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              <span className="text-2xl font-semibold tabular-nums text-brand-950">{attended}</span>
              <span className="text-slate-400"> / {overall.total} darsda qatnashdingiz</span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {JOURNAL_STATUS_ORDER.map((status) => {
                const meta = JOURNAL_STATUS_META[status];
                const count =
                  status === "PRESENT"
                    ? overall.present
                    : status === "ABSENT"
                      ? overall.absent
                      : status === "LATE"
                        ? overall.late
                        : overall.excused;
                return (
                  <div key={status} className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex size-5 items-center justify-center rounded-full text-[9px] font-semibold leading-none",
                        meta.badge,
                      )}
                    >
                      {meta.short}
                    </span>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-slate-800">{count}</p>
                    <p className="text-xs text-slate-400">{meta.label}</p>
                  </div>
                );
              })}
            </div>

            <Progress value={overall.percent} max={100} className="mt-5 h-2" />
          </div>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Kurslar bo'yicha"
          subtitle={`${courses.length} ta kurs · har birida kamida 80% kerak`}
        />
        {courses.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Kurslar yo'q"
              description="Siz hali biror kursga yozilmagansiz."
              action={
                <ButtonLink href="/courses" variant="secondary" size="sm">
                  Kurslarni ko&apos;rish
                </ButtonLink>
              }
            />
          </CardBody>
        ) : (
          <CardBody className="space-y-6">
            {courses.map((course) => {
              const courseAttended = course.present + course.late + course.excused;
              return (
                <div key={course.courseId}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="text-sm font-medium text-slate-800 transition-colors duration-150 hover:text-brand-700"
                    >
                      {course.courseTitle}
                    </Link>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          course.eligible ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {course.percent}%
                      </span>
                      <Badge tone={course.eligible ? "green" : "rose"}>
                        {course.eligible ? "Ruxsat" : "Ruxsat yo'q"}
                      </Badge>
                    </span>
                  </div>
                  <Progress value={course.percent} max={100} className="mt-2 h-2" />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      Keldi: <span className="font-semibold text-slate-700">{courseAttended}</span> /{" "}
                      {course.total}
                    </span>
                    <ButtonLink
                      href={`/courses/${course.slug}/attendance/journal`}
                      variant="ghost"
                      size="sm"
                    >
                      Jurnal
                    </ButtonLink>
                  </div>
                </div>
              );
            })}
          </CardBody>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Oxirgi yozuvlar"
          subtitle="So'nggi 10 ta davomat yozuvi"
          action={
            <ButtonLink href="/attendance/check-in" variant="secondary" size="sm">
              QR check-in
            </ButtonLink>
          }
        />
        {history.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Yozuvlar yo'q"
              description="Davomat belgilanmagan. Darsda QR kod orqali belgilashingiz mumkin."
            />
          </CardBody>
        ) : (
          <CardBody className="space-y-2">
            {history.map((row) => {
              const meta = JOURNAL_STATUS_META[row.status];
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors duration-150 hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{row.courseTitle}</p>
                    <p className="text-xs text-slate-400">{fmtDate(row.date)}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      meta.chip,
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full text-[8px] font-semibold leading-none",
                        meta.badge,
                      )}
                    >
                      {meta.short}
                    </span>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </CardBody>
        )}
      </Card>
    </>
  );
}
