import { notFound } from "next/navigation";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, fmtDateTime } from "@/lib/utils";
import { Badge, ButtonLink, Card, CardBody, CardHeader, EmptyState, PageHeader, Stat } from "@/components/ui";
import { StartAttemptButton } from "@/components/quiz/start-button";
import { QUESTION_TYPE_LABEL, toQuestionFull, totalPoints } from "@/components/quiz/shared";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true, teacherId: true } },
      questions: { orderBy: { position: "asc" } },
    },
  });
  if (!quiz) notFound();

  const staff = isStaff(user.role);
  const questions = quiz.questions.map(toQuestionFull);

  if (staff) {
    if (user.role === "TEACHER" && quiz.course.teacherId !== user.id) notFound();
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: id },
      orderBy: { startedAt: "desc" },
      include: { student: { select: { name: true } } },
      take: 5,
    });
    return (
      <>
        <PageHeader
          title={quiz.title}
          subtitle={quiz.course.title}
          action={
            <div className="flex gap-2">
              <ButtonLink href={`/quizzes/${quiz.id}/results`} variant="secondary">
                Natijalar
              </ButtonLink>
              <ButtonLink href={`/quizzes/${quiz.id}/edit`}>Tahrirlash</ButtonLink>
            </div>
          }
        />
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Savollar" value={questions.length} />
          <Stat label="Jami ball" value={totalPoints(questions)} />
          <Stat
            label="Vaqt chegarasi"
            value={quiz.timeLimitMin ? `${quiz.timeLimitMin} daqiqa` : "Yo'q"}
          />
          <Stat label="Urinishlar" value={attempts.length} hint={`Maks: ${quiz.maxAttempts}`} />
        </div>
        <div className="mb-6 flex items-center gap-2">
          <Badge tone={quiz.isPublished ? "green" : "amber"}>
            {quiz.isPublished ? "E'lon qilingan" : "Qoralama"}
          </Badge>
          {quiz.description ? <p className="text-sm text-slate-500">{quiz.description}</p> : null}
        </div>

        <h2 className="mb-3 text-lg font-semibold text-slate-900">Savollar</h2>
        <div className="space-y-3">
          {questions.length === 0 ? <EmptyState title="Savollar yo'q" /> : null}
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader
                title={`${question.position}. ${question.text}`}
                subtitle={`${QUESTION_TYPE_LABEL[question.type]} · ${question.points} ball`}
              />
              <CardBody>
                {question.type === "TEXT" ? (
                  <p className="text-sm text-slate-500">
                    Matnli javob — o&apos;qituvchi qo&apos;lda baholaydi.
                  </p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {question.options.map((option, index) => (
                      <li
                        key={index}
                        className={cn(
                          "rounded-lg px-3 py-1.5",
                          question.correct.includes(index)
                            ? "bg-emerald-50 font-medium text-emerald-700"
                            : "text-slate-600",
                        )}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          ))}
        </div>

        {attempts.length > 0 ? (
          <Card className="mt-6">
            <CardHeader title="So'nggi urinishlar" />
            <CardBody className="space-y-2">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-700">{attempt.student.name}</span>
                  <span className="text-xs text-slate-500">{fmtDateTime(attempt.startedAt)}</span>
                  {attempt.finishedAt ? (
                    <Badge tone={attempt.score != null ? "green" : "amber"}>
                      {attempt.score != null ? `Ball: ${attempt.score}` : "Baholanmagan"}
                    </Badge>
                  ) : (
                    <Badge tone="blue">Davom etmoqda</Badge>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        ) : null}
      </>
    );
  }

  if (!quiz.isPublished) notFound();
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId: quiz.courseId, userId: user.id } },
    select: { id: true },
  });
  if (!enrollment) notFound();

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: id, studentId: user.id },
    orderBy: { startedAt: "desc" },
  });
  const active = attempts.find((attempt) => attempt.finishedAt === null);
  const finished = attempts.filter((attempt) => attempt.finishedAt !== null);
  const canStart = !active && finished.length < quiz.maxAttempts;

  return (
    <>
      <PageHeader title={quiz.title} subtitle={quiz.course.title} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Savollar" value={questions.length} />
        <Stat label="Jami ball" value={totalPoints(questions)} />
        <Stat
          label="Vaqt chegarasi"
          value={quiz.timeLimitMin ? `${quiz.timeLimitMin} daqiqa` : "Yo'q"}
        />
        <Stat label="Urinishlar" value={`${finished.length}/${quiz.maxAttempts}`} />
      </div>

      <Card className="mb-6">
        <CardHeader title="Test haqida" />
        <CardBody className="space-y-3">
          {quiz.description ? (
            <p className="text-sm text-slate-600">{quiz.description}</p>
          ) : (
            <p className="text-sm text-slate-500">Tavsif kiritilmagan.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {active ? (
              <ButtonLink href={`/quizzes/${quiz.id}/attempt?attemptId=${active.id}`}>
                Davom etish
              </ButtonLink>
            ) : canStart ? (
              <StartAttemptButton quizId={quiz.id} />
            ) : (
              <Badge tone="slate">Urinishlar tugagan</Badge>
            )}
            <ButtonLink href={`/quizzes/${quiz.id}/results`} variant="secondary">
              Natijalarim
            </ButtonLink>
          </div>
        </CardBody>
      </Card>

      {finished.length > 0 ? (
        <Card>
          <CardHeader title="Urinishlarim" />
          <CardBody className="space-y-2">
            {finished.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600">{fmtDateTime(attempt.startedAt)}</span>
                <span className="text-xs text-slate-500">
                  Tugagan: {fmtDateTime(attempt.finishedAt)}
                </span>
                <Badge tone={attempt.score != null ? "green" : "amber"}>
                  {attempt.score != null ? `Ball: ${attempt.score}` : "Baholanmagan"}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : (
        <EmptyState title="Urinishlar yo'q" description="Testni boshlash uchun yuqoridagi tugmani bosing." />
      )}
    </>
  );
}
