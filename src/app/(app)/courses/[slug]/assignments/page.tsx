import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { canManageCourse } from "@/components/courses/course-access";
import { AssignmentsActions } from "@/components/courses/assignments-actions";
import { AssignmentsCreate } from "@/components/courses/assignments-create";
import { SubmissionBadge } from "@/components/courses/assignments-status";

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
              return (
                <Card key={assignment.id}>
                  <CardBody className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/courses/${course.slug}/assignments/${assignment.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600"
                      >
                        {assignment.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Muddat: {fmtDate(assignment.dueAt)} · Maksimal ball: {assignment.maxScore}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {overdue && submission?.status !== "GRADED" ? (
                        <Badge tone="rose">Muddat o&apos;tgan</Badge>
                      ) : null}
                      <SubmissionBadge status={submission?.status} />
                      {submission?.score != null ? (
                        <span className="text-sm font-semibold text-slate-800">
                          {submission.score}/{assignment.maxScore}
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
            <Card key={assignment.id}>
              <CardBody className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/courses/${course.slug}/assignments/${assignment.id}`}
                    className="font-medium text-slate-900 hover:text-blue-600"
                  >
                    {assignment.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Muddat: {fmtDate(assignment.dueAt)} · Maksimal ball: {assignment.maxScore} ·{" "}
                    {assignment._count.submissions} ta topshirilgan
                  </p>
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
