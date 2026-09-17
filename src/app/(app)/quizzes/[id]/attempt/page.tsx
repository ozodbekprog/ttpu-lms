import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttemptForm } from "@/components/quiz/attempt-form";
import { toQuestionFull, toQuestionPublic } from "@/components/quiz/shared";

export default async function AttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { attemptId } = await searchParams;

  if (user.role !== "STUDENT") redirect(`/quizzes/${id}/results`);
  if (!attemptId) redirect(`/quizzes/${id}`);

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { quiz: { include: { questions: { orderBy: { position: "asc" } } } } },
  });
  if (!attempt || attempt.quizId !== id || attempt.studentId !== user.id || attempt.finishedAt) {
    redirect(`/quizzes/${id}`);
  }

  const questions = attempt.quiz.questions.map((question) => toQuestionPublic(toQuestionFull(question)));
  const endsAt = attempt.quiz.timeLimitMin
    ? new Date(attempt.startedAt.getTime() + attempt.quiz.timeLimitMin * 60_000).toISOString()
    : null;

  return (
    <AttemptForm
      attemptId={attempt.id}
      quizId={attempt.quiz.id}
      title={attempt.quiz.title}
      questions={questions}
      endsAt={endsAt}
    />
  );
}
