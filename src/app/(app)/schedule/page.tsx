import { requireUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ScheduleBoard } from "@/components/schedule/schedule-board";
import type { ScheduleEntryItem } from "@/components/schedule/schedule-board";

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

  const entries: ScheduleEntryItem[] = selectedGroup
    ? await prisma.scheduleEntry.findMany({
        where: { groupId: selectedGroup.id },
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
        },
      })
    : [];

  const rawDay = new Date().getDay();
  const today = rawDay === 0 ? 7 : rawDay;

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
        today={today}
      />
    </>
  );
}
