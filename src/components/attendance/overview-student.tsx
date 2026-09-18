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

const STATUS_TILE: Record<JournalStatus, string> = {
  PRESENT: "border-emerald-100 bg-emerald-50/70 text-emerald-600",
  ABSENT: "border-rose-100 bg-rose-50/70 text-rose-600",
  LATE: "border-amber-100 bg-amber-50/70 text-amber-600",
  EXCUSED: "border-slate-200 bg-slate-50 text-slate-500",
};

function StatusGlyph({ status, size = 14 }: { status: JournalStatus; size?: number }) {
  if (status === "PRESENT") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 13 4 4L19 7" />
      </svg>
    );
  }
  if (status === "ABSENT") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    );
  }
  if (status === "LATE") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M10 13h6M10 17h4" />
    </svg>
  );
}

function countForStatus(status: JournalStatus, summary: StudentAttendanceSummary) {
  if (status === "PRESENT") return summary.overall.present;
  if (status === "ABSENT") return summary.overall.absent;
  if (status === "LATE") return summary.overall.late;
  return summary.overall.excused;
}

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
      <Card className="animate-fade-up relative overflow-hidden border-brand-100/80">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
        <span className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-gold-300/15 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-28 -left-16 size-64 rounded-full bg-brand-300/20 blur-3xl" />
        <CardBody className="relative grid gap-8 py-8 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex justify-center">
            <AttendanceRing percent={overall.percent} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-lg ring-1",
                  overall.eligible
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25 ring-emerald-300/50"
                    : "bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/25 ring-rose-300/50",
                )}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {overall.eligible ? (
                    <>
                      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
                      <path d="m9 12 2 2 4-4" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </>
                  )}
                </svg>
                {overall.eligible ? "Imtihonga ruxsat" : "Ruxsat yo'q"}
              </span>
              <span className="text-sm text-slate-500">
                {overall.eligible
                  ? "80% mezondan muvaffaqiyatli o'tdingiz"
                  : "Imtihonga ruxsat uchun kamida 80% davomat kerak"}
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              <span className="text-3xl font-semibold tabular-nums text-brand-950">{attended}</span>
              <span className="text-slate-400"> / {overall.total} darsda qatnashdingiz</span>
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {JOURNAL_STATUS_ORDER.map((status) => {
                const meta = JOURNAL_STATUS_META[status];
                const count = countForStatus(status, summary);
                return (
                  <div
                    key={status}
                    className="group rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lift"
                  >
                    <span
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-xl border",
                        STATUS_TILE[status],
                      )}
                    >
                      <StatusGlyph status={status} />
                    </span>
                    <p className="mt-2.5 text-xl font-semibold tabular-nums text-brand-950">
                      {count}
                    </p>
                    <p className="text-xs text-slate-400">{meta.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Progress value={overall.percent} max={100} className="h-2 flex-1" />
              <span className="text-xs font-semibold tabular-nums text-slate-500">
                {overall.percent}%
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="animate-fade-up mt-6">
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
          <CardBody className="space-y-3">
            {courses.map((course) => {
              const courseAttended = course.present + course.late + course.excused;
              return (
                <div
                  key={course.courseId}
                  className="group rounded-2xl border border-slate-100 bg-white px-4 py-4 transition-all duration-200 hover:border-brand-200/80 hover:bg-brand-50/30 hover:shadow-lift"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-200 group-hover:bg-brand-100">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
                          <path d="M4 5.5v16M9 7h7M9 11h7" />
                        </svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800 transition-colors duration-150 group-hover:text-brand-800">
                          {course.courseTitle}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          Keldi: <span className="font-semibold text-slate-600">{courseAttended}</span>{" "}
                          / {course.total} dars
                        </span>
                      </span>
                    </Link>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-xl font-semibold tabular-nums",
                          course.eligible ? "text-emerald-600" : "text-rose-500",
                        )}
                      >
                        {course.percent}%
                      </span>
                      <Badge tone={course.eligible ? "green" : "rose"} className="px-2.5 py-1">
                        {course.eligible ? "Ruxsat" : "Ruxsat yo'q"}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={course.percent} max={100} className="mt-3 h-2" />
                  <div className="mt-2 flex justify-end">
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

      <Card className="animate-fade-up mt-6">
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
          <CardBody>
            <ol className="relative space-y-1 before:absolute before:bottom-4 before:left-6 before:top-4 before:w-px before:bg-gradient-to-b before:from-brand-200 before:via-slate-200 before:to-transparent">
              {history.map((row) => {
                const meta = JOURNAL_STATUS_META[row.status];
                return (
                  <li
                    key={row.id}
                    className="relative flex items-center gap-3 rounded-xl px-1.5 py-2.5 transition-colors duration-150 hover:bg-slate-50/80"
                  >
                    <span
                      className={cn(
                        "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                        meta.badge,
                      )}
                    >
                      <StatusGlyph status={row.status} size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/courses/${row.courseSlug}/attendance/journal`}
                        className="block truncate text-sm font-medium text-slate-800 transition-colors duration-150 hover:text-brand-700"
                      >
                        {row.courseTitle}
                      </Link>
                      <p className="text-xs text-slate-400">{fmtDate(row.date)}</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        meta.chip,
                      )}
                    >
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardBody>
        )}
      </Card>
    </>
  );
}
