import { notFound } from "next/navigation";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDateTime, gradeColor } from "@/lib/utils";
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, Table } from "@/components/ui";
import { GradeForm } from "@/components/quiz/grade-form";
import {
  asAnswers,
  autoScore,
  formatAnswer,
  isAnswerCorrect,
  QUESTION_TYPE_LABEL,
  toQuestionFull,
  totalPoints,
} from "@/components/quiz/shared";

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

  return (
    <>
      <PageHeader
        title="Natijalar"
        subtitle={`${quiz.title} · ${quiz.course.title}`}
      />

      {attempts.length === 0 ? (
        <EmptyState
          title="Natijalar yo'q"
          description={staff ? "Hozircha hech kim bu testni topshirmagan." : "Siz hali bu testni topshirmadingiz."}
        />
      ) : (
        <Card>
          <CardHeader
            title={staff ? "Barcha urinishlar" : "Urinishlarim"}
            subtitle={`Jami ball: ${maxScore}`}
          />
          <CardBody>
            <Table>
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {staff ? <th className="pb-2 pr-3 font-medium">Talaba</th> : null}
                  <th className="pb-2 pr-3 font-medium">Boshlangan</th>
                  <th className="pb-2 pr-3 font-medium">Tugagan</th>
                  <th className="pb-2 pr-3 font-medium">Holat</th>
                  <th className="pb-2 font-medium">Ball</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b border-slate-50 last:border-0">
                    {staff ? (
                      <td className="py-2 pr-3">
                        <span className="font-medium text-slate-800">{attempt.student.name}</span>
                        <span className="block text-xs text-slate-400">{attempt.student.email}</span>
                      </td>
                    ) : null}
                    <td className="py-2 pr-3 text-slate-600">{fmtDateTime(attempt.startedAt)}</td>
                    <td className="py-2 pr-3 text-slate-600">
                      {attempt.finishedAt ? fmtDateTime(attempt.finishedAt) : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {attempt.finishedAt ? (
                        <Badge tone="green">Topshirilgan</Badge>
                      ) : (
                        <Badge tone="amber">Davom etmoqda</Badge>
                      )}
                    </td>
                    <td className="py-2">
                      {attempt.finishedAt ? (
                        <span className={`font-semibold ${gradeColor(attempt.score, maxScore)}`}>
                          {attempt.score != null ? `${attempt.score}/${maxScore}` : "Baholanmagan"}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {staff
        ? attempts
            .filter((attempt) => attempt.finishedAt !== null)
            .map((attempt) => {
              const answers = asAnswers(attempt.answers);
              const auto = autoScore(questions, answers);
              return (
                <Card key={attempt.id} className="mt-6">
                  <CardHeader
                    title={attempt.student.name}
                    subtitle={`Avtomatik ball: ${auto}/${maxScore} · ${fmtDateTime(attempt.startedAt)}`}
                    action={
                      <GradeForm attemptId={attempt.id} maxScore={maxScore} initialScore={attempt.score} />
                    }
                  />
                  <CardBody className="space-y-4">
                    {questions.map((question) => (
                      <div key={question.id} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">
                            {question.position}. {question.text}
                          </span>
                          <Badge tone="slate">{QUESTION_TYPE_LABEL[question.type]}</Badge>
                          {question.type !== "TEXT" ? (
                            <Badge
                              tone={isAnswerCorrect(question, answers[question.id]) ? "green" : "rose"}
                            >
                              {isAnswerCorrect(question, answers[question.id]) ? "To'g'ri" : "Noto'g'ri"}
                            </Badge>
                          ) : (
                            <Badge tone="amber">Qo&apos;lda baholanadi</Badge>
                          )}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                          Javob: {formatAnswer(question, answers[question.id])}
                        </p>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              );
            })
        : null}
    </>
  );
}
