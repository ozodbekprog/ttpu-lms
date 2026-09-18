import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Progress,
} from "@/components/ui";
import { cn, fmtDate, fmtDateTime, gradeColor, scorePercent } from "@/lib/utils";
import { canManageCourse } from "@/components/courses/course-access";
import { AssignmentsGrade } from "@/components/courses/assignments-grade";
import { AssignmentsSubmit } from "@/components/courses/assignments-submit";
import { DueChip, SubmissionBadge } from "@/components/courses/assignments-status";

function DownloadIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

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

  const now = new Date();

  const back = (
    <ButtonLink href={`/courses/${course.slug}/assignments`} variant="secondary" size="sm">
      Ro&apos;yxatga qaytish
    </ButtonLink>
  );

  const infoCard = (
    <Card className="animate-fade-up">
      <CardHeader
        title="Topshiriq haqida"
        subtitle={course.title}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            <svg
              width="12"
              height="12"
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
            Yaratilgan: {fmtDate(assignment.createdAt)}
          </span>
        }
      />
      <CardBody className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <DueChip dueAt={assignment.dueAt} now={now} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
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
        {assignment.dueAt ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Muddat</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {fmtDateTime(assignment.dueAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Holat
              </p>
              <p
                className={cn(
                  "mt-1 text-sm font-medium",
                  now > assignment.dueAt ? "text-rose-600" : "text-emerald-600",
                )}
              >
                {now > assignment.dueAt ? "Muddat o'tgan" : "Qabul qilinmoqda"}
              </p>
            </div>
          </div>
        ) : null}
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Topshiriq sharti
          </p>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
            {assignment.description ?? "Tavsif kiritilmagan."}
          </p>
        </div>
      </CardBody>
    </Card>
  );

  if (management) {
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id },
      include: { student: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { submittedAt: "asc" },
    });

    return (
      <>
        <PageHeader title={assignment.title} subtitle={course.title} action={back} />
        <div className="space-y-6">
          {infoCard}
          <AssignmentsGrade
            maxScore={assignment.maxScore}
            submissions={submissions.map((submission) => ({
              id: submission.id,
              studentName: submission.student.name,
              studentAvatar: submission.student.avatarUrl,
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
  const percent = submission ? scorePercent(submission.score, assignment.maxScore) : null;

  return (
    <>
      <PageHeader title={assignment.title} subtitle={course.title} action={back} />
      {overdue && !graded ? (
        <div className="animate-fade-up mb-5 flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3.5">
          <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 8v5" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-rose-700">Muddat o&apos;tgan (LATE)</p>
            <p className="mt-0.5 text-sm text-rose-600/90">
              Topshirilgan ish kechikkan (LATE) holatida qayd etiladi.
            </p>
          </div>
        </div>
      ) : null}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {infoCard}
        <Card className="animate-fade-up">
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
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-white p-5 ring-1 ring-brand-100">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "text-5xl font-semibold tracking-tight",
                          gradeColor(submission.score, assignment.maxScore),
                        )}
                      >
                        {submission.score}
                      </span>
                      <span className="text-sm text-slate-400">/ {assignment.maxScore} ball</span>
                    </div>
                    {percent != null ? (
                      <Badge tone={percent >= 80 ? "green" : percent >= 60 ? "amber" : "rose"}>
                        {percent}%
                      </Badge>
                    ) : null}
                  </div>
                  <Progress
                    value={submission.score ?? 0}
                    max={assignment.maxScore}
                    className="mt-4"
                  />
                </div>
                {submission.feedback ? (
                  <div className="rounded-2xl border border-gold-300/40 bg-gold-300/10 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-gold-600 uppercase">
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
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      O&apos;qituvchi izohi
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {submission.feedback}
                    </p>
                  </div>
                ) : null}
                {submission.text ? (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Yuborilgan javob
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
                      {submission.text}
                    </p>
                  </div>
                ) : null}
                {submission.fileUrl ? (
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition-colors hover:border-brand-200 hover:bg-brand-50/60"
                  >
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-slate-200">
                      <DownloadIcon />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                      {submission.fileUrl.split("?")[0]?.split("/").pop() || "Yuklangan fayl"}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">Ochish</span>
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
