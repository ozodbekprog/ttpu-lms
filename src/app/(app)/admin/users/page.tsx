import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, Input, PageHeader, Select } from "@/components/ui";
import UsersManager from "@/components/admin/UsersManager";

const ROLES = ["ADMIN", "TEACHER", "STUDENT"] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const admin = await requireRole(["ADMIN"]);
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const role =
    typeof params.role === "string" && ROLES.includes(params.role as (typeof ROLES)[number])
      ? (params.role as (typeof ROLES)[number])
      : "";

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role) where.role = role;

  const [users, groups] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="Foydalanuvchilar" subtitle={`${users.length} ta natija`} />

      <form action="/admin/users" method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Ism yoki email..." className="max-w-xs" />
        <Select name="role" defaultValue={role} className="max-w-44">
          <option value="">Barcha rollar</option>
          <option value="STUDENT">Talaba</option>
          <option value="TEACHER">O'qituvchi</option>
          <option value="ADMIN">Administrator</option>
        </Select>
        <Button type="submit" variant="secondary">
          Qidirish
        </Button>
      </form>

      <UsersManager users={users} groups={groups} currentUserId={admin.id} />
    </>
  );
}
