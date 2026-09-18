import { requireUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ScheduleBoard } from "@/components/schedule/schedule-board";
import type { ScheduleEntryItem } from "@/components/schedule/types";
import { isoWeekday, resolveWeekStart } from "@/components/schedule/week-utils";
import { todayIso } from "@/components/attendance/lesson-utils";

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
            teacher: true,
            room: true,
            parity: true,
            status: true,
            note: true,
            group: { select: { name: true } },
          },
        });

  const entries: ScheduleEntryItem[] = rows.map((row) => ({
    id: row.id,
    groupId: row.groupId,
    groupName: row.group.name,
    dayOfWeek: row.dayOfWeek,
    slot: row.slot,
    subject: row.subject,
    teacher: row.teacher,
    room: row.room,
    parity: row.parity,
    status: row.status,
    note: row.note,
  }));

  return (
    <>
      <PageHeader
        title="Dars jadvali"
        subtitle={selectedGroup ? `${selectedGroup.name} guruhi — haftalik jadval` : undefined}
      />
      <ScheduleBoard
        canEdit={staff}
        groups={groups}
        selectedGroupId={selectedGroup?.id ?? null}
        entries={entries}
        today={isoWeekday(now)}
        isCurrentWeek={weekStart === currentWeekStart}
        weekStart={weekStart}
        todayIso={dateToday}
        nowMinutes={now.getHours() * 60 + now.getMinutes()}
      />
    </>
  );
}
