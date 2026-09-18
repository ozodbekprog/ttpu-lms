import { requireUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ScheduleBoard } from "@/components/schedule/schedule-board";
import type { BoardEntry, PaletteBlock } from "@/components/schedule/builder/types";
import { isoWeekday, resolveWeekStart } from "@/components/schedule/week-utils";
import { todayIso } from "@/components/attendance/lesson-utils";

type TeacherChoice = { id: string; name: string };

type PaletteSource = {
  id: string;
  title: string;
  subjectId: string | null;
  color: string | null;
  teacherId: string | null;
  teacherName: string | null;
  teacherChoices: TeacherChoice[];
};

function matchesCourse(
  entry: { subject: string; subjectId: string | null },
  course: { title: string; subjectId: string | null },
) {
  if (course.subjectId && entry.subjectId === course.subjectId) return true;
  return entry.subject.trim().toLowerCase() === course.title.trim().toLowerCase();
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const staff = isStaff(user.role);

  const groups = staff
    ? await prisma.group.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : user.group
      ? [{ id: user.group.id, name: user.group.name }]
      : [];

  const requested = typeof params.groupId === "string" ? params.groupId : null;
  const selectedGroup = groups.find((group) => group.id === requested) ?? groups[0] ?? null;

  const weekParam = typeof params.week === "string" ? params.week : null;
  const weekStart = resolveWeekStart(weekParam);
  const dateToday = todayIso();
  const currentWeekStart = resolveWeekStart(dateToday);
  const now = new Date();

  const where = staff
    ? {}
    : selectedGroup
      ? { groupId: selectedGroup.id }
      : null;

  const rows =
    where === null
      ? []
      : await prisma.scheduleEntry.findMany({
          where,
          orderBy: [{ dayOfWeek: "asc" }, { slot: "asc" }],
          select: {
            id: true,
            groupId: true,
            dayOfWeek: true,
            slot: true,
            subject: true,
            subjectId: true,
            lessonType: true,
            teacher: true,
            teacherId: true,
            room: true,
            parity: true,
            status: true,
            note: true,
            updatedAt: true,
            group: { select: { name: true } },
            subjectRef: { select: { name: true, color: true } },
            teacherRef: { select: { id: true, name: true } },
          },
        });

  const entries: BoardEntry[] = rows.map((row) => ({
    id: row.id,
    groupId: row.groupId,
    groupName: row.group.name,
    dayOfWeek: row.dayOfWeek,
    slot: row.slot,
    subject: row.subject,
    subjectId: row.subjectId,
    lessonType: row.lessonType,
    subjectRef: row.subjectRef ? { name: row.subjectRef.name, color: row.subjectRef.color } : null,
    teacher: row.teacher,
    teacherId: row.teacherId,
    teacherRef: row.teacherRef ? { id: row.teacherRef.id, name: row.teacherRef.name } : null,
    room: row.room,
    parity: row.parity,
    status: row.status,
    note: row.note,
  }));

  let palette: PaletteBlock[] = [];
  let teacherOptions: TeacherChoice[] = [];

  if (staff && selectedGroup) {
    let sources: PaletteSource[] = [];

    if (user.role === "TEACHER") {
      const attached = await prisma.teacherSubject.findMany({
        where: { teacherId: user.id },
        orderBy: { subject: { name: "asc" } },
        select: { subject: { select: { id: true, name: true, color: true } } },
      });

      if (attached.length > 0) {
        sources = attached.map(({ subject }) => ({
          id: subject.id,
          title: subject.name,
          subjectId: subject.id,
          color: subject.color,
          teacherId: user.id,
          teacherName: user.name,
          teacherChoices: [{ id: user.id, name: user.name }],
        }));
      } else {
        const courseRows = await prisma.course.findMany({
          where: { teacherId: user.id, enrollments: { some: { user: { groupId: selectedGroup.id } } } },
          orderBy: { title: "asc" },
          select: {
            id: true,
            title: true,
            subjectId: true,
            coverColor: true,
            subject: { select: { color: true } },
          },
        });
        sources = courseRows.map((course) => ({
          id: course.id,
          title: course.title,
          subjectId: course.subjectId,
          color: course.subject?.color ?? course.coverColor,
          teacherId: user.id,
          teacherName: user.name,
          teacherChoices: [{ id: user.id, name: user.name }],
        }));
      }
    } else {
      const courseRows = await prisma.course.findMany({
        where: {},
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          subjectId: true,
          coverColor: true,
          subject: { select: { color: true } },
          teacher: { select: { id: true, name: true } },
        },
      });

      const subjectIds = Array.from(
        new Set(courseRows.flatMap((course) => (course.subjectId ? [course.subjectId] : []))),
      );
      const subjectTeacherRows =
        subjectIds.length === 0
          ? []
          : await prisma.teacherSubject.findMany({
              where: { subjectId: { in: subjectIds } },
              orderBy: { teacher: { name: "asc" } },
              select: { subjectId: true, teacher: { select: { id: true, name: true } } },
            });
      const choicesBySubject = new Map<string, TeacherChoice[]>();
      for (const row of subjectTeacherRows) {
        const list = choicesBySubject.get(row.subjectId) ?? [];
        if (!list.some((item) => item.id === row.teacher.id)) list.push(row.teacher);
        choicesBySubject.set(row.subjectId, list);
      }

      sources = courseRows.map((course) => {
        const choices = course.subjectId ? choicesBySubject.get(course.subjectId) ?? [] : [];
        return {
          id: course.id,
          title: course.title,
          subjectId: course.subjectId,
          color: course.subject?.color ?? course.coverColor,
          teacherId: choices[0]?.id ?? course.teacher.id,
          teacherName: choices[0]?.name ?? course.teacher.name,
          teacherChoices: choices,
        };
      });
    }

    const groupRows = rows.filter((row) => row.groupId === selectedGroup.id);

    palette = sources.map((source) => {
      const matched = groupRows.filter((row) => matchesCourse(row, source));
      const sorted = matched
        .slice()
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return {
        id: source.id,
        title: source.title,
        subjectId: source.subjectId,
        color: source.color,
        teacherName: source.teacherName,
        teacherId: source.teacherId,
        teacherChoices: source.teacherChoices,
        placedCount: matched.length,
        lessonType: sorted.find((row) => row.lessonType)?.lessonType ?? "Ma'ruza",
        room: sorted.find((row) => row.room)?.room ?? null,
      };
    });

    if (user.role === "ADMIN") {
      const teacherRows = await prisma.user.findMany({
        where: { role: "TEACHER", isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
      teacherOptions = teacherRows.map((row) => ({ id: row.id, name: row.name }));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="TTPU LMS"
        title="Dars jadvali"
        subtitle={selectedGroup ? `${selectedGroup.name} guruhi — haftalik jadval` : undefined}
      />
      <ScheduleBoard
        key={selectedGroup?.id ?? "none"}
        canEdit={staff}
        role={user.role === "ADMIN" ? "ADMIN" : user.role === "TEACHER" ? "TEACHER" : "STUDENT"}
        userId={user.id}
        userName={user.name}
        groups={groups}
        selectedGroupId={selectedGroup?.id ?? null}
        entries={entries}
        today={isoWeekday(now)}
        isCurrentWeek={weekStart === currentWeekStart}
        weekStart={weekStart}
        todayIso={dateToday}
        nowMinutes={now.getHours() * 60 + now.getMinutes()}
        palette={palette}
        teacherOptions={teacherOptions}
      />
    </>
  );
}
