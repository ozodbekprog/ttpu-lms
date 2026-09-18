import { redirect } from "next/navigation";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { ScheduleBuilder } from "@/components/schedule/builder/schedule-builder";
import type { BuilderCourse, BuilderEntry, BuilderGroup } from "@/components/schedule/builder/types";
import { formatWeekRange, isoWeekNumber, resolveWeekStart, weekParityOf } from "@/components/schedule/week-utils";

const STANDARD_ROOMS = ["203", "205", "304", "LAB 403", "Green Hall", "Yellow Hall", "Conference Hall", "Onlayn"];

export default async function ScheduleBuilderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/schedule");

  const params = await searchParams;
  const groups: BuilderGroup[] = await prisma.group.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const requestedGroup = typeof params.groupId === "string" ? params.groupId : null;
  const selectedGroup = groups.find((group) => group.id === requestedGroup) ?? groups[0] ?? null;
  const weekStart = resolveWeekStart(typeof params.week === "string" ? params.week : null);
  const weekParity = weekParityOf(weekStart);

  if (!selectedGroup) {
    return (
      <>
        <PageHeader title="Jadval konstruktori" subtitle="LEGO uslubida vizual jadval" />
        <EmptyState
          title="Guruhlar topilmadi"
          description="Konstruktor ishlashi uchun avval guruh yarating."
        />
      </>
    );
  }

  const rowEntries = await prisma.scheduleEntry.findMany({
    where: { groupId: selectedGroup.id },
    orderBy: [{ dayOfWeek: "asc" }, { slot: "asc" }],
    include: { subjectRef: { select: { name: true, color: true } } },
  });

  const courseRows = await prisma.course.findMany({
    where: user.role === "ADMIN" ? {} : { teacherId: user.id },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      subjectId: true,
      coverColor: true,
      teacher: { select: { name: true } },
    },
  });
  const courses: BuilderCourse[] = courseRows.map((course) => ({
    id: course.id,
    title: course.title,
    teacherName: course.teacher.name,
    subjectId: course.subjectId,
    coverColor: course.coverColor,
  }));

  let myGroupIds: string[] = [];
  if (user.role === "TEACHER") {
    const enrollments = await prisma.enrollment.findMany({
      where: { course: { teacherId: user.id }, user: { groupId: { not: null } } },
      select: { user: { select: { groupId: true } } },
    });
    const taught = new Set<string>();
    for (const row of enrollments) {
      if (row.user.groupId) taught.add(row.user.groupId);
    }
    myGroupIds = groups.filter((group) => taught.has(group.id)).map((group) => group.id);
  }

  const roomSet = new Set<string>(STANDARD_ROOMS);
  const existingRooms = await prisma.scheduleEntry.findMany({
    where: { room: { not: null } },
    select: { room: true },
    distinct: ["room"],
  });
  for (const row of existingRooms) {
    if (row.room) roomSet.add(row.room);
  }

  const teacherSet = new Set<string>();
  if (user.role === "ADMIN") {
    const teacherRows = await prisma.user.findMany({
      where: { role: "TEACHER", isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    });
    for (const row of teacherRows) teacherSet.add(row.name);
    const entryTeacherRows = await prisma.scheduleEntry.findMany({
      where: { teacher: { not: null } },
      select: { teacher: true },
      distinct: ["teacher"],
    });
    for (const row of entryTeacherRows) {
      if (row.teacher) teacherSet.add(row.teacher);
    }
  }

  const entries: BuilderEntry[] = rowEntries.map((entry) => ({
    id: entry.id,
    groupId: entry.groupId,
    dayOfWeek: entry.dayOfWeek,
    slot: entry.slot,
    subject: entry.subject,
    subjectId: entry.subjectId,
    lessonType: entry.lessonType,
    subjectRef: entry.subjectRef ? { name: entry.subjectRef.name, color: entry.subjectRef.color } : null,
    teacher: entry.teacher,
    room: entry.room,
    parity: entry.parity,
    status: entry.status,
    note: entry.note,
  }));

  const backHref = `/schedule?groupId=${encodeURIComponent(selectedGroup.id)}&week=${weekStart}`;

  return (
    <>
      <PageHeader
        eyebrow="Jadval 2.0"
        title="Jadval konstruktori"
        subtitle={`${selectedGroup.name} guruhi — ${formatWeekRange(weekStart)}`}
        action={
          <ButtonLink href={backHref} variant="secondary">
            Jadvalga qaytish
          </ButtonLink>
        }
      />
      <ScheduleBuilder
        key={`${selectedGroup.id}-${weekStart}`}
        role={user.role === "ADMIN" ? "ADMIN" : "TEACHER"}
        userName={user.name}
        groups={groups}
        myGroupIds={myGroupIds}
        selectedGroupId={selectedGroup.id}
        weekStart={weekStart}
        weekParity={weekParity}
        weekNumber={isoWeekNumber(weekStart)}
        entries={entries}
        courses={courses}
        teacherOptions={Array.from(teacherSet).sort((a, b) => a.localeCompare(b))}
        roomOptions={Array.from(roomSet)}
      />
    </>
  );
}
