import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, Card, CardBody, CardHeader, PageHeader } from "@/components/ui";
import { cn, fmtDate, fmtDateTime, gradeColor } from "@/lib/utils";
import { canManageCourse } from "@/components/courses/course-access";
import { AssignmentsGrade } from "@/components/courses/assignments-grade";
import { AssignmentsSubmit } from "@/components/courses/assignments-submit";
import { SubmissionBadge } from "@/components/courses/assignments-status";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const user = await requireUser();
  const { slug, id } = await params;

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

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.courseId !== course.id) notFound();

  const back = (
    <ButtonLink href={`/courses/${course.slug}/assignments`} variant="secondary" size="sm">
      Ro&apos;yxatga qaytish
    </ButtonLink>
  );

  const infoCard = (
    <Card>
      <CardHeader
        title="Topshiriq haqida"
        subtitle={
          assignment.dueAt ? `Muddat: ${fmtDateTime(assignment.dueAt)}` : "Muddat belgilanmagan"
        }
      />
      <CardBody className="space-y-3 text-sm text-slate-600">
        <p className="whitespace-pre-wrap">{assignment.description ?? "Tavsif kiritilmagan."}</p>
        <p className="text-xs text-slate-400">
          Maksimal ball: {assignment.maxScore} · Yaratilgan: {fmtDate(assignment.createdAt)}
        </p>
      </CardBody>
    </Card>
  );

  if (management) {
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { submittedAt: "asc" },
    });

    return (
      <>
        <PageHeader title={assignment.title} subtitle={course.title} action={back} />
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.5fr]">
          {infoCard}
          <AssignmentsGrade
            maxScore={assignment.maxScore}
            submissions={submissions.map((submission) => ({
              id: submission.id,
              studentName: submission.student.name,
              submittedAt: submission.submittedAt.toISOString(),
              status: submission.status,
              score: submission.score,
              feedback: submission.feedback,
              text: submission.text,
              fileUrl: submission.fileUrl,
            }))}
          />
        </div>
      </>
    );
  }

  const submission = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId: id, studentId: user.id } },
  });
  const overdue = Boolean(assignment.dueAt && new Date() > assignment.dueAt);
  const graded = submission?.status === "GRADED";

  return (
    <>
      <PageHeader title={assignment.title} subtitle={course.title} action={back} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {infoCard}
        <Card>
          <CardHeader
            title="Mening javobim"
            subtitle={
              submission
                ? `Topshirilgan: ${fmtDateTime(submission.submittedAt)}`
                : "Hali topshirilmagan"
            }
            action={<SubmissionBadge status={submission?.status} />}
          />
          <CardBody className="space-y-4">
            {graded && submission ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-3xl font-semibold",
                      gradeColor(submission.score, assignment.maxScore),
                    )}
                  >
                    {submission.score}
                  </span>
                  <span className="text-sm text-slate-400">/ {assignment.maxScore} ball</span>
                </div>
                {submission.feedback ? (
                  <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    {submission.feedback}
                  </p>
                ) : null}
                {submission.text ? (
                  <p className="whitespace-pre-wrap text-sm text-slate-600">{submission.text}</p>
                ) : null}
                {submission.fileUrl ? (
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all text-sm text-blue-600 hover:underline"
                  >
                    {submission.fileUrl}
                  </a>
                ) : null}
                <p className="text-xs text-slate-400">
                  Baholangan: {fmtDateTime(submission.gradedAt)}
                </p>
              </>
            ) : (
              <AssignmentsSubmit assignmentId={id} overdue={overdue} existing={submission} />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
