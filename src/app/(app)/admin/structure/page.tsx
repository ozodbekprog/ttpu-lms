import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import StructureManager from "@/components/admin/StructureManager";

export default async function AdminStructurePage() {
  await requireRole(["ADMIN"]);

  const [faculties, terms, groups] = await Promise.all([
    prisma.faculty.findMany({
      include: { _count: { select: { groups: true } }, groups: { select: { id: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.term.findMany({
      include: { _count: { select: { sessions: true } } },
      orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
    }),
    prisma.group.findMany({
      select: { id: true, name: true, facultyId: true, _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const facultyData = faculties.map((faculty) => ({
    id: faculty.id,
    name: faculty.name,
    code: faculty.code,
    groupsCount: faculty._count.groups,
    groupIds: faculty.groups.map((group) => group.id),
  }));

  const termData = terms.map((term) => ({
    id: term.id,
    name: term.name,
    startDate: term.startDate.toISOString(),
    endDate: term.endDate.toISOString(),
    isActive: term.isActive,
    sessionsCount: term._count.sessions,
  }));

  const groupData = groups.map((group) => ({
    id: group.id,
    name: group.name,
    facultyId: group.facultyId,
    userCount: group._count.users,
  }));

  const totalGroups = groupData.filter((group) => group.facultyId).length;

  return (
    <>
      <PageHeader
        eyebrow="Boshqaruv"
        title="Tuzilma"
        subtitle={`${facultyData.length} ta fakultet · ${termData.length} ta semestr · ${totalGroups}/${groupData.length} guruh biriktirilgan`}
      />
      <StructureManager faculties={facultyData} terms={termData} groups={groupData} />
    </>
  );
}
