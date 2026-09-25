import { notFound } from "next/navigation";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, fmtDateTime } from "@/lib/utils";
import { Badge, ButtonLink, Card, CardBody, CardHeader, EmptyState, PageHeader, Progress, Stat } from "@/components/ui";
import { StartAttemptButton } from "@/components/quiz/start-button";
import { ScoreRing } from "@/components/quiz/score-ring";
import {
  QUESTION_TYPE_ACCENT,
  QUESTION_TYPE_LABEL,
  QUESTION_TYPE_SOFT,
  QUESTION_TYPE_TONE,
  toQuestionFull,
  totalPoints,
} from "@/components/quiz/shared";

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
            <Card key={question.id} className="relative overflow-hidden">
              <span className={cn("absolute inset-y-0 left-0 w-1", QUESTION_TYPE_ACCENT[question.type])} />
              <CardHeader
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-lg text-xs font-bold",
                        QUESTION_TYPE_SOFT[question.type],
                      )}
                    >
                      {question.position}
                    </span>
                    <span>{question.text}</span>
                    <Badge tone={QUESTION_TYPE_TONE[question.type]}>
                      {QUESTION_TYPE_LABEL[question.type]}
                    </Badge>
                    <Badge tone="gold">{question.points} ball</Badge>
                  </span>
                }
              />
              <CardBody className="pl-7">
                {question.type === "TEXT" ? (
                  <p className="text-sm text-slate-500">
                    Matnli javob — o&apos;qituvchi qo&apos;lda baholaydi.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, index) => {
                      const isCorrect = question.correct.includes(index);
                      return (
                        <li
                          key={index}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm",
                            isCorrect
                              ? "border-emerald-300 bg-emerald-50/80 font-medium text-emerald-900 ring-2 ring-emerald-400/30"
                              : "border-slate-200 bg-white text-slate-600",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                              isCorrect ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {isCorrect ? (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            ) : (
                              String.fromCharCode(65 + index)
                            )}
                          </span>
                          <span className="truncate">{option}</span>
                        </li>
                      );
                    })}
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
  const scoredCount = finished.filter((attempt) => attempt.score != null).length;
  const bestScore =
    scoredCount > 0
      ? Math.max(...finished.map((attempt) => attempt.score ?? 0))
      : null;
  const maxPoints = totalPoints(questions);

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
        <CardBody className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm font-semibold text-slate-800">Test haqida</p>
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
          </div>
          <ScoreRing
            score={bestScore}
            max={maxPoints}
            size={116}
            strokeWidth={9}
            caption="Eng yaxshi natijangiz"
            hint={`${finished.length}/${quiz.maxAttempts} urinish`}
            className="shrink-0"
          />
        </CardBody>
      </Card>

      {finished.length > 0 ? (
        <Card>
          <CardHeader title="Urinishlarim" />
          <CardBody className="space-y-2">
            {finished.map((attempt, index) => {
              const isBest = attempt.score != null && attempt.score === bestScore;
              return (
                <div
                  key={attempt.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5 text-sm transition-colors duration-150 hover:border-slate-200 hover:bg-slate-50/60"
                >
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                    {finished.length - index}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-700">{fmtDateTime(attempt.startedAt)}</p>
                    <p className="text-xs text-slate-600">Tugagan: {fmtDateTime(attempt.finishedAt)}</p>
                  </div>
                  {attempt.score != null ? (
                    <Progress value={attempt.score} max={maxPoints} className="hidden w-24 sm:block" />
                  ) : null}
                  <Badge tone={attempt.score != null ? "green" : "amber"}>
                    {attempt.score != null ? `Ball: ${attempt.score}` : "Baholanmagan"}
                  </Badge>
                  {isBest ? <Badge tone="gold">Eng yaxshi</Badge> : null}
                </div>
              );
            })}
          </CardBody>
        </Card>
      ) : (
        <EmptyState title="Urinishlar yo'q" description="Testni boshlash uchun yuqoridagi tugmani bosing." />
      )}
    </>
  );
}
