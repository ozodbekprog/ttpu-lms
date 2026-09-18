import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, PageHeader } from "@/components/ui";
import { attendanceCounts, getStudentAttendance } from "@/app/api/attendance/summary/data";
import { StudentAttendanceOverview } from "@/components/attendance/overview-student";
import { StaffAttendanceOverview } from "@/components/attendance/overview-staff";
import type { AttendanceStatus } from "@prisma/client";

export default async function AttendancePage() {
  const user = await requireUser();

  if (user.role === "STUDENT") {
    const [summary, records] = await Promise.all([
      getStudentAttendance(user.id),
      prisma.attendance.findMany({
        where: { studentId: user.id },
        select: {
          id: true,
          date: true,
          status: true,
          course: { select: { title: true, slug: true } },
        },
        orderBy: [{ date: "desc" }, { id: "desc" }],
        take: 10,
      }),
    ]);

    const history = records.map((record) => ({
      id: record.id,
      date: record.date,
      status: record.status,
      courseTitle: record.course.title,
      courseSlug: record.course.slug,
    }));

    return (
      <>
        <PageHeader
          eyebrow="Davomat"
          title="Mening davomatim"
          subtitle={`${user.group?.name ?? "Talaba"} · ${summary.courses.length} ta kurs`}
          action={
            <ButtonLink href="/attendance/check-in" size="sm">
              QR check-in
            </ButtonLink>
          }
        />
        <StudentAttendanceOverview summary={summary} history={history} />
      </>
    );
  }

  const courses = await prisma.course.findMany({
    where: user.role === "ADMIN" ? {} : { teacherId: user.id },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      _count: { select: { enrollments: true, attendance: true } },
    },
    orderBy: { title: "asc" },
  });

  const records = await prisma.attendance.findMany({
    where: { courseId: { in: courses.map((course) => course.id) } },
    select: { courseId: true, status: true },
  });

  const byCourse = new Map<string, AttendanceStatus[]>();
  for (const record of records) {
    const list = byCourse.get(record.courseId);
    if (list) {
      list.push(record.status);
    } else {
      byCourse.set(record.courseId, [record.status]);
    }
  }

  const rows = courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    isPublished: course.isPublished,
    students: course._count.enrollments,
    ...attendanceCounts(byCourse.get(course.id) ?? []),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Davomat"
        title="Davomat nazorati"
        subtitle={
          user.role === "ADMIN"
            ? "Administrator paneli · barcha kurslar"
            : "O'qituvchi paneli · sizning kurslaringiz"
        }
      />
      <StaffAttendanceOverview courses={rows} />
    </>
  );
}
