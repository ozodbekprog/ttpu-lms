import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { canManageCourse } from "@/components/courses/course-access";
import { AssignmentsActions } from "@/components/courses/assignments-actions";
import { AssignmentsCreate } from "@/components/courses/assignments-create";
import { DueChip, SubmissionBadge } from "@/components/courses/assignments-status";

const ACCENTS: Record<string, string> = {
  GRADED: "bg-emerald-500",
  SUBMITTED: "bg-brand-600",
  LATE: "bg-rose-500",
  OVERDUE: "bg-amber-400",
  NONE: "bg-slate-200",
};

function ClockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-600"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function SummaryChip({
  label,
  value,
  tone,
  delay,
}: {
  label: string;
  value: number;
  tone: "brand" | "green" | "amber";
  delay: number;
}) {
  const tones = {
    brand: "text-brand-700 bg-brand-50 ring-brand-100",
    green: "text-emerald-700 bg-emerald-50 ring-emerald-100",
    amber: "text-amber-700 bg-amber-50 ring-amber-100",
  };
  return (
    <div
      className="animate-fade-up flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-xl text-sm font-semibold ring-1",
          tones[tone],
        )}
      >
        {value}
      </span>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}

export default async function CourseAssignmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) notFound();

  const management = canManageCourse(user, course);
  if (user.role === "STUDENT") {
    const enrolled = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: course.id, userId: user.id } },
    });
    if (!enrolled) notFound();
  } else if (!management) {
    notFound();
  }

  const header = (
    <PageHeader
      title="Topshiriqlar"
      subtitle={course.title}
      action={
        <Link
          href={`/courses/${course.slug}/attendance`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
          Davomat
        </Link>
      }
    />
  );

  if (!management) {
    const assignments = await prisma.assignment.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: "asc" },
      include: { submissions: { where: { studentId: user.id } } },
    });

    const now = new Date();
    const gradedCount = assignments.filter(
      (assignment) => assignment.submissions[0]?.status === "GRADED",
    ).length;
    const submittedCount = assignments.filter(
      (assignment) => assignment.submissions[0] != null,
    ).length;

    return (
      <>
        {header}
        {assignments.length === 0 ? (
          <EmptyState
            title="Topshiriqlar yo'q"
            description="Hozircha bu kursda topshiriq e'lon qilinmagan. Yangi topshiriq chiqsa shu sahifada ko'rinadi."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryChip label="Jami topshiriq" value={assignments.length} tone="brand" delay={0} />
              <SummaryChip label="Topshirilgan" value={submittedCount} tone="amber" delay={60} />
              <SummaryChip label="Baholangan" value={gradedCount} tone="green" delay={120} />
            </div>
            <div className="space-y-3">
              {assignments.map((assignment, index) => {
                const submission = assignment.submissions[0] ?? null;
                const overdue = Boolean(assignment.dueAt && new Date() > assignment.dueAt);
                const accent = submission
                  ? ACCENTS[submission.status]
                  : overdue
                    ? ACCENTS.OVERDUE
                    : ACCENTS.NONE;
                return (
                  <div
                    key={assignment.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(index, 8) * 50 + 120}ms` }}
                  >
                    <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                      <span className={cn("absolute inset-y-0 left-0 w-1", accent)} />
                    <CardBody className="flex flex-wrap items-center justify-between gap-4 pl-6">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/courses/${course.slug}/assignments/${assignment.id}`}
                          className="font-semibold text-slate-900 transition-colors duration-150 hover:text-brand-700"
                        >
                          {assignment.title}
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <DueChip
                            dueAt={assignment.dueAt}
                            completed={submission?.status === "GRADED"}
                            now={now}
                          />
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                            <ClockIcon />
                            Maksimal ball: {assignment.maxScore}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <SubmissionBadge status={submission?.status} />
                        {submission?.score != null ? (
                          <span className="inline-flex items-center rounded-xl bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-800">
                            {submission.score}
                            <span className="font-normal text-brand-400">/{assignment.maxScore}</span>
                          </span>
                        ) : null}
                        <ChevronIcon />
                      </div>
                    </CardBody>
                  </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { submissions: true } } },
  });

  const now = new Date();
  const totalSubmissions = assignments.reduce(
    (sum, assignment) => sum + assignment._count.submissions,
    0,
  );

  return (
    <>
      {header}
      <AssignmentsCreate courseId={course.id} />
      {assignments.length === 0 ? (
        <EmptyState
          title="Topshiriqlar yo'q"
          description="Birinchi topshiriqni qo'shing — talabalar uni darhol ko'radi."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryChip label="Jami topshiriq" value={assignments.length} tone="brand" delay={0} />
            <SummaryChip label="Topshirilgan ishlar" value={totalSubmissions} tone="green" delay={60} />
            <SummaryChip
              label="Muddati o'tgan"
              value={assignments.filter((assignment) => assignment.dueAt && assignment.dueAt < now).length}
              tone="amber"
              delay={120}
            />
          </div>
          <div className="space-y-3">
            {assignments.map((assignment, index) => (
              <div
                key={assignment.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index, 8) * 50 + 120}ms` }}
              >
              <Card className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                <CardBody className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z" />
                          <path d="M16 5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
                          <path d="m9 13 2 2 4-4" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/courses/${course.slug}/assignments/${assignment.id}`}
                          className="font-semibold text-slate-900 transition-colors duration-150 hover:text-brand-700"
                        >
                          {assignment.title}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <DueChip dueAt={assignment.dueAt} now={now} />
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                            <ClockIcon />
                            Maksimal ball: {assignment.maxScore}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 pl-12">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        </svg>
                        {assignment._count.submissions} ta topshirilgan
                      </span>
                      <span className="text-xs text-slate-400">
                        Yaratilgan: {fmtDate(assignment.createdAt)}
                      </span>
                    </div>
                  </div>
                  <AssignmentsActions
                    assignment={{
                      id: assignment.id,
                      title: assignment.title,
                      description: assignment.description,
                      dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : null,
                      maxScore: assignment.maxScore,
                    }}
                  />
                </CardBody>
              </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
