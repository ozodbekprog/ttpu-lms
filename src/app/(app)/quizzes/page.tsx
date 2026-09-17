import Link from "next/link";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";

export default async function QuizzesPage() {
  const user = await requireUser();

  if (isStaff(user.role)) {
    const quizzes = await prisma.quiz.findMany({
      where: user.role === "TEACHER" ? { course: { teacherId: user.id } } : {},
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return (
      <>
        <PageHeader
          title="Testlar"
          subtitle={user.role === "TEACHER" ? "O'qitadigan kurslaringiz testlari" : "Barcha testlar"}
          action={<ButtonLink href="/quizzes/new">Yangi test</ButtonLink>}
        />
        {quizzes.length === 0 ? (
          <EmptyState
            title="Testlar yo'q"
            description="Birinchi testni yaratish uchun 'Yangi test' tugmasini bosing."
            action={<ButtonLink href="/quizzes/new">Yangi test</ButtonLink>}
          />
        ) : (
          <Card>
            <CardBody className="space-y-3">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/quizzes/${quiz.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {quiz.title}
                    </Link>
                    <p className="text-xs text-slate-500">{quiz.course.title}</p>
                  </div>
                  <Badge tone={quiz.isPublished ? "green" : "amber"}>
                    {quiz.isPublished ? "E'lon qilingan" : "Qoralama"}
                  </Badge>
                  <span className="text-xs text-slate-500">{quiz._count.questions} savol</span>
                  <span className="text-xs text-slate-500">{quiz._count.attempts} urinish</span>
                  <div className="flex gap-2">
                    <ButtonLink href={`/quizzes/${quiz.id}/results`} variant="secondary" size="sm">
                      Natijalar
                    </ButtonLink>
                    <ButtonLink href={`/quizzes/${quiz.id}/edit`} variant="secondary" size="sm">
                      Tahrirlash
                    </ButtonLink>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </>
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    select: { courseId: true },
  });
  const quizzes = await prisma.quiz.findMany({
    where: {
      isPublished: true,
      courseId: { in: enrollments.map((item) => item.courseId) },
    },
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { title: true } },
      _count: { select: { questions: true } },
      attempts: {
        where: { studentId: user.id },
        orderBy: { startedAt: "desc" },
        select: { id: true, startedAt: true, finishedAt: true, score: true },
      },
    },
  });

  return (
    <>
      <PageHeader title="Testlar" subtitle={`${quizzes.length} ta mavjud test`} />
      {quizzes.length === 0 ? (
        <EmptyState title="Testlar yo'q" description="Kurslaringizda hozircha e'lon qilingan test yo'q." />
      ) : (
        <Card>
          <CardBody className="space-y-3">
            {quizzes.map((quiz) => {
              const active = quiz.attempts.find((attempt) => attempt.finishedAt === null);
              const finished = quiz.attempts.filter((attempt) => attempt.finishedAt !== null);
              const lastScore = finished.find((attempt) => attempt.score != null)?.score ?? null;
              const exhausted = finished.length >= quiz.maxAttempts;
              return (
                <Link
                  key={quiz.id}
                  href={`/quizzes/${quiz.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{quiz.title}</p>
                    <p className="text-xs text-slate-500">{quiz.course.title}</p>
                  </div>
                  {active ? <Badge tone="amber">Davom etmoqda</Badge> : null}
                  {lastScore != null ? <Badge tone="green">Ball: {lastScore}</Badge> : null}
                  {exhausted && !active ? <Badge tone="slate">Yakunlangan</Badge> : null}
                  <span className="text-xs text-slate-500">{quiz._count.questions} savol</span>
                  <span className="text-xs text-slate-500">
                    Urinish: {finished.length}/{quiz.maxAttempts}
                  </span>
                </Link>
              );
            })}
          </CardBody>
        </Card>
      )}
    </>
  );
}
