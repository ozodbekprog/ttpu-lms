import Link from "next/link";
import type { ReactNode } from "react";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { ScoreRing } from "@/components/quiz/score-ring";

function ListIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
      {children}
    </span>
  );
}

function QuestionIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1 1-1.1 1.8v.5" />
      <path d="M12 17h.01" />
    </svg>
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
        questions: { select: { points: true } },
        _count: { select: { attempts: true } },
        attempts: {
          where: { finishedAt: { not: null }, score: { not: null } },
          select: { score: true },
        },
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
            {quizzes.map((quiz) => {
              const total = quiz.questions.reduce((sum, question) => sum + question.points, 0);
              const scores = quiz.attempts
                .map((attempt) => attempt.score)
                .filter((score): score is number => score != null);
              const average =
                scores.length > 0
                  ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
                  : null;
              const best = scores.length > 0 ? Math.max(...scores) : null;
              return (
                <Card
                  key={quiz.id}
                  className="group relative flex h-full flex-col overflow-hidden p-5 transition-all duration-200 hover:border-brand-200 hover:shadow-lift"
                >
                  <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <Link
                    href={`/quizzes/${quiz.id}`}
                    aria-label={quiz.title}
                    className="absolute inset-0 rounded-2xl"
                  />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold tracking-tight text-slate-900">{quiz.title}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{quiz.course.title}</p>
                      <div className="mt-3">
                        <Badge tone={quiz.isPublished ? "green" : "slate"}>
                          {quiz.isPublished ? "E'lon qilingan" : "Qoralama"}
                        </Badge>
                      </div>
                    </div>
                    <ScoreRing
                      score={average}
                      max={total}
                      size={88}
                      caption="O'rtacha"
                      hint={attemptsHint(quiz._count.attempts, best, total)}
                      className="shrink-0"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <MetaChip>
                      <QuestionIcon />
                      {quiz.questions.length} savol
                    </MetaChip>
                    <MetaChip>
                      <ClockIcon />
                      {quiz.timeLimitMin ? `${quiz.timeLimitMin} daqiqa` : "Vaqtsiz"}
                    </MetaChip>
                    <MetaChip>
                      <RepeatIcon />
                      {quiz._count.attempts} urinish
                    </MetaChip>
                  </div>
                  <div className="relative z-10 mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                    <ButtonLink
                      href={`/quizzes/${quiz.id}/results`}
                      variant="secondary"
                      size="sm"
                    >
                      Natijalar
                    </ButtonLink>
                    <ButtonLink
                      href={`/quizzes/${quiz.id}/edit`}
                      variant="secondary"
                      size="sm"
                    >
                      Tahrirlash
                    </ButtonLink>
                    <span className="ml-auto text-xs text-slate-600">
                      Maks: {quiz.maxAttempts} urinish
                    </span>
                  </div>
                </Card>
              );
            })}
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
      questions: { select: { points: true } },
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
            const total = quiz.questions.reduce((sum, question) => sum + question.points, 0);
            const active = quiz.attempts.find((attempt) => attempt.finishedAt === null);
            const finished = quiz.attempts.filter((attempt) => attempt.finishedAt !== null);
            const scores = finished
              .map((attempt) => attempt.score)
              .filter((score): score is number => score != null);
            const best = scores.length > 0 ? Math.max(...scores) : null;
            const lastScore = finished.find((attempt) => attempt.score != null)?.score ?? null;
            const exhausted = finished.length >= quiz.maxAttempts;
            const status = active
              ? { tone: "amber" as const, label: "Davom etmoqda" }
              : exhausted
                ? { tone: "amber" as const, label: "Urinishlar tugagan" }
                : lastScore != null
                  ? { tone: "green" as const, label: `Ball: ${lastScore}` }
                  : { tone: "brand" as const, label: "Yangi" };
            return (
              <Link key={quiz.id} href={`/quizzes/${quiz.id}`} className="block h-full">
                <Card className="group relative flex h-full flex-col overflow-hidden p-5 transition-all duration-200 hover:border-brand-200 hover:shadow-lift">
                  <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold tracking-tight text-slate-900">{quiz.title}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{quiz.course.title}</p>
                      <div className="mt-3">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                    </div>
                    <ScoreRing
                      score={best}
                      max={total}
                      size={88}
                      caption="Eng yaxshi"
                      hint={finished.length > 0 ? `${finished.length}/${quiz.maxAttempts} urinish` : "Hali topshirilmagan"}
                      className="shrink-0"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <MetaChip>
                      <QuestionIcon />
                      {quiz.questions.length} savol
                    </MetaChip>
                    <MetaChip>
                      <ClockIcon />
                      {quiz.timeLimitMin ? `${quiz.timeLimitMin} daqiqa` : "Vaqtsiz"}
                    </MetaChip>
                    <MetaChip>
                      <ListIcon />
                      {quiz.questions.length > 0 ? `${total} ball` : "Ball yo'q"}
                    </MetaChip>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-500">
                      {active
                        ? "Yarim qolgan urinishni davom ettiring"
                        : exhausted
                          ? "Natijalarni ko'rish"
                          : "Testni boshlash"}
                    </span>
                    <span className="text-xs font-medium text-brand-700 transition-transform duration-200 group-hover:translate-x-0.5">
                      Ochish &rarr;
                    </span>
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

function attemptsHint(count: number, best: number | null, total: number): string {
  if (count === 0) return "Urinish yo'q";
  if (best == null) return `${count} urinish`;
  return `Eng yaxshi: ${best}/${total}`;
}
