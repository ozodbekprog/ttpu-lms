import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Progress,
  Select,
  Stat,
  Table,
} from "@/components/ui";
import { cn, fmtDate, fmtDateTime, gradeColor, scorePercent } from "@/lib/utils";
import { SubmissionBadge } from "@/components/courses/assignments-status";

function percentTone(pct: number) {
  if (pct >= 80) return "bg-emerald-50 text-emerald-700";
  if (pct >= 60) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const user = await requireUser();

  if (user.role === "STUDENT") {
    const [submissions, attempts] = await Promise.all([
      prisma.submission.findMany({
        where: { studentId: user.id },
        include: {
          assignment: { include: { course: { select: { title: true, slug: true } } } },
        },
        orderBy: { submittedAt: "desc" },
      }),
      prisma.quizAttempt.findMany({
        where: { studentId: user.id },
        include: { quiz: { include: { course: { select: { title: true } } } } },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    const graded = submissions.filter((submission) => submission.score != null);
    const scoreSum = graded.reduce((sum, submission) => sum + (submission.score ?? 0), 0);
    const maxSum = graded.reduce((sum, submission) => sum + submission.assignment.maxScore, 0);
    const average = maxSum > 0 ? Math.round((scoreSum / maxSum) * 100) : null;

    const groupMap = new Map<
      string,
      {
        title: string;
        slug: string | null;
        submissions: typeof submissions;
        attempts: typeof attempts;
      }
    >();

    for (const submission of submissions) {
      const key = submission.assignment.course.title;
      const existing = groupMap.get(key);
      if (existing) {
        existing.submissions.push(submission);
      } else {
        groupMap.set(key, {
          title: key,
          slug: submission.assignment.course.slug,
          submissions: [submission],
          attempts: [],
        });
      }
    }

    for (const attempt of attempts) {
      const key = attempt.quiz.course.title;
      const existing = groupMap.get(key);
      if (existing) {
        existing.attempts.push(attempt);
      } else {
        groupMap.set(key, { title: key, slug: null, submissions: [], attempts: [attempt] });
      }
    }

    const groups = [...groupMap.values()];

    return (
      <>
        <PageHeader title="Baholarim" subtitle={user.group?.name ?? "Talaba"} />

        <Card className="relative overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
          <CardBody className="grid gap-6 py-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Umumiy o&apos;rtacha</p>
              <p className="mt-1.5 text-5xl font-semibold tracking-tight text-brand-900">
                {average != null ? `${average}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {graded.length > 0 ? "Barcha baholangan topshiriqlar asosida" : "Hali baho yo'q"}
              </p>
            </div>
            <div className="space-y-3">
              <Progress value={average ?? 0} max={100} className="h-2" />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span>
                  <span className="font-semibold text-slate-700">{graded.length}</span> baholangan
                </span>
                <span className="hidden h-4 w-px bg-slate-200 sm:block" />
                <span>
                  <span className="font-semibold text-slate-700">{submissions.length}</span> javob
                </span>
                <span className="hidden h-4 w-px bg-slate-200 sm:block" />
                <span>
                  <span className="font-semibold text-slate-700">{attempts.length}</span> test urinishi
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {groups.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Baholar yo'q"
              description="Kurs topshiriqlarini topshirganingizdan so'ng baholar shu yerda ko'rinadi."
            />
          </div>
        ) : (
          groups.map((group) => (
            <Card key={group.title} className="mt-6">
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                      {group.title.slice(0, 1).toUpperCase()}
                    </span>
                    {group.title}
                  </span>
                }
                subtitle={`${group.submissions.length} ta topshiriq javobi${
                  group.attempts.length > 0 ? ` · ${group.attempts.length} ta test` : ""
                }`}
              />
              <CardBody className="space-y-6">
                {group.submissions.length > 0 ? (
                  <Table>
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                        <th className="py-2.5 pr-3 text-left font-medium">Topshiriq</th>
                        <th className="px-3 py-2.5 text-left font-medium">Muddat</th>
                        <th className="px-3 py-2.5 text-left font-medium">Holat</th>
                        <th className="px-3 py-2.5 text-right font-medium">Natija</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.submissions.map((submission) => {
                        const pct = scorePercent(submission.score, submission.assignment.maxScore);
                        return (
                          <tr
                            key={submission.id}
                            className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/70"
                          >
                            <td className="py-3 pr-3 text-sm font-medium text-slate-800">
                              <Link
                                href={`/courses/${submission.assignment.course.slug}/assignments/${submission.assignmentId}`}
                                className="transition-colors duration-150 hover:text-brand-700"
                              >
                                {submission.assignment.title}
                              </Link>
                            </td>
                            <td className="px-3 py-3 text-xs text-slate-500">
                              {fmtDate(submission.assignment.dueAt)}
                            </td>
                            <td className="px-3 py-3">
                              <SubmissionBadge status={submission.status} />
                            </td>
                            <td className="px-3 py-3 text-right">
                              {submission.score != null && pct != null ? (
                                <span className="inline-flex items-center gap-2.5">
                                  <span className="text-sm font-medium text-slate-500">
                                    {submission.score}/{submission.assignment.maxScore}
                                  </span>
                                  <span
                                    className={cn(
                                      "inline-flex min-w-12 justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                                      percentTone(pct),
                                    )}
                                  >
                                    {pct}%
                                  </span>
                                </span>
                              ) : (
                                <span className="text-sm text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : null}

                {group.attempts.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Test urinishlari
                    </p>
                    <Table>
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                          <th className="py-2.5 pr-3 text-left font-medium">Test</th>
                          <th className="px-3 py-2.5 text-left font-medium">Sana</th>
                          <th className="px-3 py-2.5 text-left font-medium">Holat</th>
                          <th className="px-3 py-2.5 text-right font-medium">Ball</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.attempts.map((attempt) => (
                          <tr
                            key={attempt.id}
                            className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/70"
                          >
                            <td className="py-3 pr-3 text-sm font-medium text-slate-800">
                              {attempt.quiz.title}
                            </td>
                            <td className="px-3 py-3 text-xs text-slate-500">
                              {fmtDateTime(attempt.finishedAt ?? attempt.startedAt)}
                            </td>
                            <td className="px-3 py-3">
                              <Badge tone={attempt.finishedAt ? "green" : "slate"}>
                                {attempt.finishedAt ? "Tugallangan" : "Tugallanmagan"}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-right text-sm font-semibold text-brand-800">
                              {attempt.score != null ? attempt.score : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))
        )}
      </>
    );
  }

  const courses = await prisma.course.findMany({
    where: user.role === "ADMIN" ? {} : { teacherId: user.id },
    orderBy: { title: "asc" },
  });

  const { courseId } = await searchParams;
  const selected = courses.find((course) => course.id === courseId) ?? courses[0] ?? null;

  if (!selected) {
    return (
      <>
        <PageHeader title="Baholash jurnali" subtitle="O'qituvchi paneli" />
        <EmptyState title="Kurslar yo'q" description="Avval kurs yarating." />
      </>
    );
  }

  const [assignments, enrollments, submissions] = await Promise.all([
    prisma.assignment.findMany({
      where: { courseId: selected.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.enrollment.findMany({
      where: { courseId: selected.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.submission.findMany({
      where: { assignment: { courseId: selected.id } },
    }),
  ]);

  const byStudentAssignment = new Map(
    submissions.map((submission) => [
      `${submission.studentId}:${submission.assignmentId}`,
      submission,
    ]),
  );

  function studentAverage(studentId: string) {
    let score = 0;
    let max = 0;
    for (const assignment of assignments) {
      const submission = byStudentAssignment.get(`${studentId}:${assignment.id}`);
      if (submission?.score != null) {
        score += submission.score;
        max += assignment.maxScore;
      }
    }
    return max > 0 ? Math.round((score / max) * 100) : null;
  }

  function assignmentAverage(assignmentId: string, maxScore: number) {
    const scores = submissions
      .filter((submission) => submission.assignmentId === assignmentId && submission.score != null)
      .map((submission) => submission.score ?? 0);
    if (scores.length === 0) return null;
    const sum = scores.reduce((total, score) => total + score, 0);
    return Math.round((sum / (scores.length * maxScore)) * 100);
  }

  const gradedSubmissions = submissions.filter((submission) => submission.score != null);
  const totalScore = gradedSubmissions.reduce(
    (sum, submission) => sum + (submission.score ?? 0),
    0,
  );
  const totalMax = gradedSubmissions.reduce((sum, submission) => {
    const assignment = assignments.find((item) => item.id === submission.assignmentId);
    return sum + (assignment?.maxScore ?? 0);
  }, 0);

  return (
    <>
      <PageHeader
        title="Baholash jurnali"
        subtitle={selected.title}
        action={
          <form method="get" className="flex items-end gap-2">
            <Select name="courseId" defaultValue={selected.id} className="w-56 sm:w-64">
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Ko&apos;rsatish
            </Button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Talabalar" value={enrollments.length} />
        <Stat label="Topshiriqlar" value={assignments.length} />
        <Stat label="Topshirilgan" value={submissions.length} />
        <Stat label="Baholangan" value={gradedSubmissions.length} />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Jurnal"
          subtitle={`${enrollments.length} ta talaba × ${assignments.length} ta topshiriq`}
        />
        <CardBody>
          {enrollments.length === 0 || assignments.length === 0 ? (
            <EmptyState
              title="Jurnal bo'sh"
              description="Kursda talaba yoki topshiriq mavjud emas."
            />
          ) : (
            <Table>
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500">
                  <th className="sticky left-0 z-10 rounded-l-xl bg-slate-50 py-3 pr-4 text-left font-medium">
                    Talaba
                  </th>
                  {assignments.map((assignment) => (
                    <th key={assignment.id} className="min-w-28 px-3 py-3 text-center font-medium">
                      <span className="mx-auto block max-w-32 truncate">{assignment.title}</span>
                      <span className="block font-normal text-slate-400">max {assignment.maxScore}</span>
                    </th>
                  ))}
                  <th className="rounded-r-xl bg-brand-50 px-3 py-3 text-center font-semibold text-brand-800">
                    O&apos;rtacha
                  </th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => {
                  const average = studentAverage(enrollment.user.id);
                  return (
                    <tr
                      key={enrollment.id}
                      className="group border-b border-slate-100 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="sticky left-0 z-10 bg-white py-3 pr-4 text-sm font-medium text-slate-800 transition-colors duration-150 group-hover:bg-slate-50">
                        {enrollment.user.name}
                      </td>
                      {assignments.map((assignment) => {
                        const submission = byStudentAssignment.get(
                          `${enrollment.user.id}:${assignment.id}`,
                        );
                        return (
                          <td key={assignment.id} className="px-3 py-3 text-center text-sm">
                            {submission ? (
                              submission.score != null ? (
                                <span
                                  className={cn(
                                    "font-semibold",
                                    gradeColor(submission.score, assignment.maxScore),
                                  )}
                                >
                                  {submission.score}
                                </span>
                              ) : (
                                <SubmissionBadge status={submission.status} />
                              )
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="bg-brand-50/40 px-3 py-3 text-center text-sm font-semibold transition-colors duration-150 group-hover:bg-brand-50/70">
                        {average != null ? (
                          <span className={gradeColor(average)}>{average}%</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 text-xs text-slate-500">
                  <td className="sticky left-0 z-10 rounded-bl-xl bg-slate-50 py-2.5 pr-4 font-medium">
                    O&apos;rtacha
                  </td>
                  {assignments.map((assignment) => {
                    const average = assignmentAverage(assignment.id, assignment.maxScore);
                    return (
                      <td
                        key={assignment.id}
                        className="px-3 py-2.5 text-center font-semibold text-slate-600"
                      >
                        {average != null ? `${average}%` : "—"}
                      </td>
                    );
                  })}
                  <td className="rounded-br-xl bg-brand-50 px-3 py-2.5 text-center font-semibold text-brand-800">
                    {totalMax > 0 ? `${Math.round((totalScore / totalMax) * 100)}%` : "—"}
                  </td>
                </tr>
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
