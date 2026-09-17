import Link from "next/link";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function QuizMeta({
  questions,
  minutes,
  attempts,
}: {
  questions: number;
  minutes: number | null;
  attempts: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <ListIcon />
        {questions} savol
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ClockIcon />
        {minutes ? `${minutes} daqiqa` : "Vaqtsiz"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <RepeatIcon />
        {attempts}
      </span>
    </div>
  );
}

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="relative flex h-full flex-col p-5 transition-shadow duration-200 hover:shadow-lift"
              >
                <Link
                  href={`/quizzes/${quiz.id}`}
                  aria-label={quiz.title}
                  className="absolute inset-0 rounded-2xl"
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight text-slate-900">{quiz.title}</p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">{quiz.course.title}</p>
                  </div>
                  <Badge tone={quiz.isPublished ? "green" : "slate"}>
                    {quiz.isPublished ? "E'lon qilingan" : "Qoralama"}
                  </Badge>
                </div>
                <div className="mt-4">
                  <QuizMeta
                    questions={quiz._count.questions}
                    minutes={quiz.timeLimitMin}
                    attempts={`${quiz._count.attempts} urinish`}
                  />
                </div>
                <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4">
                  <ButtonLink
                    href={`/quizzes/${quiz.id}/results`}
                    variant="secondary"
                    size="sm"
                    className="relative z-10"
                  >
                    Natijalar
                  </ButtonLink>
                  <ButtonLink
                    href={`/quizzes/${quiz.id}/edit`}
                    variant="secondary"
                    size="sm"
                    className="relative z-10"
                  >
                    Tahrirlash
                  </ButtonLink>
                  <span className="ml-auto text-xs text-slate-400">Maks: {quiz.maxAttempts} urinish</span>
                </div>
              </Card>
            ))}
          </div>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => {
            const active = quiz.attempts.find((attempt) => attempt.finishedAt === null);
            const finished = quiz.attempts.filter((attempt) => attempt.finishedAt !== null);
            const lastScore = finished.find((attempt) => attempt.score != null)?.score ?? null;
            const exhausted = finished.length >= quiz.maxAttempts;
            const status = active
              ? { tone: "amber", label: "Davom etmoqda" }
              : exhausted
                ? { tone: "amber", label: "Urinishlar tugagan" }
                : lastScore != null
                  ? { tone: "green", label: `Ball: ${lastScore}` }
                  : { tone: "brand", label: "Yangi" };
            return (
              <Link key={quiz.id} href={`/quizzes/${quiz.id}`} className="block h-full">
                <Card className="flex h-full flex-col p-5 transition-all duration-200 hover:border-brand-200 hover:shadow-lift">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold tracking-tight text-slate-900">{quiz.title}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{quiz.course.title}</p>
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <div className="mt-4">
                    <QuizMeta
                      questions={quiz._count.questions}
                      minutes={quiz.timeLimitMin}
                      attempts={`Urinish: ${finished.length}/${quiz.maxAttempts}`}
                    />
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-500">
                      {active
                        ? "Yarim qolgan urinishni davom ettiring"
                        : exhausted
                          ? "Natijalarni ko'rish"
                          : "Testni boshlash"}
                    </span>
                    <span className="text-xs font-medium text-brand-700">Ochish &rarr;</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
