import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, PageHeader } from "@/components/ui";
import { canManageCourse } from "@/components/courses/course-access";
import { AttendanceJournal } from "@/components/attendance/attendance-journal";
import { getAttendanceJournal } from "@/app/api/courses/[id]/attendance/journal/data";

export default async function AttendanceJournalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) notFound();

  const management = canManageCourse(user, course);
  if (!management) {
    if (user.role !== "STUDENT") notFound();
    const enrolled = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: course.id, userId: user.id } },
    });
    if (!enrolled) notFound();
  }

  const journal = await getAttendanceJournal(course.id);

  return (
    <>
      <PageHeader
        eyebrow="Davomat"
        title="Guruh jurnali"
        subtitle={`${course.title} · ${journal.students.length} ta talaba · ${journal.dates.length} ta dars`}
        action={
          <ButtonLink
            href={`/courses/${course.slug}/attendance`}
            variant="secondary"
            size="sm"
          >
            Davomat bo&apos;limi
          </ButtonLink>
        }
      />
      <AttendanceJournal
        courseId={course.id}
        attendanceHref={`/courses/${course.slug}/attendance`}
        students={journal.students}
        dates={journal.dates}
        records={journal.records}
        currentUserId={user.id}
        canEdit={management}
      />
    </>
  );
}
