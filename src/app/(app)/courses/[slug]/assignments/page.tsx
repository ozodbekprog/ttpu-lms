import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { canManageCourse } from "@/components/courses/course-access";
import { AssignmentsActions } from "@/components/courses/assignments-actions";
import { AssignmentsCreate } from "@/components/courses/assignments-create";
import { SubmissionBadge } from "@/components/courses/assignments-status";

const DAY_MS = 24 * 60 * 60 * 1000;

const ACCENTS: Record<string, string> = {
  GRADED: "bg-emerald-500",
  SUBMITTED: "bg-brand-600",
  LATE: "bg-rose-500",
  OVERDUE: "bg-amber-400",
  NONE: "bg-slate-200",
};

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
        <ButtonLink href={`/courses/${course.slug}/attendance`} variant="secondary" size="sm">
          Davomat
        </ButtonLink>
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

    return (
      <>
        {header}
        {assignments.length === 0 ? (
          <EmptyState
            title="Topshiriqlar yo'q"
            description="Hozircha bu kursda topshiriq e'lon qilinmagan."
          />
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const submission = assignment.submissions[0] ?? null;
              const overdue = Boolean(assignment.dueAt && new Date() > assignment.dueAt);
              const soon = Boolean(
                assignment.dueAt && !overdue && assignment.dueAt.getTime() - now.getTime() <= 3 * DAY_MS,
              );
              const accent = submission
                ? ACCENTS[submission.status]
                : overdue
                  ? ACCENTS.OVERDUE
                  : ACCENTS.NONE;
              return (
                <Card
                  key={assignment.id}
                  className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className={cn("absolute inset-y-0 left-0 w-1", accent)} />
                  <CardBody className="flex flex-wrap items-center justify-between gap-4 pl-6">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/courses/${course.slug}/assignments/${assignment.id}`}
                        className="font-semibold text-slate-900 transition-colors duration-150 hover:text-brand-700"
                      >
                        {assignment.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 font-medium",
                            overdue && submission?.status !== "GRADED"
                              ? "text-rose-600"
                              : soon && submission?.status !== "GRADED"
                                ? "text-amber-600"
                                : "text-slate-500",
                          )}
                        >
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
                            <rect x="3" y="5" width="18" height="16" rx="2" />
                            <path d="M16 3v4M8 3v4M3 11h18" />
                          </svg>
                          {fmtDate(assignment.dueAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
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
                          Maksimal ball: {assignment.maxScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {overdue && submission?.status !== "GRADED" ? (
                        <Badge tone="rose">Muddat o&apos;tgan</Badge>
                      ) : soon && submission?.status !== "GRADED" ? (
                        <Badge tone="amber">Muddat yaqin</Badge>
                      ) : null}
                      <SubmissionBadge status={submission?.status} />
                      {submission?.score != null ? (
                        <span className="inline-flex items-center rounded-xl bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-800">
                          {submission.score}
                          <span className="font-normal text-brand-400">/{assignment.maxScore}</span>
                        </span>
                      ) : null}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
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

  return (
    <>
      {header}
      <AssignmentsCreate courseId={course.id} />
      {assignments.length === 0 ? (
        <EmptyState title="Topshiriqlar yo'q" description="Birinchi topshiriqni qo'shing." />
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <Card
              key={assignment.id}
              className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <CardBody className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
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
                      <p className="mt-0.5 text-xs text-slate-500">
                        Muddat: {fmtDate(assignment.dueAt)} · Maksimal ball: {assignment.maxScore}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 pl-12">
                    <Badge tone="slate">{assignment._count.submissions} ta topshirilgan</Badge>
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
          ))}
        </div>
      )}
    </>
  );
}
