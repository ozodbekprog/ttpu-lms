import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
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
import { getStudentAttendance } from "@/app/api/attendance/summary/data";
import { GradeBadge } from "@/components/grades/grade-badge";
import { GradeRing } from "@/components/grades/grade-ring";
import { RatingPanel } from "@/components/grades/rating-panel";
import { rankRatings } from "@/components/grades/rating";
import type { RatingEntry } from "@/components/grades/rating";

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const user = await requireUser();

  if (user.role === "STUDENT") {
    const memberQuery: Promise<{ id: string; name: string; avatarUrl: string | null }[]> =
      user.groupId
        ? prisma.user.findMany({
            where: { groupId: user.groupId, isActive: true },
            select: { id: true, name: true, avatarUrl: true },
          })
        : Promise.resolve([]);

    const [submissions, attempts, attendance, enrollments, groupMembers] = await Promise.all([
      prisma.submission.findMany({
        where: { studentId: user.id },
        include: {
          assignment: { include: { course: { select: { title: true, slug: true } } } },
        },
        orderBy: { submittedAt: "desc" },
      }),
      prisma.quizAttempt.findMany({
        where: { studentId: user.id },
        include: {
          quiz: {
            include: {
              course: { select: { title: true } },
              questions: { select: { points: true } },
            },
          },
        },
        orderBy: { startedAt: "desc" },
      }),
      getStudentAttendance(user.id),
      prisma.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } }),
      memberQuery,
    ]);

    const graded = submissions.filter((submission) => submission.score != null);
    let scoreSum = graded.reduce((sum, submission) => sum + (submission.score ?? 0), 0);
    let maxSum = graded.reduce((sum, submission) => sum + submission.assignment.maxScore, 0);
    for (const attempt of attempts) {
      if (attempt.score == null) continue;
      const quizMax = attempt.quiz.questions.reduce((sum, question) => sum + question.points, 0);
      if (quizMax <= 0) continue;
      scoreSum += attempt.score;
      maxSum += quizMax;
    }
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

    const commonCourseIds = [...new Set(enrollments.map((enrollment) => enrollment.courseId))];
    const memberIds = groupMembers.map((member) => member.id);
    let ratingRows: ReturnType<typeof rankRatings> = [];

    if (memberIds.length > 0 && commonCourseIds.length > 0) {
      const [ratingSubmissions, ratingAttempts] = await Promise.all([
        prisma.submission.findMany({
          where: {
            studentId: { in: memberIds },
            score: { not: null },
            assignment: { courseId: { in: commonCourseIds } },
          },
          select: {
            studentId: true,
            score: true,
            assignment: { select: { maxScore: true } },
          },
        }),
        prisma.quizAttempt.findMany({
          where: {
            studentId: { in: memberIds },
            finishedAt: { not: null },
            score: { not: null },
            quiz: { courseId: { in: commonCourseIds } },
          },
          select: {
            studentId: true,
            score: true,
            quiz: { select: { questions: { select: { points: true } } } },
          },
        }),
      ]);

      const ratingTotals = new Map<string, { score: number; max: number }>();
      const addTotal = (studentId: string, score: number, max: number) => {
        if (max <= 0) return;
        const current = ratingTotals.get(studentId) ?? { score: 0, max: 0 };
        current.score += score;
        current.max += max;
        ratingTotals.set(studentId, current);
      };

      for (const submission of ratingSubmissions) {
        addTotal(submission.studentId, submission.score ?? 0, submission.assignment.maxScore);
      }
      for (const attempt of ratingAttempts) {
        const quizMax = attempt.quiz.questions.reduce((sum, question) => sum + question.points, 0);
        addTotal(attempt.studentId, attempt.score ?? 0, quizMax);
      }

      const entries: RatingEntry[] = [];
      for (const member of groupMembers) {
        const total = ratingTotals.get(member.id);
        if (!total || total.max <= 0) continue;
        entries.push({
          studentId: member.id,
          name: member.name,
          avatarUrl: member.avatarUrl,
          percent: Math.round((total.score / total.max) * 100),
          isMe: member.id === user.id,
        });
      }
      ratingRows = rankRatings(entries);
    }

    const me = ratingRows.find((row) => row.isMe) ?? null;

    function groupAverage(group: (typeof groups)[number]) {
      let score = 0;
      let max = 0;
      for (const submission of group.submissions) {
        if (submission.score == null) continue;
        score += submission.score;
        max += submission.assignment.maxScore;
      }
      for (const attempt of group.attempts) {
        if (attempt.score == null) continue;
        const quizMax = attempt.quiz.questions.reduce((sum, question) => sum + question.points, 0);
        if (quizMax <= 0) continue;
        score += attempt.score;
        max += quizMax;
      }
      return max > 0 ? Math.round((score / max) * 100) : null;
    }

    return (
      <>
        <PageHeader title="Baholarim" subtitle={user.group?.name ?? "Talaba"} />

        {attendance.courses.length > 0 ? (
          <Card className="mb-6">
            <CardHeader
              title="Davomat"
              subtitle="Imtihonga ruxsat uchun har kursda kamida 80% davomat kerak"
            />
            <CardBody className="grid gap-5 sm:grid-cols-2">
              {attendance.courses.map((course) => (
                <div key={course.courseId} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="text-sm font-medium text-slate-800 transition-colors duration-150 hover:text-brand-700"
                    >
                      {course.courseTitle}
                    </Link>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          course.eligible ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {course.percent}%
                      </span>
                      <Badge tone={course.eligible ? "green" : "rose"}>
                        {course.eligible ? "Imtihonga ruxsat" : "Ruxsat yo'q"}
                      </Badge>
                    </span>
                  </div>
                  <Progress value={course.percent} max={100} className="h-2" />
                  {course.eligible ? null : (
                    <p className="text-xs text-slate-600">Kamida 80% kerak</p>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        ) : null}

        <Card className="relative overflow-hidden border-brand-100">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
          <span className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-brand-100/50 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-28 -left-16 size-64 rounded-full bg-gold-300/20 blur-3xl" />
          <CardBody className="relative grid gap-7 py-7 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex justify-center sm:block">
              <GradeRing percent={average} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-600">Umumiy o&apos;rtacha</p>
                {me ? <Badge tone="gold">Reytingda #{me.rank}</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {maxSum > 0 ? "Baholangan topshiriq va testlar asosida" : "Hali baho yo'q"}
              </p>
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>O&apos;zlashtirish</span>
                  <span className="tabular-nums text-slate-700">{average ?? 0}%</span>
                </div>
                <Progress value={average ?? 0} max={100} className="h-2" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Baholangan", value: graded.length },
                  { label: "Javoblar", value: submissions.length },
                  { label: "Testlar", value: attempts.length },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-white/70 px-3.5 py-3 ring-1 ring-slate-100"
                  >
                    <p className="text-xl font-semibold tracking-tight tabular-nums text-brand-900">
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="mt-6">
          <RatingPanel rows={ratingRows} groupName={user.group?.name ?? null} />
        </div>

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
                  <span className="flex items-center gap-2.5">
                    <span className="inline-flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-900 to-brand-600 text-xs font-bold text-white shadow-sm">
                      {group.title.slice(0, 1).toUpperCase()}
                    </span>
                    {group.title}
                  </span>
                }
                subtitle={`${group.submissions.length} ta topshiriq javobi${
                  group.attempts.length > 0 ? ` · ${group.attempts.length} ta test` : ""
                }`}
                action={
                  groupAverage(group) != null ? (
                    <span className="flex items-center gap-2">
                      <span className="hidden text-[11px] font-medium uppercase tracking-wide text-slate-600 sm:block">
                        Kurs o&apos;rtachasi
                      </span>
                      <GradeBadge percent={groupAverage(group)} size="md" />
                    </span>
                  ) : null
                }
              />
              <CardBody className="space-y-6">
                {group.submissions.length > 0 ? (
                  <Table>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-600">
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
                              <span className="inline-flex items-center gap-2.5">
                                {submission.score != null ? (
                                  <span className="text-xs font-medium tabular-nums text-slate-600">
                                    {submission.score}/{submission.assignment.maxScore}
                                  </span>
                                ) : null}
                                <GradeBadge percent={pct} size="sm" />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : null}

                {group.attempts.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                      Test urinishlari
                    </p>
                    <Table>
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-600">
                          <th className="py-2.5 pr-3 text-left font-medium">Test</th>
                          <th className="px-3 py-2.5 text-left font-medium">Sana</th>
                          <th className="px-3 py-2.5 text-left font-medium">Holat</th>
                          <th className="px-3 py-2.5 text-right font-medium">Ball</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.attempts.map((attempt) => {
                          const quizMax = attempt.quiz.questions.reduce(
                            (sum, question) => sum + question.points,
                            0,
                          );
                          const attemptPercent =
                            attempt.score != null && quizMax > 0
                              ? Math.round((attempt.score / quizMax) * 100)
                              : null;
                          return (
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
                              <td className="px-3 py-3 text-right">
                                <span className="inline-flex items-center gap-2.5">
                                  {attempt.score != null && quizMax > 0 ? (
                                    <span className="text-xs font-medium tabular-nums text-slate-600">
                                      {attempt.score}/{quizMax}
                                    </span>
                                  ) : null}
                                  <GradeBadge percent={attemptPercent} size="sm" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
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

  const pendingSubmissions = submissions.filter((submission) => submission.score == null);
  const studentNames = new Map(
    enrollments.map((enrollment) => [enrollment.user.id, enrollment.user.name]),
  );

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
        <Stat
          label="Kutilmoqda"
          value={pendingSubmissions.length}
          hint={pendingSubmissions.length > 0 ? "Baholash navbatida" : "Navbat bo'sh"}
        />
        <Stat label="Baholangan" value={gradedSubmissions.length} />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Baholash navbati"
          subtitle={
            pendingSubmissions.length > 0
              ? `${pendingSubmissions.length} ta javob baho kutmoqda`
              : "Barcha topshirilgan javoblar baholangan"
          }
          action={
            pendingSubmissions.length > 0 ? (
              <Badge tone="amber">{pendingSubmissions.length} ta</Badge>
            ) : (
              <Badge tone="green">Tayyor</Badge>
            )
          }
        />
        <CardBody className="p-0">
          {pendingSubmissions.length === 0 ? (
            <div className="flex items-center gap-3 px-6 py-5 text-sm text-slate-500">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 4.5 4.5L19 7" />
                </svg>
              </span>
              Baholash navbatda turgan javob yo&apos;q.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingSubmissions
                .slice()
                .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
                .slice(0, 6)
                .map((submission, index) => {
                  const assignment = assignments.find(
                    (item) => item.id === submission.assignmentId,
                  );
                  const student = studentNames.get(submission.studentId) ?? "Talaba";
                  return (
                    <li
                      key={submission.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 animate-fade-up hover:bg-slate-50/70 sm:px-6"
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <Avatar name={student} className="size-9! text-[10px]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{student}</p>
                        <p className="truncate text-xs text-slate-500">
                          {assignment?.title ?? "Topshiriq"} · {fmtDate(submission.submittedAt)}
                        </p>
                      </div>
                      <ButtonLink
                        href={`/courses/${selected.slug}/assignments/${submission.assignmentId}`}
                        variant="secondary"
                        size="sm"
                        className="shrink-0"
                      >
                        Baholash
                      </ButtonLink>
                    </li>
                  );
                })}
            </ul>
          )}
        </CardBody>
      </Card>

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
            <div className="max-h-[70vh] overflow-auto overscroll-contain rounded-2xl border border-slate-200/70">
              <table className="w-full min-w-max text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th className="sticky left-0 top-0 z-30 min-w-44 bg-slate-50 px-4 py-3 text-left font-medium shadow-[inset_0_-1px_0_#e2e8f0]">
                      Talaba
                    </th>
                    {assignments.map((assignment) => (
                      <th
                        key={assignment.id}
                        className="sticky top-0 z-20 min-w-28 bg-slate-50 px-3 py-3 text-center font-medium shadow-[inset_0_-1px_0_#e2e8f0]"
                      >
                        <span className="mx-auto block max-w-32 truncate">{assignment.title}</span>
                        <span className="block font-normal text-slate-600">
                          max {assignment.maxScore}
                        </span>
                      </th>
                    ))}
                    <th className="sticky top-0 z-20 bg-brand-50 px-3 py-3 text-center font-semibold text-brand-800 shadow-[inset_0_-1px_0_#dbe4f4]">
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
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition-colors duration-150 group-hover:bg-slate-50">
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
                                  <GradeBadge
                                    percent={scorePercent(submission.score, assignment.maxScore)}
                                    size="sm"
                                  />
                                ) : (
                                  <SubmissionBadge status={submission.status} />
                                )
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="border-l border-brand-100/70 bg-brand-50/40 px-3 py-3 text-center text-sm font-semibold transition-colors duration-150 group-hover:bg-brand-50/70">
                          {average != null ? (
                            <span className={gradeColor(average)}>{average}%</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="text-xs text-slate-500">
                    <td className="sticky bottom-0 left-0 z-30 bg-slate-50 px-4 py-2.5 font-medium shadow-[inset_0_1px_0_#e2e8f0]">
                      O&apos;rtacha
                    </td>
                    {assignments.map((assignment) => {
                      const average = assignmentAverage(assignment.id, assignment.maxScore);
                      return (
                        <td
                          key={assignment.id}
                          className="sticky bottom-0 z-20 bg-slate-50 px-3 py-2.5 text-center font-semibold text-slate-600 shadow-[inset_0_1px_0_#e2e8f0]"
                        >
                          {average != null ? `${average}%` : "—"}
                        </td>
                      );
                    })}
                    <td className="sticky bottom-0 z-20 border-l border-brand-100/70 bg-brand-50 px-3 py-2.5 text-center font-semibold text-brand-800 shadow-[inset_0_1px_0_#dbe4f4]">
                      {totalMax > 0 ? `${Math.round((totalScore / totalMax) * 100)}%` : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
