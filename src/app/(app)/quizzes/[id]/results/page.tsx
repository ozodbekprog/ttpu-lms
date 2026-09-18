import { notFound } from "next/navigation";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, fmtDateTime, gradeColor, scorePercent } from "@/lib/utils";
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, Progress, Stat, Table } from "@/components/ui";
import { GradeForm } from "@/components/quiz/grade-form";
import { ScoreRing } from "@/components/quiz/score-ring";
import {
  asAnswers,
  autoScore,
  formatAnswer,
  isAnswerCorrect,
  QUESTION_TYPE_LABEL,
  QUESTION_TYPE_TONE,
  toQuestionFull,
  totalPoints,
} from "@/components/quiz/shared";

function percentTone(pct: number | null): "green" | "amber" | "rose" | "slate" {
  if (pct == null) return "slate";
  if (pct >= 80) return "green";
  if (pct >= 60) return "amber";
  return "rose";
}

function letterOf(index: number): string {
  return String.fromCharCode(65 + index);
}

export default async function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: { select: { title: true, teacherId: true } },
      questions: { orderBy: { position: "asc" } },
      attempts: {
        orderBy: { startedAt: "desc" },
        include: { student: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!quiz) notFound();

  const staff = isStaff(user.role);
  if (staff) {
    if (user.role === "TEACHER" && quiz.course.teacherId !== user.id) notFound();
  } else {
    if (!quiz.isPublished) notFound();
    const enrollment = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: quiz.courseId, userId: user.id } },
      select: { id: true },
    });
    if (!enrollment) notFound();
  }

  const questions = quiz.questions.map(toQuestionFull);
  const maxScore = totalPoints(questions);
  const attempts = staff ? quiz.attempts : quiz.attempts.filter((attempt) => attempt.studentId === user.id);

  const finished = attempts.filter((attempt) => attempt.finishedAt !== null);
  const scored = finished.filter((attempt) => attempt.score != null);
  const average =
    scored.length > 0
      ? Math.round(scored.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / scored.length)
      : null;
  const best =
    scored.length > 0 ? Math.max(...scored.map((attempt) => attempt.score ?? 0)) : null;
  const latest = scored[0]?.score ?? null;
  const heroScore = staff ? average : best;
  const secondScore = staff ? best : latest;
  const heroPercent = heroScore != null && maxScore > 0 ? scorePercent(heroScore, maxScore) : null;

  return (
    <>
      <PageHeader title="Natijalar" subtitle={`${quiz.title} · ${quiz.course.title}`} />

      {attempts.length === 0 ? (
        <EmptyState
          title="Natijalar yo'q"
          description={staff ? "Hozircha hech kim bu testni topshirmagan." : "Siz hali bu testni topshirmadingiz."}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <Card className="relative overflow-hidden p-5">
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
              <div className="flex items-center gap-5">
                <ScoreRing score={heroScore} max={maxScore} size={148} strokeWidth={12} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {staff ? "O'rtacha natija" : "Eng yaxshi natija"}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-4xl font-semibold tracking-tight tabular-nums",
                      gradeColor(heroScore, maxScore),
                    )}
                  >
                    {heroScore ?? "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{maxScore} balldan</p>
                  <div className="mt-3">
                    {heroPercent != null ? (
                      <Badge tone={percentTone(heroPercent)}>{heroPercent}% o&apos;zlashtirish</Badge>
                    ) : (
                      <Badge tone="slate">Ball yo&apos;q</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            <Stat
              label="Topshirilgan urinishlar"
              value={finished.length}
              hint={`Jami ${attempts.length} ta urinish`}
            />
            <Stat
              label={staff ? "Eng yuqori ball" : "Oxirgi natija"}
              value={
                <span className={gradeColor(secondScore, maxScore)}>{secondScore ?? "—"}</span>
              }
              hint={
                staff
                  ? `Guruhdagi eng yaxshi · ${maxScore} balldan`
                  : `Eng yaxshi: ${best ?? "—"} · ${maxScore} balldan`
              }
            />
          </div>

          <Card>
            <CardHeader
              title={staff ? "Barcha urinishlar" : "Urinishlar tarixi"}
              subtitle={`Jami ball: ${maxScore} · ${attempts.length} ta urinish`}
            />
            <CardBody>
              <Table>
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    {staff ? <th className="pb-2.5 pr-3 font-medium">Talaba</th> : null}
                    <th className="pb-2.5 pr-3 font-medium">Boshlangan</th>
                    <th className="pb-2.5 pr-3 font-medium">Tugagan</th>
                    <th className="pb-2.5 pr-3 font-medium">Holat</th>
                    <th className="pb-2.5 font-medium">Ball</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => {
                    const percent = attempt.score != null ? scorePercent(attempt.score, maxScore) : null;
                    const isBest = attempt.finishedAt !== null && attempt.score != null && attempt.score === best;
                    return (
                      <tr
                        key={attempt.id}
                        className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
                      >
                        {staff ? (
                          <td className="py-3 pr-3">
                            <span className="font-medium text-slate-800">{attempt.student.name}</span>
                            <span className="block text-xs text-slate-400">{attempt.student.email}</span>
                          </td>
                        ) : null}
                        <td className="py-3 pr-3 text-slate-600">{fmtDateTime(attempt.startedAt)}</td>
                        <td className="py-3 pr-3 text-slate-600">
                          {attempt.finishedAt ? fmtDateTime(attempt.finishedAt) : "—"}
                        </td>
                        <td className="py-3 pr-3">
                          {attempt.finishedAt ? (
                            <Badge tone={percentTone(percent)}>
                              {percent != null ? `${percent}%` : "Baholanmagan"}
                            </Badge>
                          ) : (
                            <Badge tone="amber">Davom etmoqda</Badge>
                          )}
                        </td>
                        <td className="py-3">
                          {attempt.finishedAt ? (
                            <div className="flex items-center gap-3">
                              <span className="flex items-baseline gap-1.5">
                                <span
                                  className={cn(
                                    "text-xl font-semibold tabular-nums",
                                    gradeColor(attempt.score, maxScore),
                                  )}
                                >
                                  {attempt.score ?? "—"}
                                </span>
                                <span className="text-xs text-slate-400">/ {maxScore}</span>
                              </span>
                              {attempt.score != null ? (
                                <Progress value={attempt.score} max={maxScore} className="hidden w-24 sm:block" />
                              ) : null}
                              {isBest && !staff ? (
                                <Badge tone="gold" className="hidden sm:inline-flex">Eng yaxshi</Badge>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}

      {staff
        ? attempts
            .filter((attempt) => attempt.finishedAt !== null)
            .map((attempt) => {
              const answers = asAnswers(attempt.answers);
              const auto = autoScore(questions, answers);
              const percent = attempt.score != null ? scorePercent(attempt.score, maxScore) : null;
              return (
                <Card key={attempt.id} className="mt-6">
                  <CardHeader
                    title={attempt.student.name}
                    subtitle={`${fmtDateTime(attempt.startedAt)} · Avtomatik: ${auto}/${maxScore}`}
                    action={
                      <GradeForm attemptId={attempt.id} maxScore={maxScore} initialScore={attempt.score} />
                    }
                  />
                  <CardBody className="space-y-4">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-slate-50 px-4 py-3">
                      <span
                        className={cn(
                          "text-4xl font-semibold tracking-tight tabular-nums",
                          gradeColor(attempt.score, maxScore),
                        )}
                      >
                        {attempt.score ?? "—"}
                      </span>
                      <span className="text-sm text-slate-400">/ {maxScore} ball</span>
                      {percent != null ? (
                        <Badge tone={percentTone(percent)}>{percent}%</Badge>
                      ) : (
                        <Badge tone="amber">Baholanmagan</Badge>
                      )}
                    </div>

                    {questions.map((question) => {
                      const answer = answers[question.id];
                      const correct = isAnswerCorrect(question, answer);
                      const selectedIndexes = new Set(
                        typeof answer === "number" ? [answer] : Array.isArray(answer) ? answer : [],
                      );
                      return (
                        <div
                          key={question.id}
                          className={cn(
                            "rounded-2xl border p-3.5",
                            question.type === "TEXT"
                              ? "border-amber-200 bg-amber-50/40"
                              : correct
                                ? "border-emerald-200 bg-emerald-50/40"
                                : "border-rose-200 bg-rose-50/40",
                          )}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex size-6 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                              {question.position}
                            </span>
                            <span className="text-sm font-medium text-slate-800">{question.text}</span>
                            <Badge tone={QUESTION_TYPE_TONE[question.type]}>
                              {QUESTION_TYPE_LABEL[question.type]}
                            </Badge>
                            {question.type !== "TEXT" ? (
                              <Badge tone={correct ? "green" : "rose"}>
                                {correct ? "To'g'ri" : "Noto'g'ri"}
                              </Badge>
                            ) : (
                              <Badge tone="amber">Qo&apos;lda baholanadi</Badge>
                            )}
                            <span className="ml-auto text-xs text-slate-400">{question.points} ball</span>
                          </div>

                          {question.type === "TEXT" ? (
                            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/80 px-3.5 py-2.5 text-sm text-slate-600 ring-1 ring-amber-100">
                              {formatAnswer(question, answer)}
                            </p>
                          ) : (
                            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                              {question.options.map((option, index) => {
                                const isCorrect = question.correct.includes(index);
                                const isSelected = selectedIndexes.has(index);
                                return (
                                  <li
                                    key={index}
                                    className={cn(
                                      "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm",
                                      isCorrect
                                        ? "border-emerald-300 bg-emerald-50/80 font-medium text-emerald-900 ring-1 ring-emerald-300"
                                        : isSelected
                                          ? "border-rose-300 bg-rose-50/70 text-rose-800"
                                          : "border-slate-200 bg-white text-slate-500",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                                        isCorrect
                                          ? "bg-emerald-500 text-white"
                                          : isSelected
                                            ? "bg-rose-500 text-white"
                                            : "bg-slate-100 text-slate-500",
                                      )}
                                    >
                                      {isCorrect ? (
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                      ) : isSelected ? (
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M18 6 6 18M6 6l12 12" />
                                        </svg>
                                      ) : (
                                        letterOf(index)
                                      )}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate">{option}</span>
                                    {isCorrect ? (
                                      <span className="shrink-0 text-[11px] font-semibold text-emerald-700">
                                        {isSelected ? "Tanlandi" : "To'g'ri javob"}
                                      </span>
                                    ) : isSelected ? (
                                      <span className="shrink-0 text-[11px] font-semibold text-rose-600">
                                        Xato tanlov
                                      </span>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </CardBody>
                </Card>
              );
            })
        : null}
    </>
  );
}
