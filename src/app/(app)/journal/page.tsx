import { redirect } from "next/navigation";
import { requireUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader } from "@/components/ui";
import { SessionPanel } from "@/components/attendance/SessionPanel";
import { AttendanceJournal } from "@/components/attendance/attendance-journal";
import { JournalCourseSelect } from "@/components/attendance/journal-course-select";
import { getAttendanceJournal } from "@/app/api/courses/[id]/attendance/journal/data";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/attendance");

  const { course: courseParam } = await searchParams;

  const courses = await prisma.course.findMany({
    where: user.role === "TEACHER" ? { teacherId: user.id } : {},
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true },
  });

  if (courses.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Davomat" title="Jurnal" subtitle="Kurslar topilmadi" />
        <EmptyState
          title="Kurslar yo'q"
          description="Sizga biriktirilgan kurslar hali mavjud emas."
        />
      </>
    );
  }

  const selected = courses.find((course) => course.slug === courseParam) ?? courses[0];
  const journal = await getAttendanceJournal(selected.id);

  return (
    <>
      <PageHeader
        eyebrow="Davomat"
        title="Jurnal"
        subtitle={`${selected.title} · ${journal.students.length} ta talaba · ${journal.dates.length} ta dars`}
      />
      <div className="space-y-6">
        {courses.length > 1 ? (
          <JournalCourseSelect courses={courses} value={selected.slug} />
        ) : null}
        <SessionPanel courseId={selected.id} studentCount={journal.students.length} />
        <AttendanceJournal
          courseId={selected.id}
          attendanceHref={`/courses/${selected.slug}/attendance`}
          students={journal.students}
          dates={journal.dates}
          records={journal.records}
          currentUserId={user.id}
          canEdit
        />
      </div>
    </>
  );
}
