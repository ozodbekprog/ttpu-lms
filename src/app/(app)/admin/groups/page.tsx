import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import GroupsManager from "@/components/admin/GroupsManager";

export default async function AdminGroupsPage() {
  await requireRole(["ADMIN"]);

  const groups = await prisma.group.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });

  const data = groups.map((group) => ({
    id: group.id,
    name: group.name,
    year: group.year,
    userCount: group._count.users,
  }));

  return (
    <>
      <PageHeader title="Guruhlar" subtitle={`${data.length} ta guruh`} />
      <GroupsManager groups={data} />
    </>
  );
}
