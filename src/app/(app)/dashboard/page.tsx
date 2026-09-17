import { requireUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardBody, EmptyState, PageHeader, Stat, Badge } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();

  if (isStaff(user.role)) {
    const where = user.role === "TEACHER" ? { teacherId: user.id } : {};
    const [courses, students, submissions, quizzes] = await Promise.all([
      prisma.course.count({ where }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.submission.count({
        where: { assignment: user.role === "TEACHER" ? { course: { teacherId: user.id } } : {} },
      }),
      prisma.quiz.count({
        where: user.role === "TEACHER" ? { course: { teacherId: user.id } } : {},
      }),
    ]);
    return (
      <>
        <PageHeader title={`Salom, ${user.name.split(" ")[0]}!`} subtitle="O'qituvchi paneli" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Kurslar" value={courses} />
          <Stat label="Talabalar" value={students} />
          <Stat label="Topshiriqlar" value={submissions} />
          <Stat label="Testlar" value={quizzes} />
        </div>
      </>
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: { include: { teacher: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const upcoming = await prisma.assignment.findMany({
    where: { courseId: { in: enrollments.map((e) => e.courseId) } },
    orderBy: { dueAt: "asc" },
    take: 5,
    include: {
      course: true,
      submissions: { where: { studentId: user.id } },
    },
  });

  const today = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const scheduleToday = user.groupId
    ? await prisma.scheduleEntry.findMany({
        where: { groupId: user.groupId, dayOfWeek: today },
        orderBy: { slot: "asc" },
      })
    : [];

  return (
    <>
      <PageHeader
        title={`Salom, ${user.name.split(" ")[0]}!`}
        subtitle={`${user.group?.name ?? "Talaba"} guruhi`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Kurslarim" subtitle={`${enrollments.length} ta kurs`} />
          <CardBody className="space-y-3">
            {enrollments.length === 0 ? (
              <p className="text-sm text-slate-500">Hozircha kurslar yo'q.</p>
            ) : (
              enrollments.map((e) => (
                <Link
                  key={e.id}
                  href={`/courses/${e.course.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <span
                    className="size-9 shrink-0 rounded-lg"
                    style={{ backgroundColor: e.course.coverColor }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {e.course.title}
                    </span>
                    <span className="block text-xs text-slate-500">{e.course.teacher.name}</span>
                  </span>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Bugungi darslar" subtitle={user.group?.name} />
            <CardBody className="space-y-2">
              {scheduleToday.length === 0 ? (
                <p className="text-sm text-slate-500">Bugun dars yo'q 🎉</p>
              ) : (
                scheduleToday.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 text-sm">
                    <Badge tone="blue">{s.slot}-par</Badge>
                    <span className="font-medium text-slate-800">{s.subject}</span>
                    <span className="text-slate-500">{s.room}</span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Yaqin topshiriqlar" />
            <CardBody className="space-y-2">
              {upcoming.length === 0 ? (
                <EmptyState title="Topshiriqlar yo'q" />
              ) : (
                upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">{a.title}</span>
                      <span className="block text-xs text-slate-500">{a.course.title}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{fmtDate(a.dueAt)}</span>
                    {a.submissions.length > 0 ? <Badge tone="green">Topshirilgan</Badge> : null}
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
