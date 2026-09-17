import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  Stat,
  Table,
} from "@/components/ui";
import { cn, fmtDate, fmtDateTime, gradeColor } from "@/lib/utils";
import { SubmissionBadge } from "@/components/courses/assignments-status";

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

    return (
      <>
        <PageHeader title="Baholarim" subtitle={user.group?.name ?? "Talaba"} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Baholangan topshiriqlar"
            value={graded.length}
            hint={`Jami ${submissions.length} ta javob`}
          />
          <Stat label="O'rtacha natija" value={average != null ? `${average}%` : "—"} />
          <Stat label="Test urinishlari" value={attempts.length} />
        </div>

        <Card className="mt-6">
          <CardHeader title="Topshiriq baholari" subtitle={`${submissions.length} ta javob`} />
          <CardBody>
            {submissions.length === 0 ? (
              <EmptyState
                title="Topshiriq javoblari yo'q"
                description="Kurs topshiriqlarini topshirganingizdan so'ng baholar shu yerda ko'rinadi."
              />
            ) : (
              <Table>
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 text-left font-medium">Kurs</th>
                    <th className="px-3 py-2 text-left font-medium">Topshiriq</th>
                    <th className="px-3 py-2 text-left font-medium">Muddat</th>
                    <th className="px-3 py-2 text-left font-medium">Holat</th>
                    <th className="px-3 py-2 text-right font-medium">Ball</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 pr-3 text-sm text-slate-500">
                        {submission.assignment.course.title}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-medium text-slate-800">
                        <Link
                          href={`/courses/${submission.assignment.course.slug}/assignments/${submission.assignmentId}`}
                          className="hover:text-blue-600"
                        >
                          {submission.assignment.title}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">
                        {fmtDate(submission.assignment.dueAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <SubmissionBadge status={submission.status} />
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right text-sm font-semibold",
                          gradeColor(submission.score, submission.assignment.maxScore),
                        )}
                      >
                        {submission.score != null
                          ? `${submission.score}/${submission.assignment.maxScore}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader title="Test urinishlari" subtitle={`${attempts.length} ta`} />
          <CardBody>
            {attempts.length === 0 ? (
              <p className="text-sm text-slate-500">Test topshirilmagan.</p>
            ) : (
              <Table>
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 text-left font-medium">Kurs</th>
                    <th className="px-3 py-2 text-left font-medium">Test</th>
                    <th className="px-3 py-2 text-left font-medium">Sana</th>
                    <th className="px-3 py-2 text-left font-medium">Holat</th>
                    <th className="px-3 py-2 text-right font-medium">Ball</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 pr-3 text-sm text-slate-500">{attempt.quiz.course.title}</td>
                      <td className="px-3 py-2.5 text-sm font-medium text-slate-800">
                        {attempt.quiz.title}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">
                        {fmtDateTime(attempt.finishedAt ?? attempt.startedAt)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-500">
                        {attempt.finishedAt ? "Tugallangan" : "Tugallanmagan"}
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-700">
                        {attempt.score != null ? attempt.score : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
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
            <Select name="courseId" defaultValue={selected.id} className="w-64">
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
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="sticky left-0 bg-white py-2 pr-4 text-left font-medium">
                    Talaba
                  </th>
                  {assignments.map((assignment) => (
                    <th key={assignment.id} className="min-w-28 px-3 py-2 text-center font-medium">
                      <span className="block max-w-32 truncate">{assignment.title}</span>
                      <span className="block font-normal text-slate-400">max {assignment.maxScore}</span>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-medium">O&apos;rtacha</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => {
                  const average = studentAverage(enrollment.user.id);
                  return (
                    <tr
                      key={enrollment.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="sticky left-0 bg-white py-2.5 pr-4 text-sm font-medium text-slate-800">
                        {enrollment.user.name}
                      </td>
                      {assignments.map((assignment) => {
                        const submission = byStudentAssignment.get(
                          `${enrollment.user.id}:${assignment.id}`,
                        );
                        return (
                          <td key={assignment.id} className="px-3 py-2.5 text-center text-sm">
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
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right text-sm font-semibold",
                          average != null ? gradeColor(average) : "text-slate-300",
                        )}
                      >
                        {average != null ? `${average}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 text-xs text-slate-500">
                  <td className="sticky left-0 bg-slate-50 py-2 pr-4 font-medium">
                    O&apos;rtacha
                  </td>
                  {assignments.map((assignment) => {
                    const average = assignmentAverage(assignment.id, assignment.maxScore);
                    return (
                      <td key={assignment.id} className="px-3 py-2 text-center font-medium">
                        {average != null ? `${average}%` : "—"}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-semibold">
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
